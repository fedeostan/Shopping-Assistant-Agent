import type {
  N8nChatRequest,
  N8nStreamChunk,
  N8nClientConfig,
} from './types'

// Default configuration
const DEFAULT_CONFIG: Required<N8nClientConfig> = {
  webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://fedeostan.app.n8n.cloud/webhook/shopping-assistant-api',
  timeout: 95000, // 95 seconds (n8n Cloud has 100s timeout)
  maxRetries: 3,
}

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 16000 // 16 seconds
const BACKOFF_MULTIPLIER = 2

/**
 * Calculate delay for exponential backoff with jitter
 */
function getRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt),
    MAX_RETRY_DELAY
  )
  // Add jitter (±25% randomization)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.round(exponentialDelay + jitter)
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'AbortError') return false // Timeout, don't retry
    if (error.message.includes('fetch')) return true
    if (error.message.includes('network')) return true
  }

  // Check response status codes
  if (error instanceof Response) {
    // Retry on server errors (5xx) and rate limiting (429)
    return error.status >= 500 || error.status === 429
  }

  return false
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse a single JSONL line into a chunk
 */
export function parseChunk(line: string): N8nStreamChunk | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed) as N8nStreamChunk
  } catch {
    console.error('Failed to parse chunk:', trimmed)
    return null
  }
}

/**
 * Create an async generator that streams chunks from n8n webhook
 */
export async function* streamChat(
  request: N8nChatRequest,
  config: Partial<N8nClientConfig> = {}
): AsyncGenerator<N8nStreamChunk, void, unknown> {
  const { webhookUrl, timeout, maxRetries } = { ...DEFAULT_CONFIG, ...config }

  let lastError: unknown = null
  let attempt = 0

  while (attempt <= maxRetries) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (isRetryableError(response) && attempt < maxRetries) {
          lastError = response
          const delay = getRetryDelay(attempt)
          console.warn(`n8n request failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await sleep(delay)
          attempt++
          continue
        }

        const errorText = await response.text().catch(() => 'Unknown error')

        // Provide helpful error message for common issues
        let errorMessage = `n8n webhook error: ${response.status} ${response.statusText}`
        if (response.status === 404) {
          errorMessage = `n8n webhook not found (404). Verify N8N_WEBHOOK_URL in .env.local matches your n8n webhook path. Expected: https://fedeostan.app.n8n.cloud/webhook/shopping-assistant-api`
          console.error(`[n8n] Webhook 404 - Current URL: ${webhookUrl}`)
        }

        yield {
          type: 'error',
          message: errorMessage,
          code: errorText,
        }
        return
      }

      // Check for streaming response
      const contentType = response.headers.get('content-type')
      const isStreaming = contentType?.includes('ndjson') || contentType?.includes('stream')

      if (!response.body) {
        // Non-streaming response, parse as single JSON
        const data = await response.json()
        if (data.error) {
          yield { type: 'error', message: data.error }
        } else {
          yield { type: 'begin' }
          yield { type: 'item', content: data.output || data.message || JSON.stringify(data) }
          yield { type: 'end' }
        }
        return
      }

      if (!isStreaming) {
        // Non-streaming response with body
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          yield { type: 'begin' }
          yield { type: 'item', content: data.output || data.message || JSON.stringify(data) }
          yield { type: 'end' }
        } catch {
          yield { type: 'begin' }
          yield { type: 'item', content: text }
          yield { type: 'end' }
        }
        return
      }

      // Streaming response - process JSONL
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const chunk = parseChunk(buffer)
            if (chunk) yield chunk
          }
          break
        }

        // Decode and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const chunk = parseChunk(line)
          if (chunk) yield chunk
        }
      }

      // Success - exit retry loop
      return
    } catch (error) {
      clearTimeout(timeoutId)

      if (isRetryableError(error) && attempt < maxRetries) {
        lastError = error
        const delay = getRetryDelay(attempt)
        console.warn(`n8n request error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, error)
        await sleep(delay)
        attempt++
        continue
      }

      // Non-retryable error or max retries reached
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred'

      yield {
        type: 'error',
        message: `Failed to connect to n8n: ${errorMessage}`,
        code: error instanceof Error ? error.name : undefined,
      }
      return
    }
  }

  // Max retries exhausted
  yield {
    type: 'error',
    message: `Max retries (${maxRetries}) exceeded`,
    code: lastError instanceof Error ? lastError.message : String(lastError),
  }
}

/**
 * Non-streaming chat request (for simple responses)
 */
export async function sendChatMessage(
  request: N8nChatRequest,
  config: Partial<N8nClientConfig> = {}
): Promise<{ success: boolean; content: string; error?: string }> {
  const chunks: N8nStreamChunk[] = []

  for await (const chunk of streamChat(request, config)) {
    chunks.push(chunk)
  }

  // Check for errors
  const errorChunk = chunks.find((c): c is Extract<N8nStreamChunk, { type: 'error' }> => c.type === 'error')
  if (errorChunk) {
    return { success: false, content: '', error: errorChunk.message }
  }

  // Collect all text content
  const textContent = chunks
    .filter((c): c is Extract<N8nStreamChunk, { type: 'item' }> => c.type === 'item')
    .map((c) => c.content)
    .join('')

  return { success: true, content: textContent }
}

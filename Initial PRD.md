# Technical PRD: Next.js + Supabase Chat for n8n AI Agent

A retail product discovery chat application implementing Google's Universal Commerce Protocol (UCP) with streaming UX and extensible component architecture.

## Bottom line

This PRD defines a Next.js 15 chat application that connects to an n8n AI agent workflow via webhooks, uses Supabase for authentication and chat persistence, and follows Google's Universal Commerce Protocol for product discovery. The architecture supports streaming responses with "thinking" indicators, a collapsible chat history sidebar, and an extensible message component system designed for future rich content like product cards.

---

## Project context and goals

The application serves as a **frontend wrapper** for an n8n AI agent workflow that handles retail product discovery. Users interact through a ChatGPT-like interface while the n8n agent performs product searches, recommendations, and discovery tasks following UCP standards. The n8n agent maintains its own conversation memory, so Supabase primarily handles user authentication and chat history syncing for the UI.

**Core user experience goals:**
- Streaming text responses with progressive rendering (typing effect)
- Visual indicators showing agent "thinking" and tool usage
- Left sidebar for conversation history with open/close toggle
- "New chat" button at the top of the sidebar
- Chat interface occupying the main content area

**Future extensibility requirements:**
- Product cards with images, prices, and actions
- Image messages and carousels
- Rich card components with action buttons
- System notifications and status updates

---

## Technology stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js App Router | 15.x |
| **Language** | TypeScript | 5.x (strict mode) |
| **Styling** | Tailwind CSS | 3.4+ |
| **Auth & Database** | Supabase | Latest |
| **State Management** | Zustand | 5.x |
| **AI Integration** | Vercel AI SDK | 5.x |
| **Streaming** | Server-Sent Events (SSE) | - |

---

## Google Universal Commerce Protocol (UCP) integration

UCP is Google's new open-source protocol (announced January 2026) for agentic commerce. For this **product discovery** application, the focus is on understanding UCP schemas rather than implementing full checkout.

### UCP compliance requirements for product discovery agents

**Agent profile declaration**: The application should declare supported UCP capabilities in requests via the `UCP-Agent` header pattern. For discovery-only agents, this signals intent without checkout capabilities.

**Product data schema alignment**: When displaying product information from the n8n agent, structure data compatible with UCP's item schema:

```typescript
interface UCPProductItem {
  id: string;
  title: string;
  price: number; // in cents
  currency: string;
  imageUrl?: string;
  description?: string;
  url?: string; // Link to merchant product page
}
```

**Response handling**: UCP uses synchronous request-response for product discovery and webhooks for order lifecycle events. Since this is discovery-only (no purchasing), the n8n agent will return product data that the frontend renders as rich product cards.

**Discovery protocol flow**:
1. User sends natural language query → n8n agent
2. n8n agent searches product catalogs using UCP-compliant queries
3. Agent returns structured product recommendations
4. Frontend renders products as interactive cards with merchant links

---

## n8n webhook integration architecture

### Streaming configuration

n8n supports native streaming via SSE when configured correctly. The webhook response should use **JSONL format** (newline-delimited JSON) with structured chunk types.

**Expected chunk types from n8n**:
- `begin` / `end` - Stream lifecycle markers
- `item` - Content chunks (text, products, etc.)
- `tool-call-start` / `tool-call-end` - Agent tool usage visibility
- `node-execute-before` / `node-execute-after` - Workflow progress indicators
- `error` - Error notifications

**Payload structure for chat requests**:

```typescript
interface N8nChatPayload {
  action: 'sendMessage' | 'loadPreviousSession';
  chatInput: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
```

### Handling n8n Cloud timeout limitations

n8n Cloud has a **100-second timeout** due to Cloudflare. For long-running agent workflows, implement a polling fallback:

1. **Primary**: Stream responses directly for fast queries
2. **Fallback**: If agent processing exceeds ~90 seconds, switch to polling pattern
   - Initial webhook returns job ID immediately
   - Client polls status endpoint until complete

### Conversation memory architecture

The n8n agent maintains its own memory database. The Supabase integration handles:
- User authentication and session management
- Chat history for UI display (mirrors agent's memory)
- Optimistic updates for immediate UI feedback

Do not duplicate memory management—the n8n agent is the source of truth for conversation context.

---

## Next.js streaming implementation patterns

### Vercel AI SDK 5 architecture

Use AI SDK 5's `UIMessage` pattern for type-safe message handling with streaming support.

**API route handler pattern**:

```typescript
// app/api/chat/route.ts
import { streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages, sessionId }: { messages: UIMessage[]; sessionId: string } = await req.json();

  // Forward to n8n webhook with streaming
  const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sendMessage',
      chatInput: messages[messages.length - 1].content,
      sessionId,
    }),
  });

  // Stream n8n response back to client
  return new Response(n8nResponse.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

**Frontend useChat integration**:

```typescript
'use client';
import { useChat } from '@ai-sdk/react';

export function Chat({ sessionId }: { sessionId: string }) {
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    body: { sessionId },
  });

  // status: 'ready' | 'submitted' | 'streaming' | 'error'
  return (/* UI components */);
}
```

### Progressive text rendering

Implement smooth typing effect using requestAnimationFrame for natural text appearance:

```typescript
// hooks/useStreamingText.ts
export function useStreamingText(text: string, speed = 5) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (indexRef.current >= text.length) return;
    
    const animate = () => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayed(text.slice(0, indexRef.current));
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [text]);

  return displayed;
}
```

### Agent thinking and tool usage indicators

Display visual feedback when the agent is processing or using tools:

```typescript
type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content?: string }
  | { type: 'tool-call'; toolName: string; status: 'running' | 'complete' }
  | { type: 'product'; data: UCPProductItem }
  | { type: 'product-list'; products: UCPProductItem[] };
```

Render thinking states with animated indicators (dots, shimmer) and show tool names when agent uses external capabilities.

---

## Supabase integration specifications

### Authentication setup

Use email/password authentication with `@supabase/ssr` for Next.js App Router:

**Required client configurations**:
- Browser client (`lib/supabase/client.ts`) - For client components
- Server client (`lib/supabase/server.ts`) - For server actions and RSC

**Auth flow**: Sign up → Email confirmation → Sign in → Protected routes

### Database schema

```sql
-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  n8n_session_id TEXT UNIQUE, -- Links to n8n agent memory
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (for UI display, mirrors n8n memory)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'product', 'product-list', etc.
  metadata JSONB DEFAULT '{}', -- For product data, tool calls, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### Row Level Security policies

```sql
-- Profiles: Users can view all, update only own
CREATE POLICY "Profiles viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Conversations: Users can only access own
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Messages: Access through conversation ownership
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = (SELECT auth.uid())
    )
  );
```

### Realtime subscriptions

Use Supabase Realtime for syncing messages when user has multiple tabs open or for multi-device sync:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      // Add new message to local state
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [conversationId]);
```

### Supabase MCP configuration

For Claude Code integration with Supabase during development:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=false"
    }
  }
}
```

---

## State management architecture

### Zustand store structure

```typescript
interface ChatStore {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  sidebarOpen: boolean;

  // Actions
  setActiveConversation: (id: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addOptimisticMessage: (message: Message) => void;
  removeOptimisticMessage: (tempId: string) => void;
  toggleSidebar: () => void;
  createConversation: () => Promise<string>;
}
```

### Message type system with discriminated unions

```typescript
interface BaseMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  status: 'sending' | 'streaming' | 'complete' | 'error';
}

type MessageContent =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content?: string }
  | { type: 'tool-call'; toolName: string; toolStatus: 'running' | 'complete'; result?: unknown }
  | { type: 'product'; product: UCPProductItem }
  | { type: 'product-list'; products: UCPProductItem[]; query?: string }
  | { type: 'error'; errorMessage: string };

type Message = BaseMessage & MessageContent;
```

This enables exhaustive type checking and makes adding new message types straightforward.

---

## Error handling and retry patterns

### Webhook retry configuration

Implement exponential backoff with jitter for n8n webhook failures:

```typescript
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function sendWithRetry(payload: N8nChatPayload): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) return response;
      if (response.status === 429) {
        // Rate limited - use Retry-After header or default backoff
        const retryAfter = response.headers.get('Retry-After');
        await delay(retryAfter ? parseInt(retryAfter) * 1000 : calculateBackoff(attempt));
        continue;
      }
      if (response.status >= 500) {
        await delay(calculateBackoff(attempt));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await delay(calculateBackoff(attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

function calculateBackoff(attempt: number): number {
  const exponential = Math.pow(2, attempt) * BASE_DELAY;
  const jitter = exponential * 0.3 * (Math.random() * 2 - 1);
  return Math.min(exponential + jitter, 30000);
}
```

### Connection state handling

Display reconnection status to users and implement automatic reconnection for Supabase Realtime.

---

## File structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Streaming API handler
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── actions.ts            # Server actions for auth
│   ├── chat/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Conversation view
│   │   ├── layout.tsx            # Chat layout with sidebar
│   │   └── page.tsx              # New chat / redirect
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect to chat
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat container
│   │   ├── MessageList.tsx       # Scrollable message area
│   │   ├── MessageItem.tsx       # Individual message rendering
│   │   ├── ChatInput.tsx         # Input with submit
│   │   ├── StreamingText.tsx     # Animated text component
│   │   ├── ThinkingIndicator.tsx # Animated thinking dots
│   │   └── messages/
│   │       ├── TextMessage.tsx
│   │       ├── ProductCard.tsx
│   │       ├── ProductList.tsx
│   │       ├── ToolCallMessage.tsx
│   │       └── index.ts          # Message component registry
│   ├── sidebar/
│   │   ├── ChatSidebar.tsx       # Conversation list
│   │   ├── ConversationItem.tsx
│   │   └── NewChatButton.tsx
│   └── ui/                       # Base UI components (shadcn)
├── hooks/
│   ├── useStreamingText.ts
│   ├── useChat.ts                # Custom chat hook wrapping AI SDK
│   └── useConversations.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── n8n/
│   │   ├── client.ts             # n8n webhook client
│   │   └── types.ts              # n8n payload types
│   └── utils.ts
├── stores/
│   └── chat-store.ts             # Zustand store
├── types/
│   ├── chat.ts                   # Message types
│   ├── ucp.ts                    # UCP product schemas
│   └── database.ts               # Supabase generated types
└── CLAUDE.md                     # Claude Code instructions
```

---

## CLAUDE.md template

Include this at the project root for Claude Code:

```markdown
# Shopping Agent Chat Frontend

Next.js 15 + Supabase chat application wrapping an n8n AI agent for retail product discovery.

## Commands
- `npm run dev`: Development server (port 3000)
- `npm run build`: Production build
- `npm run lint`: ESLint
- `npm run db:types`: Generate Supabase types

## Architecture
- `/app`: Next.js App Router pages and API routes
- `/components/chat`: Chat interface components with message registry pattern
- `/lib/supabase`: Supabase client configurations (browser + server)
- `/stores`: Zustand state management
- `/types`: TypeScript types including discriminated unions for messages

## Key Patterns
- Use discriminated unions for message types (see types/chat.ts)
- Streaming responses via SSE from n8n webhook
- Optimistic updates for message sending
- Message component registry for extensible rendering

## Important Notes
- n8n agent maintains conversation memory; Supabase mirrors for UI
- Always use `(SELECT auth.uid())` pattern in RLS policies
- Use server client for protected routes, browser client for realtime
- Never modify the message discriminated union without updating MessageItem.tsx
```

---

## Implementation phases

### Phase 1: Foundation
- Set up Next.js 15 with TypeScript and Tailwind
- Configure Supabase project with auth and schema
- Implement basic auth flow (signup, login, protected routes)
- Create Zustand store skeleton

### Phase 2: Chat core
- Build chat layout with collapsible sidebar
- Implement conversation CRUD operations
- Create MessageList and MessageItem components
- Set up text message rendering with streaming

### Phase 3: n8n integration
- Configure n8n webhook endpoint
- Implement streaming response handling
- Add thinking indicators and status states
- Handle errors and retries

### Phase 4: Rich messages
- Implement ProductCard component following UCP schema
- Add ProductList for multi-product recommendations
- Create ToolCallMessage for agent action visibility
- Build message component registry

### Phase 5: Polish
- Add realtime subscriptions for multi-tab sync
- Implement optimistic updates
- Add loading skeletons and error states
- Mobile responsive design

---

## What to leave for Claude Code to determine

The following decisions should be made during implementation based on context:

- **Specific component styling** - Follow Tailwind patterns, make it visually polished
- **Animation timing and easing** - Make interactions feel smooth and responsive
- **Error message copy** - Should be helpful and actionable
- **Loading skeleton designs** - Match the content they're replacing
- **Mobile breakpoints** - Use sensible responsive defaults
- **Icon choices** - Use Lucide React or similar, maintain consistency
- **Form validation specifics** - Cover edge cases appropriately
- **Accessibility details** - Include ARIA labels, keyboard navigation

## Constraints Claude Code must follow

- TypeScript strict mode with no `any` types
- All Supabase queries through server or browser clients (never service role in frontend)
- Use `@supabase/ssr` package for auth (not legacy `@supabase/auth-helpers-nextjs`)
- Message types must use discriminated unions with exhaustive switch handling
- All RLS policies must use `(SELECT auth.uid())` pattern for performance
- Keep components under 200 lines; extract logic to hooks
- Use Next.js App Router conventions (not Pages Router)
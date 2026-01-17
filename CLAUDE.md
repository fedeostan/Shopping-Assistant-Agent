# Shopping Assistant Agent

Next.js 16 + Supabase chat application wrapping an n8n AI agent for retail product discovery with psychological persona-based recommendations.

## Commands

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Architecture

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/chat/     # Streaming chat endpoint
│   ├── auth/         # Auth pages (login, signup)
│   └── chat/         # Chat interface pages
├── components/
│   ├── chat/         # Chat interface components
│   ├── sidebar/      # Conversation sidebar
│   └── ui/           # Base UI components
├── hooks/            # Custom React hooks
├── lib/
│   ├── supabase/     # Supabase clients (browser + server)
│   └── n8n/          # n8n webhook client
├── stores/           # Zustand state management
└── types/            # TypeScript types
```

## Backend Services

### n8n Workflow
- **Workflow ID**: `xVkkSX6Lk9OBmY0r`
- **Webhook URL**: `https://fedeostan.app.n8n.cloud/webhook/shopping-assistant-api`
- **Trigger**: Webhook Trigger (POST, responds with last node output)
- **User States**: NEW → ONBOARDING → PROFILED
- **Agents**: Email Collector → Profiling Agent → Shopping Assistant

### Supabase
- **Project ID**: `fbavheqqqdoscxrmyaua`
- **URL**: `https://fbavheqqqdoscxrmyaua.supabase.co`
- **Tables**: `shopping_users`, `n8n_chat_histories`, `conversations`, `messages`

## Key Patterns

### Message Types (Discriminated Unions)
```typescript
type MessageContent =
  | { type: 'text'; content: string }
  | { type: 'thinking' }
  | { type: 'product'; product: UCPProductItem }
  | { type: 'product-list'; products: UCPProductItem[] }
  | { type: 'tool-call'; toolName: string; status: 'running' | 'complete' };
```

### User Personas
- IMPULSE_SHOPPER: Quick, exciting recommendations
- ANALYTICAL_BUYER: Detailed specs, comparisons
- DEAL_HUNTER: Focus on price, discounts
- BRAND_LOYALIST: Brand reputation highlights
- ETHICAL_SHOPPER: Sustainability focus
- QUALITY_FOCUSED: Materials, durability

### Streaming Responses
- n8n webhook returns JSONL format
- Chunk types: `begin`, `item`, `tool-call-start`, `tool-call-end`, `end`, `error`
- Use AI SDK 5's `useChat` hook for streaming

## Design System (Buildi UI)

### Colors
```
Background:      #F5F5F5
Surface:         #FFFFFF
Accent:          #7E4501 (interactive)
Accent Hover:    #5C3301
Decorative:      #FC8A03 (icons only, never text)
Text Header:     #1F2937
Text Body:       #4B5563
Text Muted:      #9CA3AF
Border:          #E5E7EB
```

### Typography
- Font: Plus Jakarta Sans
- Weights: 400 (body), 500 (medium), 600 (headers)

### Chat Styling
- Human messages: Right-aligned, white bubble, shadow-sm
- AI messages: Left-aligned, no wrapper, on background

## Important Notes

1. **Memory Ownership**: n8n agent owns conversation memory. Supabase mirrors for UI only.
2. **Auth Required**: Users must log in before chat (email needed for persona system).
3. **Session Linking**: Use `n8n_session_id` to link conversations to n8n memory.
4. **RLS Policies**: Always use `(SELECT auth.uid())` pattern for performance.
5. **TypeScript**: Strict mode, no `any` types.
6. **Components**: Keep under 200 lines; extract logic to hooks.
7. **Accessibility**: WCAG AAA where possible, always include ARIA labels.

## Anti-Patterns (Never Do)

- Gradients on buttons or backgrounds
- Drop shadows deeper than shadow-lg
- Pure black (#000000) anywhere
- Pure white (#FFFFFF) as page background
- #FC8A03 on text or links (decorative only)
- Icon-only buttons without aria-label
- Text smaller than 14px for interactive elements

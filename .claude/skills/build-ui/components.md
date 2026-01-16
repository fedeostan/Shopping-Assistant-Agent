# Component Reference

Detailed component patterns for Buildi UI. Copy and adapt these patterns.

## Buttons

### Primary Button
```jsx
<button className="
  bg-[#7E4501] text-white font-medium
  px-4 py-2.5 rounded-md
  hover:bg-[#5C3301]
  focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
  transition-colors duration-150 ease-out
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Button Text
</button>
```

### Secondary Button
```jsx
<button className="
  bg-white text-[#1F2937] font-medium
  border border-[#E5E7EB]
  px-4 py-2.5 rounded-md
  hover:bg-[#FAFAFA] hover:border-[#D1D5DB]
  focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
  transition-colors duration-150 ease-out
">
  Button Text
</button>
```

### Ghost Button
```jsx
<button className="
  text-[#4B5563] font-medium
  px-4 py-2.5 rounded-md
  hover:bg-[#F5F5F5]
  focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
  transition-colors duration-150 ease-out
">
  Button Text
</button>
```

### Icon Button
```jsx
<button
  aria-label="Description of action"
  className="
    p-2 rounded-md text-[#4B5563]
    hover:bg-[#F5F5F5]
    focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
    transition-colors duration-150 ease-out
  "
>
  <IconComponent className="w-5 h-5" />
</button>
```

## Form Inputs

### Text Input
```jsx
<div className="space-y-1.5">
  <label htmlFor="field" className="block text-sm font-medium text-[#1F2937]">
    Label
  </label>
  <input
    type="text"
    id="field"
    className="
      w-full px-3 py-2.5 rounded-md
      bg-white border border-[#E5E7EB]
      text-[#1F2937] placeholder:text-[#9CA3AF]
      focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:border-transparent
      transition-shadow duration-150 ease-out
    "
    placeholder="Placeholder text"
  />
</div>
```

### Textarea
```jsx
<textarea
  rows={4}
  className="
    w-full px-3 py-2.5 rounded-md
    bg-white border border-[#E5E7EB]
    text-[#1F2937] placeholder:text-[#9CA3AF]
    focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:border-transparent
    resize-none
    transition-shadow duration-150 ease-out
  "
/>
```

### Input with Error
```jsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-[#1F2937]">Label</label>
  <input
    className="
      w-full px-3 py-2.5 rounded-md
      bg-white border border-red-500
      text-[#1F2937]
      focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
    "
  />
  <p className="text-sm text-red-600">Error message here</p>
</div>
```

## Cards

### Basic Card
```jsx
<div className="bg-white rounded-lg p-4 shadow-sm">
  <h3 className="text-lg font-semibold text-[#1F2937]">Card Title</h3>
  <p className="mt-2 text-[#4B5563]">Card content goes here.</p>
</div>
```

### Interactive Card
```jsx
<button className="
  w-full text-left
  bg-white rounded-lg p-4 shadow-sm
  hover:shadow-md hover:bg-[#FAFAFA]
  focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
  transition-all duration-150 ease-out
">
  <h3 className="text-lg font-semibold text-[#1F2937]">Card Title</h3>
  <p className="mt-2 text-[#4B5563]">Clickable card content.</p>
</button>
```

### Card with Decorative Accent
```jsx
<div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#FC8A03]">
  <h3 className="text-lg font-semibold text-[#1F2937]">Highlighted Card</h3>
  <p className="mt-2 text-[#4B5563]">Uses decorative orange accent.</p>
</div>
```

## Chat Components

### Chat Container
```jsx
<div className="flex flex-col h-screen bg-[#F5F5F5]">
  {/* Messages area */}
  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
    {messages.map(msg => (
      msg.role === 'user' ? <UserMessage key={msg.id} {...msg} /> : <AIMessage key={msg.id} {...msg} />
    ))}
  </div>

  {/* Input area */}
  <div className="border-t border-[#E5E7EB] bg-white p-4">
    <ChatInput />
  </div>
</div>
```

### User Message (Human)
```jsx
<div className="flex justify-end">
  <div className="max-w-[80%] bg-white rounded-xl px-4 py-3 shadow-sm">
    <p className="text-[#4B5563]">{content}</p>
    <span className="block mt-1 text-xs text-[#9CA3AF]">{timestamp}</span>
  </div>
</div>
```

### AI Message
```jsx
<div className="max-w-[80%]">
  <p className="text-[#4B5563] leading-relaxed">{content}</p>
  <span className="block mt-1 text-xs text-[#9CA3AF]">{timestamp}</span>
</div>
```

### Chat Input
```jsx
<div className="flex items-end gap-3">
  <textarea
    rows={1}
    placeholder="Type a message..."
    className="
      flex-1 px-4 py-3 rounded-xl
      bg-[#F5F5F5] border-none
      text-[#1F2937] placeholder:text-[#9CA3AF]
      focus:outline-none focus:ring-2 focus:ring-[#7E4501]
      resize-none
      transition-shadow duration-150 ease-out
    "
  />
  <button className="
    p-3 rounded-xl
    bg-[#7E4501] text-white
    hover:bg-[#5C3301]
    focus:outline-none focus:ring-2 focus:ring-[#7E4501] focus:ring-offset-2
    transition-colors duration-150 ease-out
  ">
    <SendIcon className="w-5 h-5" />
  </button>
</div>
```

## Navigation

### Top Nav
```jsx
<nav className="bg-white border-b border-[#E5E7EB] px-4 py-3">
  <div className="flex items-center justify-between max-w-6xl mx-auto">
    <span className="text-xl font-semibold text-[#1F2937]">Buildi</span>
    <div className="flex items-center gap-2">
      {/* Nav items */}
    </div>
  </div>
</nav>
```

### Sidebar Nav Item
```jsx
<a
  href="#"
  className="
    flex items-center gap-3 px-3 py-2 rounded-md
    text-[#4B5563]
    hover:bg-[#F5F5F5] hover:text-[#1F2937]
    transition-colors duration-150 ease-out
  "
>
  <IconComponent className="w-5 h-5" />
  <span className="font-medium">Nav Item</span>
</a>

{/* Active state */}
<a className="
  flex items-center gap-3 px-3 py-2 rounded-md
  bg-[#FEF3E7] text-[#7E4501]
">
  <IconComponent className="w-5 h-5" />
  <span className="font-medium">Active Item</span>
</a>
```

## Loading States

### Spinner
```jsx
<div className="animate-spin w-5 h-5 border-2 border-[#E5E7EB] border-t-[#7E4501] rounded-full" />
```

### Skeleton
```jsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-[#E5E7EB] rounded w-3/4" />
  <div className="h-4 bg-[#E5E7EB] rounded w-1/2" />
</div>
```

### AI Typing Indicator
```jsx
<div className="flex items-center gap-1">
  <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
  <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
  <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
</div>
```

## Empty States

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-12 h-12 mb-4 text-[#9CA3AF]">
    <EmptyIcon />
  </div>
  <h3 className="text-lg font-semibold text-[#1F2937]">No items yet</h3>
  <p className="mt-1 text-[#4B5563]">Get started by creating your first item.</p>
  <button className="mt-4 bg-[#7E4501] text-white px-4 py-2 rounded-md">
    Create Item
  </button>
</div>
```

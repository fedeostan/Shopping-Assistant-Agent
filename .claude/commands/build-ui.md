# Buildi UI Design System

## Philosophy

Build like Dieter Rams designed Braun: **remove until it breaks, then add one thing back.**

- Every element must earn its pixels
- White space is a feature, not emptiness
- Interactions should feel inevitable, not clever
- Accessibility is non-negotiable (WCAG AAA where possible)

## Color System

```
Background:         #F5F5F5
Surface (cards):    #FFFFFF
Surface elevated:   #FAFAFA

Text header:        #1F2937  (13.46:1 contrast AAA)
Text body:          #4B5563  (6.93:1 contrast AA)
Text muted:         #9CA3AF

Accent interactive: #7E4501  (7.03:1 AAA - links, buttons, focus)
Accent decorative:  #FC8A03  (2.19:1 - icons, borders, non-text only)
Accent hover:       #5C3301

Border default:     #E5E7EB
Border focus:       #7E4501
```

**Rule:** `#FC8A03` (bright orange) ONLY for decorative elements—icons, subtle borders, background tints. Never for text or interactive states.

## Typography

**Font:** Plus Jakarta Sans (import from Google Fonts)

```
--font-xs:    0.75rem / 1rem      (12px - captions)
--font-sm:    0.875rem / 1.25rem  (14px - secondary)
--font-base:  1rem / 1.5rem       (16px - body)
--font-lg:    1.125rem / 1.75rem  (18px - lead)
--font-xl:    1.25rem / 1.75rem   (20px - h4)
--font-2xl:   1.5rem / 2rem       (24px - h3)
--font-3xl:   1.875rem / 2.25rem  (30px - h2)
--font-4xl:   2.25rem / 2.5rem    (36px - h1)

Weight body:    400
Weight medium:  500 (buttons, labels)
Weight headers: 600
```

## Spacing & Layout

8px grid system. All spacing in multiples of 8.

```
--space-1:  0.25rem  (4px - tight)
--space-2:  0.5rem   (8px - default gap)
--space-3:  0.75rem  (12px)
--space-4:  1rem     (16px - component padding)
--space-6:  1.5rem   (24px - section gap)
--space-8:  2rem     (32px - large gap)
--space-12: 3rem     (48px - section margin)
```

## Shadows & Depth

Shadows are whispers, not shouts.

```
--shadow-sm:  0 1px 2px rgba(0,0,0,0.04)
--shadow-md:  0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
--shadow-lg:  0 4px 8px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)
```

Use background tints (`#FAFAFA` → `#FFFFFF` → `#F5F5F5`) to indicate elevation before reaching for shadows.

## Border Radius

```
--radius-sm:  0.375rem  (6px - inputs, small buttons)
--radius-md:  0.5rem    (8px - cards, containers)
--radius-lg:  0.75rem   (12px - modals, chat bubbles)
--radius-full: 9999px   (pills, avatars)
```

## Transitions

All interactions: `150ms ease-out`

Hover states: subtle background shift + slight shadow increase. No transform scaling.

```css
transition: background-color 150ms ease-out, box-shadow 150ms ease-out;
```

## Chat Interface Patterns

**Human messages:** Right-aligned bubble with `#FFFFFF` background, `shadow-sm`, `radius-lg`.

**AI messages:** Left-aligned, no wrapper. Text renders directly on page background (`#F5F5F5`). Use muted text color for metadata.

```jsx
// Human message
<div className="ml-auto max-w-[80%] bg-white rounded-xl px-4 py-3 shadow-sm">
  <p className="text-gray-700">{message}</p>
</div>

// AI message
<div className="max-w-[80%]">
  <p className="text-gray-600">{message}</p>
</div>
```

## Component Reference

For detailed component patterns, see `.claude/skills/build-ui/components.md`

## Anti-Patterns (Never Do)

- Gradients on buttons or backgrounds
- Drop shadows deeper than `shadow-lg`
- Pure black (`#000000`) anywhere
- Pure white (`#FFFFFF`) as page background
- Colored backgrounds on sections (use tints only)
- Rounded corners larger than `radius-lg` on rectangular elements
- Icon-only buttons without aria-label
- Text smaller than 14px for interactive elements
- `#FC8A03` on text or links

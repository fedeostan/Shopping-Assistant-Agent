import type { PersonaType } from '@/types/chat'

/**
 * Persona-specific styling configuration
 * Maps each persona to their visual treatment preferences
 */

export interface PersonaStyle {
  /** Primary accent color for emphasis */
  accentColor: string
  /** Background color for highlights */
  highlightBg: string
  /** Label for the persona */
  label: string
  /** Short description */
  description: string
  /** Icon emoji for quick identification */
  icon: string
  /** Key metrics to emphasize */
  emphasize: string[]
}

export const personaStyles: Record<PersonaType, PersonaStyle> = {
  IMPULSE_SHOPPER: {
    accentColor: 'text-accent',
    highlightBg: 'bg-accent-light',
    label: 'Quick Decision Maker',
    description: 'Fast, exciting recommendations',
    icon: '⚡',
    emphasize: ['urgency', 'popularity', 'trending'],
  },
  ANALYTICAL_BUYER: {
    accentColor: 'text-blue-600',
    highlightBg: 'bg-blue-50',
    label: 'Detail-Oriented',
    description: 'Comprehensive specs and comparisons',
    icon: '📊',
    emphasize: ['specs', 'comparisons', 'features'],
  },
  DEAL_HUNTER: {
    accentColor: 'text-green-600',
    highlightBg: 'bg-green-50',
    label: 'Value Seeker',
    description: 'Best prices and discounts',
    icon: '💰',
    emphasize: ['price', 'discount', 'value'],
  },
  BRAND_LOYALIST: {
    accentColor: 'text-purple-600',
    highlightBg: 'bg-purple-50',
    label: 'Brand Enthusiast',
    description: 'Trusted brands and reputation',
    icon: '🏆',
    emphasize: ['brand', 'awards', 'heritage'],
  },
  ETHICAL_SHOPPER: {
    accentColor: 'text-emerald-600',
    highlightBg: 'bg-emerald-50',
    label: 'Conscious Consumer',
    description: 'Sustainable and ethical choices',
    icon: '🌿',
    emphasize: ['sustainability', 'certifications', 'impact'],
  },
  QUALITY_FOCUSED: {
    accentColor: 'text-amber-600',
    highlightBg: 'bg-amber-50',
    label: 'Quality First',
    description: 'Premium materials and durability',
    icon: '✨',
    emphasize: ['materials', 'durability', 'warranty'],
  },
}

/**
 * Get styling config for a persona
 */
export function getPersonaStyle(persona?: PersonaType): PersonaStyle | null {
  if (!persona) return null
  return personaStyles[persona]
}

/**
 * Get the appropriate badge style for a persona
 */
export function getPersonaBadgeClasses(persona: PersonaType): string {
  const style = personaStyles[persona]
  return `${style.highlightBg} ${style.accentColor}`
}

/**
 * Check if a metric should be emphasized for a persona
 */
export function shouldEmphasize(persona: PersonaType, metric: string): boolean {
  const style = personaStyles[persona]
  return style.emphasize.includes(metric)
}

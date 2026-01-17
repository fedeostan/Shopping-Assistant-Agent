'use client'

import { ExternalLink, Star, Leaf, Award, Shield, Clock, TrendingDown } from 'lucide-react'
import type { UCPProductItem, PersonaType, SustainabilityBadge } from '@/types/chat'

interface ProductCardProps {
  product: UCPProductItem
  persona?: PersonaType
  compact?: boolean
}

export function ProductCard({ product, persona, compact = false }: ProductCardProps) {
  return (
    <article
      className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Product: ${product.name} by ${product.brand}`}
    >
      {product.imageUrl && !compact && (
        <div className="aspect-video bg-surface-elevated relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Impulse hooks overlay */}
          {persona === 'IMPULSE_SHOPPER' && product.impulseHooks && product.impulseHooks.length > 0 && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 bg-accent text-white text-xs font-medium px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {product.impulseHooks[0]}
              </span>
            </div>
          )}
          {/* Deal badge overlay */}
          {persona === 'DEAL_HUNTER' && product.discountPercent && product.discountPercent > 0 && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" aria-hidden="true" />
                {product.discountPercent}% OFF
              </span>
            </div>
          )}
        </div>
      )}

      <div className={compact ? 'p-3' : 'p-4'}>
        {/* Header: Name, Brand, Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h4 className={`font-medium text-text-header ${compact ? 'text-sm line-clamp-1' : 'line-clamp-2'}`}>
              {product.name}
            </h4>
            {product.brand && (
              <ProductBrand brand={product.brand} persona={persona} reputation={product.brandReputation} />
            )}
          </div>
          <ProductPrice product={product} persona={persona} />
        </div>

        {/* Description (not in compact mode) */}
        {!compact && product.description && (
          <p className="text-sm text-text-body line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating !== undefined && (
          <ProductRating rating={product.rating} reviewCount={product.reviewCount} compact={compact} />
        )}

        {/* Persona-specific sections */}
        {!compact && (
          <PersonaSpecificContent product={product} persona={persona} />
        )}

        {/* Availability */}
        {product.availability && (
          <ProductAvailability availability={product.availability} />
        )}

        {/* Action */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover transition-colors ${compact ? 'text-xs mt-2' : 'text-sm mt-3'}`}
        >
          View Product
          <ExternalLink className={compact ? 'w-3 h-3' : 'w-4 h-4'} aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}

function ProductBrand({
  brand,
  persona,
  reputation,
}: {
  brand: string
  persona?: PersonaType
  reputation?: UCPProductItem['brandReputation']
}) {
  const showReputation = persona === 'BRAND_LOYALIST' && reputation

  return (
    <div className="flex items-center gap-1.5">
      <p className="text-sm text-text-muted">{brand}</p>
      {showReputation && reputation && (
        <div className="flex items-center gap-0.5" aria-label={`Brand score: ${reputation.score} out of 5`}>
          <Award className="w-3.5 h-3.5 text-accent-decorative" aria-hidden="true" />
          <span className="text-xs font-medium text-text-muted">{reputation.score.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

function ProductPrice({
  product,
  persona,
}: {
  product: UCPProductItem
  persona?: PersonaType
}) {
  const showOriginalPrice = persona === 'DEAL_HUNTER' && product.originalPrice && product.originalPrice > product.price

  return (
    <div className="text-right shrink-0">
      {showOriginalPrice && product.originalPrice && (
        <p className="text-xs text-text-muted line-through">
          {product.currency}{product.originalPrice.toFixed(2)}
        </p>
      )}
      <p className={`font-semibold ${showOriginalPrice ? 'text-green-600' : 'text-accent'}`}>
        {product.currency}{product.price.toFixed(2)}
      </p>
    </div>
  )
}

function ProductRating({
  rating,
  reviewCount,
  compact,
}: {
  rating: number
  reviewCount?: number
  compact: boolean
}) {
  return (
    <div className={`flex items-center gap-1 text-text-muted ${compact ? 'text-xs mb-1' : 'text-sm mb-3'}`}>
      <Star className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} fill-accent-decorative text-accent-decorative`} aria-hidden="true" />
      <span>{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-text-muted">({reviewCount.toLocaleString()} reviews)</span>
      )}
    </div>
  )
}

function ProductAvailability({ availability }: { availability: UCPProductItem['availability'] }) {
  const config = {
    in_stock: { text: 'In Stock', className: 'text-green-600' },
    low_stock: { text: 'Low Stock', className: 'text-amber-600' },
    out_of_stock: { text: 'Out of Stock', className: 'text-red-600' },
    preorder: { text: 'Pre-order', className: 'text-blue-600' },
  }

  const { text, className } = config[availability || 'in_stock']

  return (
    <p className={`text-xs font-medium ${className} mt-2`}>
      {text}
    </p>
  )
}

function PersonaSpecificContent({
  product,
  persona,
}: {
  product: UCPProductItem
  persona?: PersonaType
}) {
  switch (persona) {
    case 'ETHICAL_SHOPPER':
      return <EthicalShopperSection product={product} />
    case 'QUALITY_FOCUSED':
      return <QualityFocusedSection product={product} />
    case 'ANALYTICAL_BUYER':
      return <AnalyticalBuyerSection product={product} />
    case 'BRAND_LOYALIST':
      return <BrandLoyalistSection product={product} />
    case 'IMPULSE_SHOPPER':
      return <ImpulseShopperSection product={product} />
    default:
      return product.features && product.features.length > 0 ? (
        <DefaultFeaturesSection features={product.features} />
      ) : null
  }
}

function EthicalShopperSection({ product }: { product: UCPProductItem }) {
  if (!product.sustainabilityBadges?.length && !product.sustainabilityScore) return null

  const badgeConfig: Record<SustainabilityBadge, { label: string; icon: string }> = {
    'organic': { label: 'Organic', icon: '🌿' },
    'fair-trade': { label: 'Fair Trade', icon: '🤝' },
    'recycled': { label: 'Recycled', icon: '♻️' },
    'carbon-neutral': { label: 'Carbon Neutral', icon: '🌍' },
    'vegan': { label: 'Vegan', icon: '🌱' },
    'cruelty-free': { label: 'Cruelty Free', icon: '🐰' },
    'locally-made': { label: 'Local', icon: '📍' },
    'eco-packaging': { label: 'Eco Packaging', icon: '📦' },
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {product.sustainabilityScore && (
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-green-600" aria-hidden="true" />
          <span className="text-sm text-text-body">
            Sustainability Score: <strong className="text-green-600">{product.sustainabilityScore}/5</strong>
          </span>
        </div>
      )}
      {product.sustainabilityBadges && product.sustainabilityBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.sustainabilityBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full"
            >
              <span aria-hidden="true">{badgeConfig[badge].icon}</span>
              {badgeConfig[badge].label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function QualityFocusedSection({ product }: { product: UCPProductItem }) {
  if (!product.materialInfo) return null

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-accent" aria-hidden="true" />
        <span className="text-sm font-medium text-text-header">Quality Details</span>
      </div>
      <dl className="text-xs text-text-body space-y-1">
        <div className="flex gap-1">
          <dt className="text-text-muted">Material:</dt>
          <dd>{product.materialInfo.primary}</dd>
        </div>
        {product.materialInfo.durabilityRating && (
          <div className="flex gap-1">
            <dt className="text-text-muted">Durability:</dt>
            <dd>{product.materialInfo.durabilityRating}/5</dd>
          </div>
        )}
        {product.materialInfo.warranty && (
          <div className="flex gap-1">
            <dt className="text-text-muted">Warranty:</dt>
            <dd>{product.materialInfo.warranty}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

function AnalyticalBuyerSection({ product }: { product: UCPProductItem }) {
  if (!product.specs?.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <span className="text-xs font-medium text-text-header mb-2 block">Specifications</span>
      <dl className="text-xs space-y-1">
        {product.specs.slice(0, 4).map((spec, i) => (
          <div key={i} className="flex justify-between">
            <dt className="text-text-muted">{spec.label}</dt>
            <dd className="text-text-body font-medium">
              {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function BrandLoyalistSection({ product }: { product: UCPProductItem }) {
  if (!product.brandReputation) return null
  const { awards, certifications, yearsFounded } = product.brandReputation

  if (!awards?.length && !certifications?.length && !yearsFounded) return null

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-4 h-4 text-accent-decorative" aria-hidden="true" />
        <span className="text-sm font-medium text-text-header">Brand Heritage</span>
      </div>
      <div className="text-xs text-text-body space-y-1">
        {yearsFounded && (
          <p>Established {new Date().getFullYear() - yearsFounded}+ years</p>
        )}
        {awards && awards.length > 0 && (
          <p className="text-text-muted">
            Awards: {awards.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}

function ImpulseShopperSection({ product }: { product: UCPProductItem }) {
  if (!product.impulseHooks?.length) return null

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {product.impulseHooks.slice(0, 3).map((hook, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-accent-light text-accent text-xs font-medium px-2 py-0.5 rounded-full"
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            {hook}
          </span>
        ))}
      </div>
    </div>
  )
}

function DefaultFeaturesSection({ features }: { features: string[] }) {
  return (
    <ul className="mt-3 text-xs text-text-body space-y-1">
      {features.slice(0, 3).map((feature, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="text-accent-decorative mt-0.5">•</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

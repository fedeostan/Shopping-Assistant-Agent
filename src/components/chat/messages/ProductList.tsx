'use client'

import { useState } from 'react'
import { Grid2X2, List, Scale } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { UCPProductItem, PersonaType } from '@/types/chat'

type ViewMode = 'list' | 'grid' | 'compare'

interface ProductListProps {
  products: UCPProductItem[]
  persona?: PersonaType
  defaultView?: ViewMode
}

export function ProductList({ products, persona, defaultView = 'list' }: ProductListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)

  if (products.length === 0) {
    return (
      <p className="text-sm text-text-muted italic">No products to display.</p>
    )
  }

  // Only show view toggle for multiple products
  const showViewToggle = products.length > 1

  return (
    <div className="space-y-3">
      {showViewToggle && (
        <ViewModeToggle
          viewMode={viewMode}
          onViewChange={setViewMode}
          showCompare={products.length >= 2 && products.length <= 4}
        />
      )}

      {viewMode === 'list' && (
        <ListView products={products} persona={persona} />
      )}

      {viewMode === 'grid' && (
        <GridView products={products} persona={persona} />
      )}

      {viewMode === 'compare' && (
        <CompareView products={products} persona={persona} />
      )}
    </div>
  )
}

function ViewModeToggle({
  viewMode,
  onViewChange,
  showCompare,
}: {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  showCompare: boolean
}) {
  const buttons: { mode: ViewMode; icon: typeof List; label: string; show: boolean }[] = [
    { mode: 'list', icon: List, label: 'List view', show: true },
    { mode: 'grid', icon: Grid2X2, label: 'Grid view', show: true },
    { mode: 'compare', icon: Scale, label: 'Compare view', show: showCompare },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg w-fit" role="group" aria-label="View mode">
      {buttons
        .filter((b) => b.show)
        .map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewChange(mode)}
            className={`p-1.5 rounded transition-colors ${
              viewMode === mode
                ? 'bg-surface text-accent shadow-sm'
                : 'text-text-muted hover:text-text-body'
            }`}
            aria-label={label}
            aria-pressed={viewMode === mode}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        ))}
    </div>
  )
}

function ListView({
  products,
  persona,
}: {
  products: UCPProductItem[]
  persona?: PersonaType
}) {
  return (
    <div className="space-y-3" role="list" aria-label="Product list">
      {products.map((product, index) => (
        <div key={index} role="listitem">
          <ProductCard product={product} persona={persona} />
        </div>
      ))}
    </div>
  )
}

function GridView({
  products,
  persona,
}: {
  products: UCPProductItem[]
  persona?: PersonaType
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3"
      role="list"
      aria-label="Product grid"
    >
      {products.map((product, index) => (
        <div key={index} role="listitem">
          <ProductCard product={product} persona={persona} compact />
        </div>
      ))}
    </div>
  )
}

function CompareView({
  products,
  persona,
}: {
  products: UCPProductItem[]
  persona?: PersonaType
}) {
  // Get all unique spec labels across products
  const specLabels = new Set<string>()
  products.forEach((p) => p.specs?.forEach((s) => specLabels.add(s.label)))
  const allSpecLabels = Array.from(specLabels)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse" aria-label="Product comparison">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 text-text-muted font-medium w-28">
              <span className="sr-only">Attribute</span>
            </th>
            {products.map((product, index) => (
              <th key={index} className="text-left p-3 font-medium text-text-header min-w-[180px]">
                <div className="space-y-1">
                  {product.imageUrl && (
                    <div className="w-full h-20 rounded overflow-hidden bg-surface-elevated mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="line-clamp-2">{product.name}</p>
                  <p className="text-xs text-text-muted font-normal">{product.brand}</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price row */}
          <CompareRow label="Price">
            {products.map((product, index) => (
              <td key={index} className="p-3">
                <PriceCell product={product} persona={persona} />
              </td>
            ))}
          </CompareRow>

          {/* Rating row */}
          <CompareRow label="Rating">
            {products.map((product, index) => (
              <td key={index} className="p-3 text-text-body">
                {product.rating !== undefined ? (
                  <span>
                    <span className="text-accent-decorative">★</span> {product.rating.toFixed(1)}
                    {product.reviewCount && (
                      <span className="text-text-muted text-xs ml-1">
                        ({product.reviewCount.toLocaleString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
            ))}
          </CompareRow>

          {/* Availability row */}
          <CompareRow label="Availability">
            {products.map((product, index) => (
              <td key={index} className="p-3">
                <AvailabilityCell availability={product.availability} />
              </td>
            ))}
          </CompareRow>

          {/* Persona-specific rows */}
          {persona === 'ETHICAL_SHOPPER' && (
            <CompareRow label="Sustainability">
              {products.map((product, index) => (
                <td key={index} className="p-3 text-text-body">
                  {product.sustainabilityScore ? (
                    <span className="text-green-600 font-medium">{product.sustainabilityScore}/5</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              ))}
            </CompareRow>
          )}

          {persona === 'QUALITY_FOCUSED' && (
            <>
              <CompareRow label="Material">
                {products.map((product, index) => (
                  <td key={index} className="p-3 text-text-body text-xs">
                    {product.materialInfo?.primary || <span className="text-text-muted">—</span>}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Warranty">
                {products.map((product, index) => (
                  <td key={index} className="p-3 text-text-body text-xs">
                    {product.materialInfo?.warranty || <span className="text-text-muted">—</span>}
                  </td>
                ))}
              </CompareRow>
            </>
          )}

          {persona === 'BRAND_LOYALIST' && (
            <CompareRow label="Brand Score">
              {products.map((product, index) => (
                <td key={index} className="p-3 text-text-body">
                  {product.brandReputation?.score ? (
                    <span className="font-medium">{product.brandReputation.score}/5</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              ))}
            </CompareRow>
          )}

          {/* Spec rows for analytical buyers */}
          {persona === 'ANALYTICAL_BUYER' && allSpecLabels.map((label) => (
            <CompareRow key={label} label={label}>
              {products.map((product, index) => {
                const spec = product.specs?.find((s) => s.label === label)
                return (
                  <td key={index} className="p-3 text-text-body text-xs">
                    {spec ? (
                      <span>{spec.value}{spec.unit ? ` ${spec.unit}` : ''}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                )
              })}
            </CompareRow>
          ))}

          {/* View Product row */}
          <tr className="border-t border-border">
            <td className="p-3"></td>
            {products.map((product, index) => (
              <td key={index} className="p-3">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover font-medium text-sm transition-colors"
                >
                  View Product →
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border">
      <td className="p-3 text-text-muted font-medium text-xs">{label}</td>
      {children}
    </tr>
  )
}

function PriceCell({ product, persona }: { product: UCPProductItem; persona?: PersonaType }) {
  const showDiscount = persona === 'DEAL_HUNTER' && product.originalPrice && product.originalPrice > product.price

  return (
    <div>
      {showDiscount && product.originalPrice && (
        <p className="text-xs text-text-muted line-through">
          {product.currency}{product.originalPrice.toFixed(2)}
        </p>
      )}
      <p className={`font-semibold ${showDiscount ? 'text-green-600' : 'text-accent'}`}>
        {product.currency}{product.price.toFixed(2)}
      </p>
      {showDiscount && product.discountPercent && (
        <p className="text-xs text-green-600 font-medium">
          {product.discountPercent}% off
        </p>
      )}
    </div>
  )
}

function AvailabilityCell({ availability }: { availability?: UCPProductItem['availability'] }) {
  if (!availability) return <span className="text-text-muted">—</span>

  const config = {
    in_stock: { text: 'In Stock', className: 'text-green-600' },
    low_stock: { text: 'Low Stock', className: 'text-amber-600' },
    out_of_stock: { text: 'Out of Stock', className: 'text-red-600' },
    preorder: { text: 'Pre-order', className: 'text-blue-600' },
  }

  const { text, className } = config[availability]
  return <span className={`text-xs font-medium ${className}`}>{text}</span>
}

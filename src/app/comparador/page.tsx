'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product, ProductWithResult } from '@/lib/excel'
import StatsCards from '@/components/StatsCards'
import PriceTable from '@/components/PriceTable'
import ExportButton from '@/components/ExportButton'

type SearchState = 'idle' | 'searching' | 'done'

export default function ComparadorPage() {
  const [products, setProducts] = useState<ProductWithResult[]>([])
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load inventory on mount
  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(({ products: raw, error }: { products?: Product[]; error?: string }) => {
        if (error || !raw) {
          setLoadError(error ?? 'Unknown error')
          return
        }
        setProducts(
          raw.map((p) => ({
            ...p,
            fetchedPrice: null,
            amazonUrl: null,
            status: 'pending',
          }))
        )
        setProgress({ done: 0, total: raw.length })
      })
      .catch(() => setLoadError('Failed to load inventory'))
  }, [])

  const handleSearch = useCallback(async () => {
    if (searchState === 'searching') return

    setSearchState('searching')
    setProgress({ done: 0, total: products.length })

    // Reset all to pending
    setProducts((prev) =>
      prev.map((p) => ({ ...p, fetchedPrice: null, amazonUrl: null, status: 'pending' }))
    )

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      // Mark this one as loading
      setProducts((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'loading' } : p))
      )

      try {
        const res = await fetch(
          `/api/amazon-price?mpn=${encodeURIComponent(product.mpn)}&brand=${encodeURIComponent(product.brand)}`
        )
        const data = await res.json()

        setProducts((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  fetchedPrice: data.found ? data.price : null,
                  amazonUrl: data.found ? data.url : null,
                  status: data.found ? 'found' : 'not_found',
                }
              : p
          )
        )
      } catch {
        setProducts((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, fetchedPrice: null, amazonUrl: null, status: 'error' } : p
          )
        )
      }

      setProgress({ done: i + 1, total: products.length })
    }

    setSearchState('done')
  }, [products, searchState])

  const isSearching = searchState === 'searching'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Comparador Amazon USA vs Proveedor
              </h1>
              <p className="text-sm text-gray-500">
                Anker Brands · {products.length} productos · Precios en USD
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-green-200" />
                Amazon más barato
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-200" />
                Amazon más caro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-gray-200" />
                No encontrado
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Error cargando inventario: {loadError}
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsCards products={products} isSearching={isSearching} />

            {/* Progress bar */}
            {isSearching && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Buscando en Amazon…</span>
                  <span>
                    {progress.done} / {progress.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSearch}
                disabled={isSearching || products.length === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Buscando…
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {searchState === 'done' ? 'Buscar de nuevo' : 'Buscar en Amazon'}
                  </>
                )}
              </button>

              <ExportButton products={products} disabled={isSearching} />

              {searchState === 'done' && (
                <p className="text-sm text-gray-500">
                  ✓ Búsqueda completada —{' '}
                  {products.filter((p) => p.fetchedPrice != null).length} de{' '}
                  {products.length} productos encontrados
                </p>
              )}
            </div>

            {/* Table */}
            {products.length > 0 ? (
              <PriceTable products={products} />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                Cargando inventario…
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

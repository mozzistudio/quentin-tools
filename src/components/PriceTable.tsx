'use client'

import { ProductWithResult } from '@/lib/excel'

interface PriceTableProps {
  products: ProductWithResult[]
}

function getRowColor(p: ProductWithResult): string {
  if (p.status === 'loading') return 'bg-yellow-50'
  if (p.fetchedPrice == null) return ''
  if (p.fetchedPrice < p.precioVenta) return 'bg-green-50'
  if (p.fetchedPrice > p.precioVenta) return 'bg-red-50'
  return 'bg-gray-50'
}

function getPriceColor(p: ProductWithResult): string {
  if (p.fetchedPrice == null) return 'text-gray-400'
  if (p.fetchedPrice < p.precioVenta) return 'text-green-700 font-semibold'
  if (p.fetchedPrice > p.precioVenta) return 'text-red-700 font-semibold'
  return 'text-gray-700'
}

function getDiffColor(diff: number): string {
  if (diff < 0) return 'text-green-700 font-semibold'
  if (diff > 0) return 'text-red-700 font-semibold'
  return 'text-gray-500'
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function PriceTable({ products }: PriceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Marca',
              'MPN',
              'Producto',
              'Inv.',
              'Precio Proveedor',
              'MSRP',
              'Precio Amazon',
              'Diferencia',
              'Link',
            ].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((p, i) => {
            const diff =
              p.fetchedPrice != null ? p.fetchedPrice - p.precioVenta : null
            const diffPct =
              diff != null && p.precioVenta > 0
                ? (diff / p.precioVenta) * 100
                : null

            return (
              <tr key={i} className={`transition-colors ${getRowColor(p)}`}>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{p.brand}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-gray-700">
                  {p.mpn}
                </td>
                <td className="max-w-xs px-4 py-2.5 text-gray-800">{p.name}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-center text-gray-600">
                  {p.inventario}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                  {fmt(p.precioVenta)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                  {fmt(p.msrp)}
                </td>
                <td className={`whitespace-nowrap px-4 py-2.5 ${getPriceColor(p)}`}>
                  {p.status === 'loading' ? (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                      Buscando…
                    </span>
                  ) : p.fetchedPrice != null ? (
                    fmt(p.fetchedPrice)
                  ) : p.status === 'error' ? (
                    <span className="text-orange-500">Error</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {diff != null ? (
                    <span className={getDiffColor(diff)}>
                      {diff >= 0 ? '+' : ''}
                      {fmt(diff)}
                      <span className="ml-1 text-xs opacity-70">
                        ({diffPct! >= 0 ? '+' : ''}
                        {diffPct!.toFixed(1)}%)
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {p.amazonUrl ? (
                    <a
                      href={p.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-200 transition-colors"
                    >
                      Ver →
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { ProductWithResult } from '@/lib/excel'

interface StatsCardsProps {
  products: ProductWithResult[]
  isSearching: boolean
}

export default function StatsCards({ products, isSearching }: StatsCardsProps) {
  const total = products.length
  const found = products.filter((p) => p.fetchedPrice != null).length
  const cheaper = products.filter(
    (p) => p.fetchedPrice != null && p.fetchedPrice < p.precioVenta
  ).length
  const moreExpensive = products.filter(
    (p) => p.fetchedPrice != null && p.fetchedPrice > p.precioVenta
  ).length
  const loading = products.filter((p) => p.status === 'loading').length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Total productos" value={total} color="blue" />
      <Card
        label="Encontrados en Amazon"
        value={found}
        total={isSearching ? total : undefined}
        color="gray"
        loading={loading > 0}
      />
      <Card label="Amazon más barato" value={cheaper} color="green" />
      <Card label="Amazon más caro" value={moreExpensive} color="red" />
    </div>
  )
}

interface CardProps {
  label: string
  value: number
  total?: number
  color: 'blue' | 'green' | 'red' | 'gray'
  loading?: boolean
}

const colorMap = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-green-200 bg-green-50 text-green-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  gray: 'border-gray-200 bg-gray-50 text-gray-700',
}

function Card({ label, value, total, color, loading }: CardProps) {
  return (
    <div className={`rounded-xl border-2 p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {total !== undefined && (
          <span className="ml-1 text-base font-normal opacity-60">/ {total}</span>
        )}
        {loading && (
          <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
      </p>
    </div>
  )
}

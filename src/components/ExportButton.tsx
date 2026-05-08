'use client'

import { ProductWithResult, generateExport } from '@/lib/excel'

interface ExportButtonProps {
  products: ProductWithResult[]
  disabled?: boolean
}

export default function ExportButton({ products, disabled }: ExportButtonProps) {
  const hasData = products.some((p) => p.fetchedPrice != null)

  function handleExport() {
    const base64 = generateExport(products)
    const byteChars = atob(base64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const date = new Date().toISOString().split('T')[0]
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparacion_amazon_${date}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !hasData}
      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
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
          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      Descargar Excel
    </button>
  )
}

import * as XLSX from 'xlsx'

export interface Product {
  brand: string
  productId: number
  upc: number
  mpn: string
  name: string
  inventario: number
  precioVenta: number
  msrp: number
  amazonPrice: number | null
}

export interface ProductWithResult extends Product {
  fetchedPrice: number | null
  amazonUrl: string | null
  status: 'pending' | 'loading' | 'found' | 'not_found' | 'error'
}

/**
 * Parses the Anker Brands inventory xlsx.
 * Headers are on row 5 (index 4), data starts on row 6 (index 5).
 * Columns: A=Brand, B=ProductID, C=UPC, D=Image, E=MPN, F=Name, G=Inventario, H=PrecioVenta, I=MSRP, J=Margen, K=Amazon
 */
export function parseInventory(buffer: Buffer): Product[] {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]

  // range: 4 → skip first 4 rows (0-indexed), so row 5 becomes the header row
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { range: 4, header: 1 })

  // rows[0] = header row, rows[1..] = data
  return rows
    .slice(1)
    .filter((r) => r[0] && r[4]) // must have Brand and MPN
    .map((r) => ({
      brand: String(r[0]).trim(),
      productId: Number(r[1]) || 0,
      upc: Number(r[2]) || 0,
      mpn: String(r[4]).trim(),
      name: String(r[5] || '').trim(),
      inventario: Number(r[6]) || 0,
      precioVenta: parseFloat(String(r[7] || 0)),
      msrp: parseFloat(String(r[8] || 0)),
      amazonPrice: r[10] != null && !isNaN(Number(r[10])) ? parseFloat(String(r[10])) : null,
    }))
}

/**
 * Generates an enriched xlsx with the fetched Amazon prices.
 * Returns a base64-encoded xlsx string for download.
 */
export function generateExport(products: ProductWithResult[]): string {
  const headers = [
    'Manuf Brand',
    'MPN',
    'Product Name',
    'Inventario',
    'Precio Venta',
    'MSRP',
    'Precio Amazon',
    'Diferencia $',
    'Diferencia %',
    'Estado',
    'Link Amazon',
  ]

  const rows = products.map((p) => {
    const ap = p.fetchedPrice
    const diff = ap != null ? ap - p.precioVenta : null
    const diffPct = ap != null && p.precioVenta > 0 ? ((ap - p.precioVenta) / p.precioVenta) * 100 : null
    return [
      p.brand,
      p.mpn,
      p.name,
      p.inventario,
      p.precioVenta,
      p.msrp,
      ap ?? '',
      diff != null ? diff : '',
      diffPct != null ? `${diffPct.toFixed(1)}%` : '',
      ap == null ? 'No encontrado' : ap < p.precioVenta ? 'Amazon más barato' : ap > p.precioVenta ? 'Amazon más caro' : 'Igual',
      p.amazonUrl ?? '',
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 36 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 40 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Comparacion Amazon')

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
}

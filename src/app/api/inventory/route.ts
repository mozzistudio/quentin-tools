import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseInventory } from '@/lib/excel'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'inventory.xlsx')
    const buffer = readFileSync(filePath)
    const products = parseInventory(Buffer.from(buffer))
    return NextResponse.json({ products })
  } catch (err) {
    console.error('[/api/inventory] Error:', err)
    return NextResponse.json({ error: 'Failed to read inventory' }, { status: 500 })
  }
}

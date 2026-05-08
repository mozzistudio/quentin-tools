import { NextRequest, NextResponse } from 'next/server'
import { fetchAmazonPrice } from '@/lib/amazon'

// 400ms delay between requests helps avoid Amazon rate-limiting
const RATE_LIMIT_DELAY = 400

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mpn = searchParams.get('mpn')
  const brand = searchParams.get('brand') ?? ''

  if (!mpn) {
    return NextResponse.json({ error: 'mpn is required' }, { status: 400 })
  }

  await sleep(RATE_LIMIT_DELAY)

  try {
    const result = await fetchAmazonPrice(mpn, brand)

    if (!result) {
      return NextResponse.json({ found: false, price: null, url: null })
    }

    return NextResponse.json({
      found: true,
      price: result.price,
      url: result.url,
      asin: result.asin,
    })
  } catch (err) {
    console.error('[/api/amazon-price] Error:', err)
    return NextResponse.json({ found: false, price: null, url: null, error: 'fetch_error' })
  }
}

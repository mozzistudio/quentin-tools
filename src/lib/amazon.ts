/**
 * Server-side Amazon price fetcher.
 * Searches Amazon.com by brand + MPN and extracts the first result price.
 */

export interface AmazonResult {
  price: number
  url: string
  asin: string | null
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Extracts a dollar price from a text like "$129.99" or "129.99"
 */
function extractPrice(text: string): number | null {
  const match = text.replace(/,/g, '').match(/\$?([\d]+\.[\d]{2})/)
  if (!match) return null
  const price = parseFloat(match[1])
  return isNaN(price) ? null : price
}

/**
 * Parses Amazon search HTML to find the first product price and ASIN.
 * Amazon uses .a-price .a-offscreen for machine-readable prices.
 */
function parseAmazonSearchHtml(html: string): { price: number | null; asin: string | null } {
  // Find first search result ASIN
  const asinMatch = html.match(/data-asin="([A-Z0-9]{10})"/)
  const asin = asinMatch ? asinMatch[1] : null

  // Find prices using the hidden .a-offscreen spans within .a-price
  // Pattern: <span class="a-price"><span aria-hidden="true">...<span class="a-offscreen">$129.99</span>
  const offscreenMatches = [...html.matchAll(/class="a-offscreen">(\$[\d,]+\.[\d]{2})<\/span>/g)]

  if (offscreenMatches.length > 0) {
    const price = extractPrice(offscreenMatches[0][1])
    if (price && price > 0 && price < 10000) {
      return { price, asin }
    }
  }

  // Fallback: look for whole + fraction price parts near search results
  const wholeFractionMatch = html.match(
    /class="a-price-whole">([\d,]+)<\/span>.*?class="a-price-fraction">([\d]+)<\/span>/s
  )
  if (wholeFractionMatch) {
    const whole = wholeFractionMatch[1].replace(/,/g, '')
    const fraction = wholeFractionMatch[2]
    const price = parseFloat(`${whole}.${fraction}`)
    if (!isNaN(price) && price > 0 && price < 10000) {
      return { price, asin }
    }
  }

  return { price: null, asin }
}

export async function fetchAmazonPrice(mpn: string, brand: string): Promise<AmazonResult | null> {
  // Search with brand + MPN for precision
  const query = encodeURIComponent(`${brand} ${mpn}`)
  const searchUrl = `https://www.amazon.com/s?k=${query}&i=electronics`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) return null

    const html = await res.text()

    // Detect CAPTCHA / robot check
    if (
      html.includes('robot check') ||
      html.includes('captcha') ||
      html.includes('Type the characters you see')
    ) {
      console.warn(`[Amazon] CAPTCHA detected for MPN: ${mpn}`)
      return null
    }

    const { price, asin } = parseAmazonSearchHtml(html)

    if (price === null) return null

    const productUrl = asin
      ? `https://www.amazon.com/dp/${asin}`
      : searchUrl

    return { price, url: productUrl, asin }
  } catch (err) {
    console.error(`[Amazon] Error fetching ${mpn}:`, err)
    return null
  }
}

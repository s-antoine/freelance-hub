// Vercel Serverless Function — proxy HTTP pour éviter CORS
// Utilisé pour scraper les sites sans API publique
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url, headers: extraHeaders } = req.method === 'POST'
    ? req.body
    : { url: req.query.url, headers: {} }

  if (!url) return res.status(400).json({ error: 'url required' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, application/rss+xml, */*',
        'Accept-Language': 'fr-BE,fr;q=0.9,en;q=0.8',
        ...(extraHeaders || {})
      }
    })
    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()
    res.status(200).json({ content: text, status: response.status, contentType })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

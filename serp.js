/**
 * Vercel Serverless Function — SubliSales SERP Proxy
 *
 * POST /api/serp
 * Body: { query: string, gl?: string, hl?: string }
 *
 * 환경 변수 (Vercel Dashboard → Settings → Environment Variables):
 *   SERP_API_KEY  ← SerpApi 발급 키
 */

export default async function handler(req, res) {
  // ── CORS ───────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'POST only' });

  // ── 요청 파싱 ──────────────────────────────────────────
  const { query, gl = 'us', hl = 'en' } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query is required' });

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SERP_API_KEY not configured' });

  // ── SerpApi 호출 ───────────────────────────────────────
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine',  'google_news');
  url.searchParams.set('q',       query);
  url.searchParams.set('gl',      gl);
  url.searchParams.set('hl',      hl);
  url.searchParams.set('num',     '8');
  url.searchParams.set('api_key', apiKey);

  let serpRes;
  try {
    serpRes = await fetch(url.toString());
  } catch (e) {
    return res.status(502).json({ error: 'SerpApi fetch failed: ' + e.message });
  }

  if (!serpRes.ok) {
    const text = await serpRes.text();
    return res.status(502).json({ error: `SerpApi ${serpRes.status}`, detail: text });
  }

  const data = await serpRes.json();

  // ── 결과 정제 (상위 5건) ───────────────────────────────
  const articles = (data.news_results || []).slice(0, 5).map(n => ({
    title    : n.title            || '',
    link     : n.link             || '',
    source   : n.source?.name || n.source || '',
    date     : n.date             || '',
    snippet  : n.snippet          || '',
    thumbnail: n.thumbnail        || '',
  }));

  return res.status(200).json({ articles, total: (data.news_results||[]).length, query });
}

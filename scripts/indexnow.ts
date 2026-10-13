/**
 * Tells Bing (and through it ChatGPT search, DuckDuckGo, Yandex) that pages
 * changed, so they recrawl now instead of in weeks. IndexNow, not Google:
 * Google does not support it and reads the sitemap from Search Console instead.
 *
 *   npm run indexnow            # submit every URL in the live sitemap
 *
 * The key is public by design: it proves we own the site because the same
 * value is served at https://www.devskills.in/<key>.txt (public/<key>.txt).
 */
import { SITE_URL as SITE } from '../lib/seo'
const KEY = '83079f97cdde9c68940fcf34afb8f1fd'

async function main() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (!urls.length) throw new Error('sitemap has no URLs')
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
  })
  // 200 accepted, 202 accepted pending key check; anything else is a real error
  console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URLs`)
  if (res.status >= 300) {
    console.error(await res.text())
    process.exit(1)
  }
}

main()

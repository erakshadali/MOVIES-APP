// Turns TMDB "watch providers" data into links people can click to go and
// watch a title on the service's own website.
//
// TMDB does not give direct links into each service, only one "where to watch"
// page per title and country. For the big services whose search pages are
// well known, we link to the title's search on that service; everything else
// falls back to that "where to watch" page.

const SEARCH_LINKS = [
  ['netflix', (q) => `https://www.netflix.com/search?q=${q}`],
  ['amazon prime video', (q) => `https://www.primevideo.com/search?phrase=${q}`],
  ['amazon video', (q) => `https://www.primevideo.com/search?phrase=${q}`],
  ['apple tv', (q) => `https://tv.apple.com/search?term=${q}`],
  ['youtube', (q) => `https://www.youtube.com/results?search_query=${q}`],
  ['google play', (q) => `https://play.google.com/store/search?q=${q}&c=movies`],
  ['hulu', (q) => `https://www.hulu.com/search?q=${q}`],
  ['zee5', (q) => `https://www.zee5.com/search?q=${q}`],
  ['crunchyroll', (q) => `https://www.crunchyroll.com/search?q=${q}`],
  ['tubi', (q) => `https://tubitv.com/search/${q}`],
  ['bbc iplayer', (q) => `https://www.bbc.co.uk/iplayer/search?q=${q}`],
]

// "… Amazon Channel" / "… Apple TV channel" are add-ons sold inside another
// service, so a search on their own name would be misleading.
const IS_CHANNEL = /(amazon|apple tv) channel/i

// Groups TMDB reports for a country, in the order we show them.
export const WATCH_GROUPS = [
  ['flatrate', 'Stream'],
  ['free', 'Free'],
  ['ads', 'Free with ads'],
  ['rent', 'Rent'],
  ['buy', 'Buy'],
]

export function providerLink(provider, title, fallbackUrl) {
  const name = provider.provider_name.toLowerCase()
  if (!IS_CHANNEL.test(name)) {
    const match = SEARCH_LINKS.find(([key]) => name.includes(key))
    if (match) return { url: match[1](encodeURIComponent(title)), direct: true }
  }
  return { url: fallbackUrl, direct: false }
}

export function hasAvailability(countryData) {
  return WATCH_GROUPS.some(([key]) => countryData?.[key]?.length)
}

// The single best place to send someone who clicks "Watch now":
// streaming first, then free, then rent / buy.
export function bestWatchOption(countryData, title) {
  if (!countryData?.link) return null
  for (const [key] of WATCH_GROUPS) {
    const provider = countryData[key]?.[0]
    if (provider) {
      const { url, direct } = providerLink(provider, title, countryData.link)
      return {
        url,
        direct,
        providerName: provider.provider_name,
        label: direct ? `Watch on ${provider.provider_name}` : 'Where to watch',
      }
    }
  }
  return null
}

export function regionName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

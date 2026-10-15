const rupee = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatRupees = (n) => rupee.format(n)

/** yyyy-mm-dd in the browser's local time (toISOString would shift to UTC). */
export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** The next `count` days starting today, each with a short and long label. */
export function upcomingDays(count = 14) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    return {
      iso: isoDate(d),
      weekday: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }
  })
}

export function longDate(iso) {
  return parseIsoDate(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Remembers which phone number made each booking, so the player isn't asked again. */
const PHONES_KEY = 'iceRealm.bookingPhones'

export function rememberPhone(ref, phone) {
  try {
    const all = JSON.parse(localStorage.getItem(PHONES_KEY) || '{}')
    all[ref] = phone
    localStorage.setItem(PHONES_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked; the booking page will ask for the number instead.
  }
}

export function recallPhone(ref) {
  try {
    return JSON.parse(localStorage.getItem(PHONES_KEY) || '{}')[ref] ?? ''
  } catch {
    return ''
  }
}

const CITY_KEY = 'iceRealm.city'

export function savedCity() {
  try {
    return localStorage.getItem(CITY_KEY) || 'mumbai'
  } catch {
    return 'mumbai'
  }
}

export function saveCity(slug) {
  try {
    localStorage.setItem(CITY_KEY, slug)
  } catch {
    // Not critical.
  }
}

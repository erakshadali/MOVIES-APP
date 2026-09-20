// Best guess at the viewer's country (for watch providers and age ratings),
// taken from the browser language, e.g. "en-IN" -> "IN". Falls back to US.
export function defaultRegion() {
  const match = (navigator.language || '').match(/-([A-Za-z]{2})$/)
  return match ? match[1].toUpperCase() : 'US'
}

export function formatMoney(amount) {
  if (!amount) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ageFrom(birthday, deathday) {
  if (!birthday) return null
  const born = new Date(`${birthday}T00:00:00`)
  const end = deathday ? new Date(`${deathday}T00:00:00`) : new Date()
  let age = end.getFullYear() - born.getFullYear()
  const beforeBirthday =
    end.getMonth() < born.getMonth() ||
    (end.getMonth() === born.getMonth() && end.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age
}

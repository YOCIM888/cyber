const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0)
}

export function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0)
}

export function formatInteger(value) {
  return integerFormatter.format(Math.round(Number(value) || 0))
}

export function formatPercent(ratio, digits = 2) {
  if (!Number.isFinite(ratio)) return '0.00%'
  const value = ratio * 100
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatSignedMoney(value) {
  const number = Number(value) || 0
  return `${number > 0 ? '+' : number < 0 ? '-' : ''}${formatMoney(Math.abs(number))}`
}

export function formatVolume(value) {
  const volume = Number(value) || 0
  if (volume >= 100000000) return `${(volume / 100000000).toFixed(2)} 亿`
  if (volume >= 10000) return `${(volume / 10000).toFixed(1)} 万`
  return formatInteger(volume)
}

export function formatDay(day) {
  return String(day).padStart(2, '0')
}

import { computed } from 'vue'
import services from '../data/services.json'
import settings from '../data/settings.json'

const dateFormatter = new Intl.DateTimeFormat('fr-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Format a number as Swiss franc, keeping a regular space before CHF.
 * @param {number} value
 * @returns {string}
 */
export function formatMoney(value) {
  const formatted = new Intl.NumberFormat('fr-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)

  return `${formatted.replace(/\u202f|\u00a0/g, ' ')} CHF`
}

/**
 * Format a date with Swiss day/month/year order.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatDate(value) {
  return dateFormatter.format(new Date(value))
}

/**
 * Return an ISO date offset by the requested number of days.
 * @param {number} days
 * @returns {string}
 */
export function dateAfterDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Create or reuse a yearly quote number.
 * @returns {string}
 */
export function createQuoteNumber() {
  const year = new Date().getFullYear()
  const key = `quote_counter_${year}`
  const current = Number(localStorage.getItem(key) || settings.quote.startingNumber - 1)
  const next = current + 1
  localStorage.setItem(key, String(next))
  return `${settings.quote.quotePrefix}-${year}-${String(next).padStart(4, '0')}`
}

/**
 * Build all monetary totals and display rows for the current quote.
 * @param {import('vue').Ref | object} source
 */
export function useQuote(source) {
  const state = 'value' in source ? source : { value: source }

  const selectedServices = computed(() =>
    state.value.selectedServiceIds
      .map((id) => services.find((service) => service.id === id))
      .filter(Boolean),
  )

  const rows = computed(() =>
    selectedServices.value.map((service) => {
      const detail = state.value.serviceDetails[service.id] || { optionIds: [], quantity: 1 }
      const quantity = service.unit === 'hour' ? Math.max(Number(detail.quantity) || 1, 0.5) : 1
      const optionRows = service.options.filter((option) => detail.optionIds?.includes(option.id))
      const serviceTotal = service.basePrice * quantity
      const optionsTotal = optionRows.reduce((sum, option) => sum + option.extraPrice, 0)

      return {
        service,
        quantity,
        options: optionRows,
        unitPrice: service.basePrice,
        serviceTotal,
        optionsTotal,
        lineTotal: serviceTotal + optionsTotal,
      }
    }),
  )

  const servicesSubtotal = computed(() =>
    rows.value.reduce((sum, row) => sum + row.lineTotal, 0),
  )

  const travelFees = computed(() => {
    if (!state.value.global.travelEnabled) return 0
    return (Number(state.value.global.distanceKm) || 0) * settings.quote.travelRatePerKm
  })

  const urgencyFees = computed(() => {
    if (!state.value.global.urgency) return 0
    return servicesSubtotal.value * (settings.quote.urgencySurchargePercent / 100)
  })

  const discountAmount = computed(() => {
    const percent = Math.min(
      Math.max(Number(state.value.global.discountPercent) || 0, 0),
      settings.quote.maxDiscountPercent,
    )
    return (servicesSubtotal.value + travelFees.value + urgencyFees.value) * (percent / 100)
  })

  const taxableBase = computed(
    () => servicesSubtotal.value + travelFees.value + urgencyFees.value - discountAmount.value,
  )

  const vatAmount = computed(() =>
    settings.vat.enabled ? taxableBase.value * (settings.vat.rate / 100) : 0,
  )

  const total = computed(() => taxableBase.value + vatAmount.value)

  return {
    rows,
    selectedServices,
    servicesSubtotal,
    travelFees,
    urgencyFees,
    discountAmount,
    taxableBase,
    vatAmount,
    total,
    settings,
  }
}

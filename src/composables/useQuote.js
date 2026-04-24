import { computed } from 'vue'
import services from '../data/services.json'
import settings from '../data/settings.json'
import { buildQuoteRows, calculateQuoteTotals } from './quoteMath'

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

  const rows = computed(() => buildQuoteRows(state.value, services))
  const selectedServices = computed(() => rows.value.map((row) => row.service))
  const totals = computed(() => calculateQuoteTotals(state.value, services, settings))
  const servicesSubtotal = computed(() => totals.value.servicesSubtotal)
  const travelFees = computed(() => totals.value.travelFees)
  const urgencyFees = computed(() => totals.value.urgencyFees)
  const discountAmount = computed(() => totals.value.discountAmount)
  const taxableBase = computed(() => totals.value.taxableBase)
  const vatAmount = computed(() => totals.value.vatAmount)
  const total = computed(() => totals.value.total)

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

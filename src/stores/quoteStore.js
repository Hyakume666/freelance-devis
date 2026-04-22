import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import services from '../data/services.json'
import settings from '../data/settings.json'
import { createQuoteNumber, dateAfterDays, useQuote } from '../composables/useQuote'

const initialClient = {
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  zip: '',
  city: '',
  projectDescription: '',
  existingClient: false,
}

function createInitialState() {
  return {
    selectedServiceIds: [],
    serviceDetails: {},
    global: {
      travelEnabled: false,
      distanceKm: 0,
      urgency: false,
      discountPercent: 0,
      discountReason: '',
      existingClient: false,
    },
    client: { ...initialClient },
    meta: {
      quoteNumber: '',
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: dateAfterDays(settings.quote.validityDays),
    },
  }
}

export const useQuoteStore = defineStore('quote', () => {
  const state = reactive(createInitialState())
  const totals = useQuote(state)

  const selectedCount = computed(() => state.selectedServiceIds.length)
  const canConfigure = computed(() => selectedCount.value > 0)

  /**
   * @param {string} serviceId
   */
  function ensureServiceDetail(serviceId) {
    const service = services.find((item) => item.id === serviceId)
    if (!service || state.serviceDetails[serviceId]) return
    state.serviceDetails[serviceId] = {
      optionIds: [],
      quantity: service.unit === 'hour' ? Math.max(service.estimatedDuration || 1, 1) : 1,
    }
  }

  /**
   * @param {string} serviceId
   */
  function toggleService(serviceId) {
    if (state.selectedServiceIds.includes(serviceId)) {
      state.selectedServiceIds = state.selectedServiceIds.filter((id) => id !== serviceId)
      delete state.serviceDetails[serviceId]
      return
    }

    state.selectedServiceIds.push(serviceId)
    ensureServiceDetail(serviceId)
  }

  /**
   * @param {string} serviceId
   * @param {string} optionId
   */
  function toggleOption(serviceId, optionId) {
    ensureServiceDetail(serviceId)
    const detail = state.serviceDetails[serviceId]
    detail.optionIds = detail.optionIds.includes(optionId)
      ? detail.optionIds.filter((id) => id !== optionId)
      : [...detail.optionIds, optionId]
  }

  /**
   * @param {string} serviceId
   * @param {number} quantity
   */
  function setQuantity(serviceId, quantity) {
    ensureServiceDetail(serviceId)
    state.serviceDetails[serviceId].quantity = Math.max(Number(quantity) || 1, 0.5)
  }

  function ensureQuoteNumber() {
    if (!state.meta.quoteNumber) {
      state.meta.quoteNumber = createQuoteNumber()
    }
  }

  function reset() {
    Object.assign(state, createInitialState())
  }

  /**
   * @param {'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé'} status
   * @param {string} pdfData
   */
  function saveHistory(status = 'Brouillon', pdfData = '') {
    ensureQuoteNumber()
    const entry = {
      id: crypto.randomUUID(),
      quoteNumber: state.meta.quoteNumber,
      date: state.meta.issueDate,
      clientName: `${state.client.firstName} ${state.client.lastName}`.trim(),
      clientEmail: state.client.email,
      total: totals.total.value,
      status,
      pdfData,
    }
    const current = JSON.parse(localStorage.getItem('quote_history') || '[]')
    const next = [entry, ...current].slice(0, 20)
    localStorage.setItem('quote_history', JSON.stringify(next))
    return entry
  }

  return {
    state,
    totals,
    rows: totals.rows,
    servicesSubtotal: totals.servicesSubtotal,
    travelFees: totals.travelFees,
    urgencyFees: totals.urgencyFees,
    discountAmount: totals.discountAmount,
    taxableBase: totals.taxableBase,
    vatAmount: totals.vatAmount,
    total: totals.total,
    selectedCount,
    canConfigure,
    ensureServiceDetail,
    toggleService,
    toggleOption,
    setQuantity,
    ensureQuoteNumber,
    saveHistory,
    reset,
  }
})

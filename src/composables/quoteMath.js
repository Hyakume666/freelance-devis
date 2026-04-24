/**
 * Build selected service rows with quantities, options, and line totals.
 * @param {object} state
 * @param {Array<object>} services
 * @returns {Array<object>}
 */
export function buildQuoteRows(state, services) {
  return state.selectedServiceIds
    .map((id) => services.find((service) => service.id === id))
    .filter(Boolean)
    .map((service) => {
      const detail = state.serviceDetails[service.id] || { optionIds: [], quantity: 1 }
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
    })
}

/**
 * Calculate quote totals from a plain quote state.
 * @param {object} state
 * @param {Array<object>} services
 * @param {object} settings
 * @returns {object}
 */
export function calculateQuoteTotals(state, services, settings) {
  const rows = buildQuoteRows(state, services)
  const servicesSubtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
  const travelFees = state.global.travelEnabled
    ? (Number(state.global.distanceKm) || 0) * settings.quote.travelRatePerKm
    : 0
  const urgencyFees = state.global.urgency
    ? servicesSubtotal * (settings.quote.urgencySurchargePercent / 100)
    : 0
  const discountPercent = Math.min(
    Math.max(Number(state.global.discountPercent) || 0, 0),
    settings.quote.maxDiscountPercent,
  )
  const discountAmount = (servicesSubtotal + travelFees + urgencyFees) * (discountPercent / 100)
  const taxableBase = servicesSubtotal + travelFees + urgencyFees - discountAmount
  const vatAmount = settings.vat.enabled ? taxableBase * (settings.vat.rate / 100) : 0
  const total = taxableBase + vatAmount

  return {
    rows,
    servicesSubtotal,
    travelFees,
    urgencyFees,
    discountPercent,
    discountAmount,
    taxableBase,
    vatAmount,
    total,
  }
}

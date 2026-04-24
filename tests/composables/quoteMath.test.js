import { describe, expect, it } from 'vitest'
import services from '../../src/data/services.json'
import settings from '../../src/data/settings.json'
import { buildQuoteRows, calculateQuoteTotals } from '../../src/composables/quoteMath'

function createState(overrides = {}) {
  return {
    selectedServiceIds: ['depannage-domicile', 'site-vitrine', 'missing-service'],
    serviceDetails: {
      'depannage-domicile': {
        quantity: 0.2,
        optionIds: ['travel-included'],
      },
      'site-vitrine': {
        quantity: 3,
        optionIds: ['seo-base', 'contact-form'],
      },
    },
    global: {
      travelEnabled: true,
      distanceKm: 10,
      urgency: true,
      discountPercent: 42,
      discountReason: '',
      existingClient: false,
    },
    ...overrides,
  }
}

describe('quoteMath', () => {
  it('builds selected quote rows with clamped hourly quantity and option totals', () => {
    const rows = buildQuoteRows(createState(), services)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      service: expect.objectContaining({ id: 'depannage-domicile' }),
      quantity: 0.5,
      unitPrice: 80,
      serviceTotal: 40,
      optionsTotal: 50,
      lineTotal: 90,
    })
    expect(rows[0].options.map((option) => option.id)).toEqual(['travel-included'])
    expect(rows[1]).toMatchObject({
      service: expect.objectContaining({ id: 'site-vitrine' }),
      quantity: 1,
      unitPrice: 800,
      serviceTotal: 800,
      optionsTotal: 230,
      lineTotal: 1030,
    })
    expect(rows[1].options.map((option) => option.id)).toEqual(['seo-base', 'contact-form'])
  })

  it('calculates surcharges, caps the discount percent, and applies VAT on the taxable base', () => {
    const totals = calculateQuoteTotals(createState(), services, settings)

    expect(totals.servicesSubtotal).toBe(1120)
    expect(totals.travelFees).toBe(7)
    expect(totals.urgencyFees).toBe(280)
    expect(totals.discountPercent).toBe(settings.quote.maxDiscountPercent)
    expect(totals.discountAmount).toBeCloseTo(422.1, 2)
    expect(totals.taxableBase).toBeCloseTo(984.9, 2)
    expect(totals.vatAmount).toBe(0)
    expect(totals.total).toBeCloseTo(984.9, 2)
  })
})

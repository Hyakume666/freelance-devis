import { describe, expect, test } from 'vitest'
import settings from '../../src/data/settings.json'
import buildQuoteEmailPayload from '../../src/server/buildQuoteEmailPayload'

describe('buildQuoteEmailPayload', () => {
  test('builds the Brevo payload for a generated quote PDF', () => {
    const payload = buildQuoteEmailPayload({
      quote: {
        state: {
          client: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
          },
          meta: {
            quoteNumber: 'DEVIS-2026-0001',
          },
        },
        totals: {
          rows: [{ service: { name: 'Audit' }, lineTotal: 1200 }],
          total: 1200,
        },
      },
      pdf: {
        base64: 'ZmFrZS1wZGY=',
        fileName: 'DEVIS-2026-0001.pdf',
      },
      ownerEmail: 'owner@example.com',
    })

    expect(payload.sender.email).toBe(settings.company.email)
    expect(payload.to).toEqual([{ email: 'ada@example.com', name: 'Ada Lovelace' }])
    expect(payload.attachment[0].name).toBe('DEVIS-2026-0001.pdf')
    expect(payload.bcc).toEqual([{ email: 'owner@example.com' }])
    expect(payload.subject).toContain('DEVIS-2026-0001')
  })
})

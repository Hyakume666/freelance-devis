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

  test('omits bcc when ownerEmail is missing', () => {
    const payload = buildQuoteEmailPayload({
      quote: {
        state: {
          client: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
          },
          meta: {
            quoteNumber: 'DEVIS-2026-0002',
          },
        },
        totals: {
          rows: [{ service: { name: 'Audit' }, lineTotal: 1200 }],
          total: 1200,
        },
      },
      pdf: {
        base64: 'ZmFrZS1wZGY=',
        fileName: 'DEVIS-2026-0002.pdf',
      },
    })

    expect(payload.bcc).toBeUndefined()
  })

  test('supports ref-like totals values', () => {
    const payload = buildQuoteEmailPayload({
      quote: {
        state: {
          client: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
          },
          meta: {
            quoteNumber: 'DEVIS-2026-0003',
          },
        },
        totals: {
          rows: { value: [{ service: { name: 'Audit' }, lineTotal: 1200 }] },
          total: { value: 1200 },
        },
      },
      pdf: {
        base64: 'ZmFrZS1wZGY=',
        fileName: 'DEVIS-2026-0003.pdf',
      },
    })

    expect(payload.htmlContent).toContain('Audit')
    expect(payload.htmlContent).toContain('Total:')
  })

  test('escapes request-derived HTML content', () => {
    const payload = buildQuoteEmailPayload({
      quote: {
        state: {
          client: {
            firstName: '<Ada & Co>',
            lastName: 'Lovelace',
            email: 'ada@example.com',
          },
          meta: {
            quoteNumber: 'DEVIS-2026-<0004>',
          },
        },
        totals: {
          rows: [{ service: { name: '<Audit & Review>' }, lineTotal: 1200 }],
          total: 1200,
        },
      },
      pdf: {
        base64: 'ZmFrZS1wZGY=',
        fileName: 'DEVIS-2026-0004.pdf',
      },
    })

    expect(payload.htmlContent).toContain('&lt;Audit &amp; Review&gt;')
    expect(payload.htmlContent).toContain('Votre devis DEVIS-2026-&lt;0004&gt;')
    expect(payload.htmlContent).toContain('Bonjour &lt;Ada &amp; Co&gt;,')
    expect(payload.htmlContent).not.toContain('<Audit & Review>')
    expect(payload.htmlContent).not.toContain('Bonjour <Ada & Co>,')
  })
})

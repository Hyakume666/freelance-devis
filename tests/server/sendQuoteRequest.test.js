import { describe, expect, it, vi } from 'vitest'
import { sendQuoteRequest } from '../../src/server/sendQuoteRequest'

describe('sendQuoteRequest', () => {
  it('rejects request with no quote payload', async () => {
    const result = await sendQuoteRequest({
      body: {},
      env: { BREVO_API_KEY: 'secret' },
      fetchImpl: vi.fn(),
    })

    expect(result.status).toBe(400)
    expect(result.body.message).toMatch(/payload/i)
  })

  it('returns messageId when Brevo accepts the email', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<abc@brevo>' }),
    })

    const result = await sendQuoteRequest({
      body: {
        quote: {
          state: {
            meta: {
              quoteNumber: 'DEVIS-2026-0001',
            },
            client: {
              firstName: 'Ada',
              lastName: 'Lovelace',
              email: 'ada@example.com',
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
      },
      env: {
        BREVO_API_KEY: 'secret',
        OWNER_EMAIL: 'owner@example.com',
      },
      fetchImpl,
    })

    expect(result.status).toBe(202)
    expect(result.body.messageId).toBe('<abc@brevo>')
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
})

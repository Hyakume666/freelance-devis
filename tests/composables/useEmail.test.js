import { computed } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEmail } from '../../src/composables/useEmail'

vi.mock('../../src/composables/usePDF', () => ({
  generateQuotePdf: vi.fn(() => ({
    base64: 'ZmFrZS1wZGY=',
    fileName: 'DEVIS-2026-0001.pdf',
  })),
}))

function createQuote() {
  return {
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
      rows: computed(() => [{ service: { name: 'Audit technique' }, lineTotal: 1200 }]),
      total: computed(() => 1200),
    },
  }
}

describe('useEmail', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<abc@brevo>' }),
    })
  })

  it('posts the quote payload to the internal send-quote api', async () => {
    const quote = createQuote()

    const result = await useEmail(quote).sendQuoteEmail()
    const [, request] = globalThis.fetch.mock.calls[0]

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/send-quote',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(JSON.parse(request.body)).toEqual({
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
          rows: [{ service: { name: 'Audit technique' }, lineTotal: 1200 }],
          total: 1200,
        },
      },
      pdf: {
        base64: 'ZmFrZS1wZGY=',
        fileName: 'DEVIS-2026-0001.pdf',
      },
    })
    expect(result.messageId).toBe('<abc@brevo>')
  })

  it('keeps plain-text api failures diagnosable when json parsing fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('invalid json')
      },
      text: async () => 'upstream gateway failed',
    })

    await expect(useEmail(createQuote()).sendQuoteEmail()).rejects.toThrow('upstream gateway failed')
  })
})

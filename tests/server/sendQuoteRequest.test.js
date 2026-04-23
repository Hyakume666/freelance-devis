import { describe, expect, it, vi } from 'vitest'
import handler from '../../api/send-quote'
import { sendQuoteRequest } from '../../src/server/sendQuoteRequest'

function createValidBody() {
  return {
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
  }
}

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
      body: createValidBody(),
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

  it('returns a config error when BREVO_API_KEY is missing', async () => {
    const result = await sendQuoteRequest({
      body: createValidBody(),
      env: {},
      fetchImpl: vi.fn(),
    })

    expect(result.status).toBe(500)
    expect(result.body.message).toMatch(/configuration/i)
  })

  it('rejects malformed nested quote payloads', async () => {
    const body = createValidBody()
    delete body.quote.state.client.email

    const result = await sendQuoteRequest({
      body,
      env: { BREVO_API_KEY: 'secret' },
      fetchImpl: vi.fn(),
    })

    expect(result.status).toBe(400)
    expect(result.body.message).toMatch(/payload/i)
  })

  it('returns Brevo refusal details when the API rejects the email', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'sender blocked' }),
    })

    const result = await sendQuoteRequest({
      body: createValidBody(),
      env: { BREVO_API_KEY: 'secret' },
      fetchImpl,
    })

    expect(result.status).toBe(403)
    expect(result.body.message).toContain("Brevo a refuse l'envoi (403)")
    expect(result.body.message).toContain('sender blocked')
  })

  it('normalizes unexpected fetch failures', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await sendQuoteRequest({
      body: createValidBody(),
      env: { BREVO_API_KEY: 'secret' },
      fetchImpl,
    })

    expect(result.status).toBe(502)
    expect(result.body.message).toMatch(/impossible|indisponible|erreur/i)
  })
})

describe('send-quote api handler', () => {
  it('returns 405 for non-POST requests', async () => {
    const status = vi.fn().mockReturnThis()
    const json = vi.fn()

    await handler(
      { method: 'GET' },
      {
        status,
        json,
      },
    )

    expect(status).toHaveBeenCalledWith(405)
    expect(json).toHaveBeenCalledWith({ message: 'Methode non autorisee.' })
  })
})

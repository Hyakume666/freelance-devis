import { generateQuotePdf } from './usePDF'

function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

function serializeQuoteForEmail(quote) {
  const state = valueOf(quote.state) || {}
  const meta = valueOf(state.meta) || {}
  const client = valueOf(state.client) || {}
  const rows = valueOf(quote.totals?.rows) || []
  const total = valueOf(quote.totals?.total)

  return {
    state: {
      meta: { ...meta },
      client: { ...client },
    },
    totals: {
      rows: Array.isArray(rows)
        ? rows.map((row) => ({
            ...row,
            service: row?.service ? { ...row.service } : row?.service,
            options: Array.isArray(row?.options) ? row.options.map((option) => ({ ...option })) : row?.options,
          }))
        : [],
      total,
    },
  }
}

async function readResponseBody(response) {
  const textResponse = typeof response.clone === 'function' ? response.clone() : response

  try {
    return await response.json()
  } catch {
    try {
      const message = await textResponse.text()
      return message ? { message } : {}
    } catch {
      return {}
    }
  }
}

/**
 * Send a quote through the internal email API.
 * @param {{ state: object, totals: object }} quote
 */
export function useEmail(quote) {
  async function sendQuoteEmail() {
    const pdf = generateQuotePdf(quote, { download: false })
    const serializedQuote = serializeQuoteForEmail(quote)

    const response = await fetch('/api/send-quote', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        quote: serializedQuote,
        pdf: {
          base64: pdf.base64,
          fileName: pdf.fileName,
        },
      }),
    })

    const body = await readResponseBody(response)

    if (!response.ok) {
      throw new Error(body.message || `L'envoi a échoué (${response.status}).`)
    }

    return {
      pdf,
      messageId: body.messageId || '',
    }
  }

  return { sendQuoteEmail }
}

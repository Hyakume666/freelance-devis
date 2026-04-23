import { generateQuotePdf } from './usePDF'

/**
 * Send a quote through the internal email API.
 * @param {{ state: object, totals: object }} quote
 */
export function useEmail(quote) {
  async function sendQuoteEmail() {
    const pdf = generateQuotePdf(quote, { download: false })

    const response = await fetch('/api/send-quote', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        quote,
        pdf: {
          base64: pdf.base64,
          fileName: pdf.fileName,
        },
      }),
    })

    const body = await response.json().catch(() => ({}))

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

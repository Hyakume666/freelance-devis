import settings from '../data/settings.json'
import { formatMoney } from './useQuote'
import { generateQuotePdf } from './usePDF'

function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

/**
 * Send a quote through Brevo transactional email.
 * @param {{ state: object, totals: object }} quote
 */
export function useEmail(quote) {
  async function sendQuoteEmail() {
    const apiKey = import.meta.env.VITE_BREVO_API_KEY
    if (!apiKey) {
      throw new Error('Clé API Brevo manquante dans le fichier .env')
    }

    const pdf = generateQuotePdf(quote, { download: false })
    const subject = settings.email.subjectTemplate.replace('{quoteNumber}', quote.state.meta.quoteNumber)
    const ownerEmail = import.meta.env.VITE_OWNER_EMAIL

    const lines = valueOf(quote.totals.rows)
      .map(
        (row) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${row.service.name}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.lineTotal)}</td>
          </tr>
        `,
      )
      .join('')

    const payload = {
      sender: { name: settings.company.name, email: settings.company.email },
      replyTo: { name: settings.company.name, email: settings.company.email },
      to: [{ email: quote.state.client.email, name: `${quote.state.client.firstName} ${quote.state.client.lastName}` }],
      subject,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
          <h1 style="font-size:22px;">Votre devis ${quote.state.meta.quoteNumber}</h1>
          <p>Bonjour ${quote.state.client.firstName},</p>
          <p>Vous trouverez votre devis en pièce jointe. Voici le récapitulatif principal:</p>
          <table style="border-collapse:collapse;width:100%;max-width:560px;">${lines}</table>
          <p style="font-size:18px;font-weight:700;">Total: ${formatMoney(valueOf(quote.totals.total))}</p>
          <p>Je reste à votre disposition pour toute question.</p>
          <p>${settings.company.name}<br>${settings.company.email}</p>
        </div>
      `,
      attachment: [
        {
          content: pdf.base64,
          name: pdf.fileName,
        },
      ],
    }

    if (settings.email.copyToOwner && ownerEmail) {
      payload.bcc = [{ email: ownerEmail }]
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let details
      try {
        const body = await response.json()
        details = body.message || body.code || ''
      } catch {
        details = await response.text()
      }

      throw new Error(
        details
          ? `Brevo a refusé l'envoi (${response.status}) : ${details}`
          : `Brevo a refusé l'envoi (${response.status})`,
      )
    }

    const brevoResult = await response.json().catch(() => ({}))

    return { pdf, brevo: brevoResult, messageId: brevoResult.messageId }
  }

  return { sendQuoteEmail }
}

import settings from '../data/settings.json'
import { formatMoney } from '../composables/useQuote'

/**
 * Unwrap plain values and Vue refs with the same helper.
 * @param {unknown} maybeRef
 * @returns {unknown}
 */
function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

/**
 * Escape user-controlled strings before interpolating them into HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build the Brevo transactional email payload for a quote.
 * @param {{ quote: { state: object, totals: object }, pdf: { base64: string, fileName: string }, ownerEmail?: string }} params
 */
export function buildQuoteEmailPayload({ quote, pdf, ownerEmail }) {
  const state = valueOf(quote.state) || {}
  const client = valueOf(state.client) || {}
  const meta = valueOf(state.meta) || {}
  const rows = valueOf(quote.totals?.rows) || []
  const total = valueOf(quote.totals?.total)
  const quoteNumber = meta.quoteNumber || ''
  const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim()
  const subject = settings.email.subjectTemplate.replace('{quoteNumber}', quoteNumber)
  const escapedQuoteNumber = escapeHtml(quoteNumber)
  const escapedFirstName = escapeHtml(client.firstName)

  const lines = rows
    .map(
      (row) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(row.service?.name)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(row.lineTotal)}</td>
          </tr>
        `,
    )
    .join('')

  const payload = {
    sender: { name: settings.company.name, email: settings.company.email },
    replyTo: { name: settings.company.name, email: settings.company.email },
    to: [{ email: client.email, name: clientName }],
    subject,
    htmlContent: `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
          <h1 style="font-size:22px;">Votre devis ${escapedQuoteNumber}</h1>
          <p>Bonjour ${escapedFirstName},</p>
          <p>Vous trouverez votre devis en pièce jointe. Voici le récapitulatif principal:</p>
          <table style="border-collapse:collapse;width:100%;max-width:560px;">${lines}</table>
          <p style="font-size:18px;font-weight:700;">Total: ${formatMoney(total)}</p>
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

  return payload
}

export default buildQuoteEmailPayload

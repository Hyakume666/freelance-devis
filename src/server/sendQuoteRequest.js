import buildQuoteEmailPayload from './buildQuoteEmailPayload'

/**
 * Forward a validated quote email request to Brevo.
 * @param {{ body?: { quote?: object, pdf?: { base64?: string, fileName?: string } }, env?: Record<string, string>, fetchImpl?: typeof fetch }} params
 */
export async function sendQuoteRequest({ body, env, fetchImpl = fetch }) {
  if (!env?.BREVO_API_KEY) {
    return {
      status: 500,
      body: { message: 'Configuration email manquante sur le serveur.' },
    }
  }

  if (!body?.quote || !body?.pdf?.base64 || !body?.pdf?.fileName) {
    return {
      status: 400,
      body: { message: 'Payload de devis incomplet.' },
    }
  }

  if (
    !body.quote?.state?.meta?.quoteNumber ||
    !body.quote?.state?.client?.email ||
    !body.quote?.state?.client?.firstName ||
    !body.quote?.state?.client?.lastName ||
    !Array.isArray(body.quote?.totals?.rows) ||
    body.quote?.totals?.total == null
  ) {
    return {
      status: 400,
      body: { message: 'Payload de devis incomplet.' },
    }
  }

  try {
    const brevoPayload = buildQuoteEmailPayload({
      quote: body.quote,
      pdf: body.pdf,
      ownerEmail: env.OWNER_EMAIL,
    })

    const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    })

    if (!response.ok) {
      let details = ''

      try {
        const responseBody = await response.json()
        details = responseBody?.message || responseBody?.code || ''
      } catch {
        details = ''
      }

      return {
        status: response.status,
        body: {
          message: details
            ? `Brevo a refuse l'envoi (${response.status}) : ${details}`
            : `Brevo a refuse l'envoi (${response.status})`,
        },
      }
    }

    const data = await response.json().catch(() => ({}))

    return {
      status: 202,
      body: {
        message: "Message accepte par l'API transactionnelle.",
        messageId: data.messageId || '',
      },
    }
  } catch {
    return {
      status: 502,
      body: {
        message: "Le service d'envoi de devis est indisponible pour le moment.",
      },
    }
  }
}

export default sendQuoteRequest

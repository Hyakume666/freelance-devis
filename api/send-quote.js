import sendQuoteRequest from '../src/server/sendQuoteRequest'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Methode non autorisee.' })
    return
  }

  try {
    const result = await sendQuoteRequest({
      body: req.body,
      env: globalThis.process?.env || {},
    })

    res.status(result.status).json(result.body)
  } catch {
    res.status(500).json({
      message: "Une erreur serveur est survenue pendant l'envoi du devis.",
    })
  }
}

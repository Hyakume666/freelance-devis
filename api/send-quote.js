import sendQuoteRequest from '../src/server/sendQuoteRequest'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Méthode non autorisée.' })
    return
  }

  const result = await sendQuoteRequest({
    body: req.body,
    env: process.env,
  })

  res.status(result.status).json(result.body)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body as { text?: unknown }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field' })
  }

  const webhookUrl = process.env['N8N_WEBHOOK_URL']
  const apiSecret = process.env['API_SECRET']

  if (!webhookUrl) {
    console.error('N8N_WEBHOOK_URL environment variable is not set')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiSecret) {
    headers['X-Api-Key'] = apiSecret
  }

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    })

    if (!n8nResponse.ok) {
      console.error(`n8n responded with status ${n8nResponse.status}`)
      return res.status(502).json({ error: 'Upstream service error' })
    }

    const data: unknown = await n8nResponse.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('Failed to reach n8n webhook:', err)
    return res.status(502).json({ error: 'Failed to reach upstream service' })
  }
}

# Secure Quote Email Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Brevo API key from the browser and route quote email delivery through an internal server endpoint.

**Architecture:** Keep PDF generation in the browser for now so Phase 1 stays focused on secrets and transport. The client will post `{ quote, pdf }` to `/api/send-quote`; the server function will validate the payload, inject `BREVO_API_KEY`, call Brevo, and normalize errors for the frontend.

**Tech Stack:** Vue 3, Vite, Node serverless function, Fetch API, Vitest

---

### Task 1: Add a repeatable test harness and a shared Brevo payload builder

**Files:**
- Modify: `package.json:6-31`
- Create: `vitest.config.js`
- Create: `tests/server/buildQuoteEmailPayload.test.js`
- Create: `src/server/buildQuoteEmailPayload.js`

- [ ] **Step 1: Write the failing test and wire the test runner**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@vitejs/plugin-vue": "^6.0.6",
    "eslint": "^10.2.1",
    "eslint-plugin-vue": "^10.9.0",
    "jsdom": "^26.1.0",
    "prettier": "^3.8.3",
    "vite": "^8.0.9",
    "vitest": "^3.2.4"
  }
}
```

```js
// vitest.config.js
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
})
```

```js
// tests/server/buildQuoteEmailPayload.test.js
import { describe, expect, it } from 'vitest'
import settings from '../../src/data/settings.json'
import { buildQuoteEmailPayload } from '../../src/server/buildQuoteEmailPayload'

describe('buildQuoteEmailPayload', () => {
  it('builds a Brevo payload with attachment and optional bcc', () => {
    const payload = buildQuoteEmailPayload({
      quote: {
        state: {
          meta: { quoteNumber: 'DEVIS-2026-0001' },
          client: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
        },
        totals: {
          rows: [{ service: { name: 'Audit' }, lineTotal: 1200 }],
          total: 1200,
        },
      },
      pdf: { base64: 'ZmFrZS1wZGY=', fileName: 'DEVIS-2026-0001.pdf' },
      ownerEmail: 'owner@example.com',
    })

    expect(payload.sender.email).toBe(settings.company.email)
    expect(payload.to).toEqual([{ email: 'ada@example.com', name: 'Ada Lovelace' }])
    expect(payload.attachment[0].name).toBe('DEVIS-2026-0001.pdf')
    expect(payload.bcc).toEqual([{ email: 'owner@example.com' }])
    expect(payload.subject).toContain('DEVIS-2026-0001')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/server/buildQuoteEmailPayload.test.js`

Expected: FAIL with `Cannot find module '../../src/server/buildQuoteEmailPayload'`

- [ ] **Step 3: Write the minimal implementation**

```js
// src/server/buildQuoteEmailPayload.js
import settings from '../data/settings.json'
import { formatMoney } from '../composables/useQuote'

function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

export function buildQuoteEmailPayload({ quote, pdf, ownerEmail }) {
  const subject = settings.email.subjectTemplate.replace('{quoteNumber}', quote.state.meta.quoteNumber)
  const rows = valueOf(quote.totals.rows)
  const total = valueOf(quote.totals.total)

  const lines = rows
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
    to: [
      {
        email: quote.state.client.email,
        name: `${quote.state.client.firstName} ${quote.state.client.lastName}`.trim(),
      },
    ],
    subject,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
        <h1 style="font-size:22px;">Votre devis ${quote.state.meta.quoteNumber}</h1>
        <p>Bonjour ${quote.state.client.firstName},</p>
        <p>Vous trouverez votre devis en pièce jointe. Voici le récapitulatif principal :</p>
        <table style="border-collapse:collapse;width:100%;max-width:560px;">${lines}</table>
        <p style="font-size:18px;font-weight:700;">Total : ${formatMoney(total)}</p>
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/server/buildQuoteEmailPayload.test.js`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.js tests/server/buildQuoteEmailPayload.test.js src/server/buildQuoteEmailPayload.js
git commit -m "test: add Brevo payload builder coverage"
```

### Task 2: Add a server-side email request handler and a Vercel API wrapper

**Files:**
- Create: `tests/server/sendQuoteRequest.test.js`
- Create: `src/server/sendQuoteRequest.js`
- Create: `api/send-quote.js`

- [ ] **Step 1: Write the failing tests for payload validation and Brevo forwarding**

```js
// tests/server/sendQuoteRequest.test.js
import { describe, expect, it, vi } from 'vitest'
import { sendQuoteRequest } from '../../src/server/sendQuoteRequest'

describe('sendQuoteRequest', () => {
  it('rejects a request with no quote payload', async () => {
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
      body: {
        quote: {
          state: {
            meta: { quoteNumber: 'DEVIS-2026-0001' },
            client: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
          },
          totals: {
            rows: [{ service: { name: 'Audit' }, lineTotal: 1200 }],
            total: 1200,
          },
        },
        pdf: { base64: 'ZmFrZS1wZGY=', fileName: 'DEVIS-2026-0001.pdf' },
      },
      env: { BREVO_API_KEY: 'secret', OWNER_EMAIL: 'owner@example.com' },
      fetchImpl,
    })

    expect(result.status).toBe(202)
    expect(result.body.messageId).toBe('<abc@brevo>')
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- tests/server/sendQuoteRequest.test.js`

Expected: FAIL with `Cannot find module '../../src/server/sendQuoteRequest'`

- [ ] **Step 3: Implement the request handler and wrapper**

```js
// src/server/sendQuoteRequest.js
import { buildQuoteEmailPayload } from './buildQuoteEmailPayload'

export async function sendQuoteRequest({ body, env, fetchImpl = fetch }) {
  if (!env.BREVO_API_KEY) {
    return { status: 500, body: { message: 'Configuration email manquante sur le serveur.' } }
  }

  if (!body?.quote || !body?.pdf?.base64 || !body?.pdf?.fileName) {
    return { status: 400, body: { message: 'Payload de devis incomplet.' } }
  }

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
      const data = await response.json()
      details = data.message || data.code || ''
    } catch {
      details = ''
    }

    return {
      status: response.status,
      body: {
        message: details
          ? `Brevo a refusé l'envoi (${response.status}) : ${details}`
          : `Brevo a refusé l'envoi (${response.status})`,
      },
    }
  }

  const data = await response.json().catch(() => ({}))
  return {
    status: 202,
    body: {
      message: "Message accepté par l'API transactionnelle.",
      messageId: data.messageId || '',
    },
  }
}
```

```js
// api/send-quote.js
import { sendQuoteRequest } from '../src/server/sendQuoteRequest'

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- tests/server/sendQuoteRequest.test.js`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/server/sendQuoteRequest.test.js src/server/sendQuoteRequest.js api/send-quote.js
git commit -m "feat: add server-side quote email handler"
```

### Task 3: Refactor the browser composable to call the internal API instead of Brevo

**Files:**
- Create: `tests/composables/useEmail.test.js`
- Modify: `src/composables/useEmail.js:1-95`
- Modify: `.env.example`
- Modify: `README.md:5-58`

- [ ] **Step 1: Write the failing composable test**

```js
// tests/composables/useEmail.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEmail } from '../../src/composables/useEmail'

vi.mock('../../src/composables/usePDF', () => ({
  generateQuotePdf: vi.fn(() => ({ base64: 'ZmFrZS1wZGY=', fileName: 'DEVIS-2026-0001.pdf' })),
}))

describe('useEmail', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<abc@brevo>' }),
    })
  })

  it('posts the quote to the internal send endpoint', async () => {
    const quote = {
      state: {
        meta: { quoteNumber: 'DEVIS-2026-0001' },
        client: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      },
      totals: { rows: [], total: 1200 },
    }

    const { sendQuoteEmail } = useEmail(quote)
    const result = await sendQuoteEmail()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/send-quote',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.messageId).toBe('<abc@brevo>')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/composables/useEmail.test.js`

Expected: FAIL because `useEmail` still references `VITE_BREVO_API_KEY` and posts directly to Brevo

- [ ] **Step 3: Implement the client refactor and documentation changes**

```js
// src/composables/useEmail.js
import { generateQuotePdf } from './usePDF'

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
```

```bash
# .env.example
BREVO_API_KEY=
OWNER_EMAIL=
```

```md
## Variables d'environnement

Copiez `.env.example` vers `.env.local` puis renseignez `BREVO_API_KEY` et `OWNER_EMAIL`.

La clé Brevo est uniquement lue côté serveur via `/api/send-quote`.

## Déploiement

Le projet ne doit plus être publié sur GitHub Pages seul, car l'envoi email dépend maintenant d'une fonction serveur.
Déployez l'application sur Vercel ou une plateforme équivalente qui expose le dossier `api/`.
```

- [ ] **Step 4: Run the test and core verification**

Run: `npm run test -- tests/composables/useEmail.test.js`

Expected: PASS with `1 passed`

Run: `npm run lint`

Expected: PASS with no errors

- [ ] **Step 5: Commit**

```bash
git add tests/composables/useEmail.test.js src/composables/useEmail.js .env.example README.md
git commit -m "feat: route quote email through internal api"
```

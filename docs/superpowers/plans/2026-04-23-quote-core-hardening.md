# Quote Core Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make quote calculations, numbering, local history, and PDF summary generation deterministic and well-tested.

**Architecture:** Extract pure helpers from the current composables and store so the quote engine is testable without mounting Vue components. Pinia and jsPDF remain orchestration layers around small pure units.

**Tech Stack:** Vue 3, Pinia, jsPDF, Vitest

---

### Task 1: Extract pure quote math helpers and cover the monetary rules

**Files:**
- Create: `tests/composables/quoteMath.test.js`
- Create: `src/composables/quoteMath.js`
- Modify: `src/composables/useQuote.js:1-135`

- [ ] **Step 1: Write the failing tests for rows, surcharges, discount, and VAT**

```js
// tests/composables/quoteMath.test.js
import { describe, expect, it } from 'vitest'
import services from '../../src/data/services.json'
import settings from '../../src/data/settings.json'
import { buildQuoteRows, calculateQuoteTotals } from '../../src/composables/quoteMath'

describe('quoteMath', () => {
  it('builds rows with service quantity and selected options', () => {
    const state = {
      selectedServiceIds: [services[0].id],
      serviceDetails: {
        [services[0].id]: {
          quantity: 2,
          optionIds: services[0].options.slice(0, 1).map((option) => option.id),
        },
      },
      global: {
        travelEnabled: false,
        distanceKm: 0,
        urgency: false,
        discountPercent: 0,
      },
    }

    const rows = buildQuoteRows(state, services)
    expect(rows).toHaveLength(1)
    expect(rows[0].quantity).toBe(2)
    expect(rows[0].lineTotal).toBeGreaterThan(rows[0].serviceTotal)
  })

  it('applies travel, urgency, discount cap, and vat', () => {
    const state = {
      selectedServiceIds: [services[0].id],
      serviceDetails: {
        [services[0].id]: { quantity: 2, optionIds: [] },
      },
      global: {
        travelEnabled: true,
        distanceKm: 15,
        urgency: true,
        discountPercent: settings.quote.maxDiscountPercent + 10,
      },
    }

    const totals = calculateQuoteTotals(state, services, settings)
    expect(totals.travelFees).toBe(15 * settings.quote.travelRatePerKm)
    expect(totals.discountAmount).toBeGreaterThan(0)
    expect(totals.vatAmount).toBeGreaterThanOrEqual(0)
    expect(totals.total).toBeCloseTo(totals.taxableBase + totals.vatAmount)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- tests/composables/quoteMath.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/quoteMath'`

- [ ] **Step 3: Implement the pure helpers and rewire the composable**

```js
// src/composables/quoteMath.js
export function buildQuoteRows(state, services) {
  return state.selectedServiceIds
    .map((id) => services.find((service) => service.id === id))
    .filter(Boolean)
    .map((service) => {
      const detail = state.serviceDetails[service.id] || { optionIds: [], quantity: 1 }
      const quantity = service.unit === 'hour' ? Math.max(Number(detail.quantity) || 1, 0.5) : 1
      const options = service.options.filter((option) => detail.optionIds?.includes(option.id))
      const serviceTotal = service.basePrice * quantity
      const optionsTotal = options.reduce((sum, option) => sum + option.extraPrice, 0)

      return {
        service,
        quantity,
        options,
        unitPrice: service.basePrice,
        serviceTotal,
        optionsTotal,
        lineTotal: serviceTotal + optionsTotal,
      }
    })
}

export function calculateQuoteTotals(state, services, settings) {
  const rows = buildQuoteRows(state, services)
  const servicesSubtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
  const travelFees = state.global.travelEnabled
    ? (Number(state.global.distanceKm) || 0) * settings.quote.travelRatePerKm
    : 0
  const urgencyFees = state.global.urgency
    ? servicesSubtotal * (settings.quote.urgencySurchargePercent / 100)
    : 0
  const discountPercent = Math.min(
    Math.max(Number(state.global.discountPercent) || 0, 0),
    settings.quote.maxDiscountPercent,
  )
  const discountAmount = (servicesSubtotal + travelFees + urgencyFees) * (discountPercent / 100)
  const taxableBase = servicesSubtotal + travelFees + urgencyFees - discountAmount
  const vatAmount = settings.vat.enabled ? taxableBase * (settings.vat.rate / 100) : 0

  return {
    rows,
    servicesSubtotal,
    travelFees,
    urgencyFees,
    discountPercent,
    discountAmount,
    taxableBase,
    vatAmount,
    total: taxableBase + vatAmount,
  }
}
```

```js
// excerpt for src/composables/useQuote.js
import { computed } from 'vue'
import services from '../data/services.json'
import settings from '../data/settings.json'
import { buildQuoteRows, calculateQuoteTotals } from './quoteMath'

export function useQuote(source) {
  const state = 'value' in source ? source : { value: source }

  const rows = computed(() => buildQuoteRows(state.value, services))
  const quoteTotals = computed(() => calculateQuoteTotals(state.value, services, settings))

  return {
    rows,
    selectedServices: computed(() => rows.value.map((row) => row.service)),
    servicesSubtotal: computed(() => quoteTotals.value.servicesSubtotal),
    travelFees: computed(() => quoteTotals.value.travelFees),
    urgencyFees: computed(() => quoteTotals.value.urgencyFees),
    discountAmount: computed(() => quoteTotals.value.discountAmount),
    taxableBase: computed(() => quoteTotals.value.taxableBase),
    vatAmount: computed(() => quoteTotals.value.vatAmount),
    total: computed(() => quoteTotals.value.total),
    settings,
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- tests/composables/quoteMath.test.js`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/quoteMath.test.js src/composables/quoteMath.js src/composables/useQuote.js
git commit -m "refactor: extract quote math helpers"
```

### Task 2: Add defensive local storage helpers for quote history

**Files:**
- Create: `tests/composables/quoteStorage.test.js`
- Create: `src/composables/quoteStorage.js`
- Modify: `src/stores/quoteStore.js:105-125`
- Modify: `src/views/HistoryView.vue:1-126`

- [ ] **Step 1: Write the failing tests for invalid JSON, truncation, and append**

```js
// tests/composables/quoteStorage.test.js
import { describe, expect, it } from 'vitest'
import {
  appendQuoteHistoryEntry,
  readQuoteHistory,
  writeQuoteHistory,
} from '../../src/composables/quoteStorage'

function createStorage(seed = {}) {
  const state = { ...seed }
  return {
    getItem(key) {
      return key in state ? state[key] : null
    },
    setItem(key, value) {
      state[key] = value
    },
  }
}

describe('quoteStorage', () => {
  it('returns an empty array when stored json is invalid', () => {
    const storage = createStorage({ quote_history: '{broken' })
    expect(readQuoteHistory(storage)).toEqual([])
  })

  it('keeps only the latest 20 history entries', () => {
    const storage = createStorage()
    for (let index = 0; index < 25; index += 1) {
      appendQuoteHistoryEntry(storage, { id: String(index) })
    }

    expect(readQuoteHistory(storage)).toHaveLength(20)
    expect(readQuoteHistory(storage)[0].id).toBe('24')
  })

  it('writes a sanitized array payload', () => {
    const storage = createStorage()
    writeQuoteHistory(storage, [{ id: '1' }])
    expect(readQuoteHistory(storage)).toEqual([{ id: '1' }])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- tests/composables/quoteStorage.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/quoteStorage'`

- [ ] **Step 3: Implement the storage helper and update the store/view**

```js
// src/composables/quoteStorage.js
const HISTORY_KEY = 'quote_history'
const HISTORY_LIMIT = 20

export function readQuoteHistory(storage = localStorage) {
  try {
    const raw = storage.getItem(HISTORY_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

export function writeQuoteHistory(storage = localStorage, entries = []) {
  const safeEntries = Array.isArray(entries) ? entries.slice(0, HISTORY_LIMIT) : []
  storage.setItem(HISTORY_KEY, JSON.stringify(safeEntries))
  return safeEntries
}

export function appendQuoteHistoryEntry(storage = localStorage, entry) {
  const current = readQuoteHistory(storage)
  const next = [entry, ...current].slice(0, HISTORY_LIMIT)
  writeQuoteHistory(storage, next)
  return next
}
```

```js
// excerpt for src/stores/quoteStore.js
import { appendQuoteHistoryEntry } from '../composables/quoteStorage'

function saveHistory(status = 'Brouillon', pdfData = '') {
  ensureQuoteNumber()
  const entry = {
    id: crypto.randomUUID(),
    quoteNumber: state.meta.quoteNumber,
    date: state.meta.issueDate,
    clientName: `${state.client.firstName} ${state.client.lastName}`.trim(),
    clientEmail: state.client.email,
    total: totals.total.value,
    status,
    pdfData,
  }

  appendQuoteHistoryEntry(localStorage, entry)
  return entry
}
```

```js
// excerpt for src/views/HistoryView.vue
import { computed, ref } from 'vue'
import { readQuoteHistory, writeQuoteHistory } from '../composables/quoteStorage'

const history = ref(readQuoteHistory(localStorage))

function persist() {
  history.value = writeQuoteHistory(localStorage, history.value)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- tests/composables/quoteStorage.test.js`

Expected: PASS with `3 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/quoteStorage.test.js src/composables/quoteStorage.js src/stores/quoteStore.js src/views/HistoryView.vue
git commit -m "refactor: harden quote history storage"
```

### Task 3: Make quote number generation injectable and testable

**Files:**
- Create: `tests/composables/quoteNumbers.test.js`
- Create: `src/composables/quoteNumbers.js`
- Modify: `src/composables/useQuote.js:34-56`
- Modify: `src/stores/quoteStore.js:1-103`

- [ ] **Step 1: Write the failing tests for yearly numbering**

```js
// tests/composables/quoteNumbers.test.js
import { describe, expect, it } from 'vitest'
import settings from '../../src/data/settings.json'
import { createQuoteNumber } from '../../src/composables/quoteNumbers'

function createStorage(seed = {}) {
  const state = { ...seed }
  return {
    getItem(key) {
      return key in state ? state[key] : null
    },
    setItem(key, value) {
      state[key] = value
    },
  }
}

describe('createQuoteNumber', () => {
  it('increments a year-specific counter from the configured starting number', () => {
    const storage = createStorage()
    const now = new Date('2026-04-23T09:00:00.000Z')

    const quoteNumber = createQuoteNumber({ storage, now, settings })

    expect(quoteNumber).toBe(
      `${settings.quote.quotePrefix}-2026-${String(settings.quote.startingNumber).padStart(4, '0')}`,
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/composables/quoteNumbers.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/quoteNumbers'`

- [ ] **Step 3: Implement the helper and update imports**

```js
// src/composables/quoteNumbers.js
export function createQuoteNumber({ storage = localStorage, now = new Date(), settings }) {
  const year = now.getFullYear()
  const key = `quote_counter_${year}`
  const current = Number(storage.getItem(key) || settings.quote.startingNumber - 1)
  const next = current + 1

  storage.setItem(key, String(next))
  return `${settings.quote.quotePrefix}-${year}-${String(next).padStart(4, '0')}`
}
```

```js
// excerpt for src/composables/useQuote.js
export function dateAfterDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
```

```js
// excerpt for src/stores/quoteStore.js
import { createQuoteNumber } from '../composables/quoteNumbers'

function ensureQuoteNumber() {
  if (!state.meta.quoteNumber) {
    state.meta.quoteNumber = createQuoteNumber({ settings })
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/composables/quoteNumbers.test.js`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/quoteNumbers.test.js src/composables/quoteNumbers.js src/composables/useQuote.js src/stores/quoteStore.js
git commit -m "refactor: isolate quote number generation"
```

### Task 4: Extract pure PDF summary builders so PDF behavior can be verified without rendering pages

**Files:**
- Create: `tests/composables/quotePdfData.test.js`
- Create: `src/composables/quotePdfData.js`
- Modify: `src/composables/usePDF.js:104-186`

- [ ] **Step 1: Write the failing tests for item rows and totals rows**

```js
// tests/composables/quotePdfData.test.js
import { describe, expect, it } from 'vitest'
import settings from '../../src/data/settings.json'
import { buildPdfBodyRows, buildPdfTotalsRows } from '../../src/composables/quotePdfData'

describe('quotePdfData', () => {
  it('builds service and option body rows', () => {
    const rows = buildPdfBodyRows([
      {
        service: { name: 'Audit', unit: 'hour', description: 'Diagnostic' },
        quantity: 2,
        unitPrice: 100,
        serviceTotal: 200,
        options: [{ name: 'Support', extraPrice: 50 }],
      },
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0][0]).toBe('Audit')
    expect(rows[1][0]).toContain('+')
  })

  it('builds totals rows with discount and vat labels', () => {
    const rows = buildPdfTotalsRows({
      quoteState: { global: { discountPercent: 10 } },
      totals: {
        servicesSubtotal: 200,
        travelFees: 10,
        urgencyFees: 20,
        discountAmount: 23,
        vatAmount: 16,
      },
      settings,
    })

    expect(rows.some(([label]) => label.startsWith('Remise'))).toBe(true)
    expect(rows.some(([label]) => label.startsWith('TVA'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- tests/composables/quotePdfData.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/quotePdfData'`

- [ ] **Step 3: Implement the pure builders and plug them into jsPDF**

```js
// src/composables/quotePdfData.js
import { formatMoney } from './useQuote'

function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

export function buildPdfBodyRows(rows) {
  const body = []
  rows.forEach((row) => {
    body.push([
      row.service.name,
      row.service.unit === 'hour' ? 'Prestation horaire' : row.service.description,
      row.quantity,
      formatMoney(row.unitPrice),
      formatMoney(row.serviceTotal),
    ])
    row.options.forEach((option) => {
      body.push(['  + ' + option.name, 'Option', 1, formatMoney(option.extraPrice), formatMoney(option.extraPrice)])
    })
  })
  return body
}

export function buildPdfTotalsRows({ quoteState, totals, settings }) {
  return [
    ['Sous-total', formatMoney(valueOf(totals.servicesSubtotal))],
    valueOf(totals.travelFees) > 0 && ['Déplacement', formatMoney(valueOf(totals.travelFees))],
    valueOf(totals.urgencyFees) > 0 && ['Urgence', formatMoney(valueOf(totals.urgencyFees))],
    valueOf(totals.discountAmount) > 0 && [
      `Remise (-${quoteState.global.discountPercent}%)`,
      `-${formatMoney(valueOf(totals.discountAmount))}`,
    ],
    settings.vat.enabled
      ? [`TVA ${settings.vat.rate}%`, formatMoney(valueOf(totals.vatAmount))]
      : [settings.vat.exemptionText, ''],
  ].filter(Boolean)
}
```

```js
// excerpt for src/composables/usePDF.js
import { buildPdfBodyRows, buildPdfTotalsRows } from './quotePdfData'

const body = buildPdfBodyRows(valueOf(quote.totals.rows))
const totalRows = buildPdfTotalsRows({
  quoteState: quote.state,
  totals: quote.totals,
  settings,
})
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- tests/composables/quotePdfData.test.js`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/quotePdfData.test.js src/composables/quotePdfData.js src/composables/usePDF.js
git commit -m "refactor: extract quote pdf data builders"
```

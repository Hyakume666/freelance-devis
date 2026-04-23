# Frontend Structure and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the main bundle, split `QuoteForm.vue` responsibilities, and keep the current UI behavior intact.

**Architecture:** Move wizard state and action orchestration into dedicated composables so `QuoteForm.vue` becomes mostly a rendering shell. Load heavy email/PDF modules and route views lazily so they stop inflating the initial application chunk.

**Tech Stack:** Vue 3, Vue Router 4, Vite, @vueuse/motion, Vitest

---

### Task 1: Extract step navigation and validation into a dedicated wizard composable

**Files:**
- Create: `tests/composables/useQuoteWizard.test.js`
- Create: `src/composables/useQuoteWizard.js`
- Modify: `src/components/QuoteForm.vue:1-186`

- [ ] **Step 1: Write the failing wizard behavior tests**

```js
// tests/composables/useQuoteWizard.test.js
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { useQuoteWizard } from '../../src/composables/useQuoteWizard'

describe('useQuoteWizard', () => {
  it('blocks forward navigation when no service is selected on step 0', () => {
    const store = {
      selectedCount: 0,
      state: reactive({
        client: { firstName: '', lastName: '', email: '' },
      }),
      ensureQuoteNumber() {},
    }

    const wizard = useQuoteWizard(store)
    expect(wizard.canGoNext.value).toBe(false)
  })

  it('advances to the summary step after valid client data', () => {
    const store = {
      selectedCount: 1,
      state: reactive({
        client: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      }),
      ensureQuoteNumber() {},
    }

    const wizard = useQuoteWizard(store)
    wizard.goToStep(0)
    wizard.next()
    wizard.next()
    wizard.next()

    expect(wizard.currentStep.value).toBe(3)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/composables/useQuoteWizard.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/useQuoteWizard'`

- [ ] **Step 3: Implement the composable and trim QuoteForm.vue**

```js
// src/composables/useQuoteWizard.js
import { computed, ref } from 'vue'
import StepClient from '../components/steps/StepClient.vue'
import StepParams from '../components/steps/StepParams.vue'
import StepService from '../components/steps/StepService.vue'
import StepSummary from '../components/steps/StepSummary.vue'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useQuoteWizard(store) {
  const currentStep = ref(0)
  const direction = ref(1)
  const steps = [
    { label: 'Prestations', component: StepService },
    { label: 'Paramètres', component: StepParams },
    { label: 'Client', component: StepClient },
    { label: 'Récapitulatif', component: StepSummary },
  ]

  const activeComponent = computed(() => steps[currentStep.value].component)
  const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100)
  const canGoNext = computed(() => {
    if (currentStep.value === 0) return store.selectedCount > 0
    if (currentStep.value === 1) return true
    if (currentStep.value === 2) {
      const client = store.state.client
      return Boolean(client.firstName.trim() && client.lastName.trim() && emailRegex.test(client.email))
    }
    return true
  })

  function goToStep(index) {
    if (index > currentStep.value) return
    direction.value = index > currentStep.value ? 1 : -1
    currentStep.value = index
  }

  function next() {
    if (!canGoNext.value) return
    direction.value = 1
    if (currentStep.value === 2) store.ensureQuoteNumber()
    currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
  }

  function back() {
    direction.value = -1
    currentStep.value = Math.max(currentStep.value - 1, 0)
  }

  return {
    steps,
    currentStep,
    direction,
    activeComponent,
    progress,
    canGoNext,
    goToStep,
    next,
    back,
  }
}
```

```vue
<!-- excerpt for src/components/QuoteForm.vue -->
<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { useQuoteStore } from '../stores/quoteStore'
import { useQuoteWizard } from '../composables/useQuoteWizard'
import { useQuoteActions } from '../composables/useQuoteActions'
import { formatMoney } from '../composables/useQuote'
import AppButton from './ui/AppButton.vue'
import QuotePreview from './QuotePreview.vue'

const store = useQuoteStore()
const router = useRouter()
const wizard = useQuoteWizard(store)
const actions = useQuoteActions({ store, router })
</script>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- tests/composables/useQuoteWizard.test.js`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/useQuoteWizard.test.js src/composables/useQuoteWizard.js src/components/QuoteForm.vue
git commit -m "refactor: extract quote wizard logic"
```

### Task 2: Extract quote actions and lazy-load the heavy email/PDF modules

**Files:**
- Create: `tests/composables/useQuoteActions.test.js`
- Create: `src/composables/useQuoteActions.js`
- Modify: `src/components/QuoteForm.vue:1-186`

- [ ] **Step 1: Write the failing action tests**

```js
// tests/composables/useQuoteActions.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuoteActions } from '../../src/composables/useQuoteActions'

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn() }),
}))

vi.mock('../../src/composables/usePDF', () => ({
  generateQuotePdf: vi.fn(() => ({ base64: 'pdf', fileName: 'DEVIS.pdf' })),
}))

vi.mock('../../src/composables/useEmail', () => ({
  useEmail: () => ({
    sendQuoteEmail: async () => ({ pdf: { base64: 'pdf' }, messageId: '123' }),
  }),
}))

describe('useQuoteActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('downloads a pdf and stores a draft', async () => {
    const store = {
      state: {},
      totals: {},
      ensureQuoteNumber: vi.fn(),
      saveHistory: vi.fn(),
      reset: vi.fn(),
    }

    const router = { push: vi.fn() }
    const actions = useQuoteActions({ store, router })

    await actions.downloadPdf()
    expect(store.saveHistory).toHaveBeenCalledWith('Brouillon', 'pdf')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/composables/useQuoteActions.test.js`

Expected: FAIL with `Cannot find module '../../src/composables/useQuoteActions'`

- [ ] **Step 3: Implement the composable with dynamic imports**

```js
// src/composables/useQuoteActions.js
import { ref } from 'vue'
import { useToast } from './useToast'

export function useQuoteActions({ store, router }) {
  const toast = useToast()
  const sending = ref(false)

  async function downloadPdf() {
    store.ensureQuoteNumber()
    const { generateQuotePdf } = await import('./usePDF')
    const pdf = generateQuotePdf({ state: store.state, totals: store.totals }, { download: true })
    store.saveHistory('Brouillon', pdf.base64)
    toast.push({ type: 'success', title: 'PDF généré', message: 'Le devis a été téléchargé.' })
  }

  async function sendEmail() {
    sending.value = true
    try {
      store.ensureQuoteNumber()
      const { useEmail } = await import('./useEmail')
      const { sendQuoteEmail } = useEmail({ state: store.state, totals: store.totals })
      const result = await sendQuoteEmail()
      store.saveHistory('Envoyé', result.pdf.base64)
      toast.push({
        type: 'success',
        title: 'Devis accepté par Brevo',
        message: result.messageId
          ? `Message en file transactionnelle. ID Brevo: ${result.messageId}`
          : "Message accepté par l'API transactionnelle.",
        duration: 7000,
      })
      router.push('/success')
    } catch (error) {
      toast.push({
        type: 'error',
        title: "Échec de l'envoi",
        message: error.message || 'Vérifiez votre connexion puis réessayez.',
        duration: 6000,
      })
    } finally {
      sending.value = false
    }
  }

  function resetQuote() {
    store.reset()
    toast.push({ type: 'info', title: 'Nouveau devis prêt' })
  }

  return {
    sending,
    downloadPdf,
    sendEmail,
    resetQuote,
  }
}
```

```vue
<!-- excerpt for src/components/QuoteForm.vue -->
<component
  :is="wizard.activeComponent"
  :key="wizard.currentStep"
  :sending="actions.sending"
  @download="actions.downloadPdf"
  @send="actions.sendEmail"
  @reset="actions.resetQuote"
/>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/composables/useQuoteActions.test.js`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/composables/useQuoteActions.test.js src/composables/useQuoteActions.js src/components/QuoteForm.vue
git commit -m "perf: lazy load quote actions"
```

### Task 3: Split route views lazily and verify the build no longer emits the large main chunk warning

**Files:**
- Create: `tests/router/routes.test.js`
- Modify: `src/router/index.js:1-18`

- [ ] **Step 1: Write the failing route-loading test**

```js
// tests/router/routes.test.js
import { describe, expect, it } from 'vitest'
import router from '../../src/router'

describe('router', () => {
  it('loads page components lazily outside the shell', () => {
    const quoteRoute = router.getRoutes().find((route) => route.name === 'quote')
    expect(typeof quoteRoute.components.default).toBe('function')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/router/routes.test.js`

Expected: FAIL because the route currently imports views eagerly

- [ ] **Step 3: Convert routes to lazy imports**

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('../views/HomeView.vue')
const HistoryView = () => import('../views/HistoryView.vue')
const QuoteView = () => import('../views/QuoteView.vue')
const SuccessView = () => import('../views/SuccessView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/devis', name: 'quote', component: QuoteView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/success', name: 'success', component: SuccessView },
  ],
})

export default router
```

- [ ] **Step 4: Run the tests and the production build**

Run: `npm run test -- tests/router/routes.test.js`

Expected: PASS with `1 passed`

Run: `npm run build`

Expected: PASS and the previous `Some chunks are larger than 500 kB` warning is gone

- [ ] **Step 5: Commit**

```bash
git add tests/router/routes.test.js src/router/index.js
git commit -m "perf: lazy load route views"
```

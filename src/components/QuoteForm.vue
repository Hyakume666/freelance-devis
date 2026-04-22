<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { useQuoteStore } from '../stores/quoteStore'
import { generateQuotePdf } from '../composables/usePDF'
import { useEmail } from '../composables/useEmail'
import { useToast } from '../composables/useToast'
import { formatMoney } from '../composables/useQuote'
import AppButton from './ui/AppButton.vue'
import QuotePreview from './QuotePreview.vue'
import StepClient from './steps/StepClient.vue'
import StepParams from './steps/StepParams.vue'
import StepService from './steps/StepService.vue'
import StepSummary from './steps/StepSummary.vue'

const store = useQuoteStore()
const router = useRouter()
const toast = useToast()
const currentStep = ref(0)
const direction = ref(1)
const sending = ref(false)

const steps = [
  { label: 'Prestations', component: StepService },
  { label: 'Paramètres', component: StepParams },
  { label: 'Client', component: StepClient },
  { label: 'Récapitulatif', component: StepSummary },
]

const activeComponent = computed(() => steps[currentStep.value].component)
const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

function downloadPdf() {
  store.ensureQuoteNumber()
  const pdf = generateQuotePdf({ state: store.state, totals: store.totals }, { download: true })
  store.saveHistory('Brouillon', pdf.base64)
  toast.push({ type: 'success', title: 'PDF généré', message: 'Le devis a été téléchargé.' })
}

async function sendEmail() {
  sending.value = true
  try {
    store.ensureQuoteNumber()
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
  direction.value = -1
  currentStep.value = 0
  toast.push({ type: 'info', title: 'Nouveau devis prêt' })
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <section class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/20 sm:p-6">
      <header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Étape {{ currentStep + 1 }} sur {{ steps.length }}</p>
            <h1 class="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{{ steps[currentStep].label }}</h1>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(step, index) in steps"
              :key="step.label"
              type="button"
              class="cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              :class="[
                index === currentStep
                  ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                  : 'border-slate-300 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300',
                index > currentStep ? 'cursor-not-allowed opacity-50' : 'hover:border-emerald-500',
              ]"
              :disabled="index > currentStep"
              @click="goToStep(index)"
            >
              {{ index + 1 }}. {{ step.label }}
            </button>
          </div>
        </div>

        <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            v-motion
            :initial="{ width: '0%' }"
            :enter="{ width: `${progress}%`, transition: { type: 'spring', stiffness: 180, damping: 24 } }"
            :style="{ width: `${progress}%` }"
            class="h-full rounded-full bg-emerald-400"
          ></div>
        </div>
      </header>

      <div class="mt-6 min-h-[30rem] overflow-hidden">
        <component
          :is="activeComponent"
          :key="currentStep"
          v-motion
          :initial="{ opacity: 0, x: direction > 0 ? 42 : -42 }"
          :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } }"
          :leave="{ opacity: 0, x: direction > 0 ? -42 : 42 }"
          :sending="sending"
          @download="downloadPdf"
          @send="sendEmail"
          @reset="resetQuote"
        />
      </div>

      <footer v-if="currentStep < steps.length - 1" class="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        <AppButton variant="ghost" :disabled="currentStep === 0" @click="back">
          <template #icon><ArrowLeft class="h-4 w-4" aria-hidden="true" /></template>
          Retour
        </AppButton>
        <AppButton :disabled="!canGoNext" @click="next">
          Suivant
          <template #icon><ArrowRight class="h-4 w-4" aria-hidden="true" /></template>
        </AppButton>
      </footer>
    </section>

    <div class="hidden lg:sticky lg:top-24 lg:block lg:self-start">
      <QuotePreview />
    </div>

    <div class="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div class="rounded-xl border border-white/15 bg-slate-950/90 p-3 text-white shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm">{{ store.selectedCount }} prestation(s)</span>
          <span class="text-lg font-bold">{{ formatMoney(store.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

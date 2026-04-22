<script setup>
import { CalendarDays, Download, RotateCcw, Send } from 'lucide-vue-next'
import { useQuoteStore } from '../../stores/quoteStore'
import { formatDate, formatMoney } from '../../composables/useQuote'
import settings from '../../data/settings.json'
import AppBadge from '../ui/AppBadge.vue'
import AppButton from '../ui/AppButton.vue'
import AppInput from '../ui/AppInput.vue'

defineProps({
  sending: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['download', 'send', 'reset'])
const store = useQuoteStore()
</script>

<template>
  <section class="space-y-5">
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <div class="min-w-[720px]">
        <div class="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-400">
          <span class="col-span-5">Prestation</span>
          <span class="col-span-3">Détail</span>
          <span class="col-span-1 text-right">Qté</span>
          <span class="col-span-1 text-right">PU</span>
          <span class="col-span-2 text-right">Total</span>
        </div>
        <div v-for="row in store.rows" :key="row.service.id" class="border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-white/10">
          <div class="grid grid-cols-12 gap-3 text-sm">
            <span class="col-span-5 font-semibold text-slate-950 dark:text-white">{{ row.service.name }}</span>
            <span class="col-span-3 text-slate-600 dark:text-slate-400">{{ row.service.unit === 'hour' ? 'Horaire' : 'Forfait' }}</span>
            <span class="col-span-1 text-right">{{ row.quantity }}</span>
            <span class="col-span-1 text-right">{{ formatMoney(row.unitPrice) }}</span>
            <span class="col-span-2 text-right font-semibold">{{ formatMoney(row.serviceTotal) }}</span>
          </div>
          <div v-for="option in row.options" :key="option.id" class="mt-2 grid grid-cols-12 gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span class="col-span-5 pl-4">+ {{ option.name }}</span>
            <span class="col-span-3">Option</span>
            <span class="col-span-1 text-right">1</span>
            <span class="col-span-1 text-right">{{ formatMoney(option.extraPrice) }}</span>
            <span class="col-span-2 text-right">{{ formatMoney(option.extraPrice) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <div class="rounded-xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <h3 class="font-semibold text-slate-950 dark:text-white">Métadonnées</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/35">
            <p class="text-xs text-slate-600 dark:text-slate-400">N° de devis</p>
            <p class="mt-1 font-mono font-semibold text-slate-950 dark:text-white">{{ store.state.meta.quoteNumber }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/35">
            <p class="text-xs text-slate-600 dark:text-slate-400">Date d'émission</p>
            <p class="mt-1 inline-flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
              <CalendarDays class="h-4 w-4" aria-hidden="true" /> {{ formatDate(store.state.meta.issueDate) }}
            </p>
          </div>
          <AppInput v-model="store.state.meta.validUntil" label="Valable jusqu'au" type="date" />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <h3 class="font-semibold text-slate-950 dark:text-white">Total</h3>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between"><dt>Sous-total</dt><dd>{{ formatMoney(store.servicesSubtotal) }}</dd></div>
          <div v-if="store.travelFees" class="flex justify-between"><dt>Frais de déplacement</dt><dd>{{ formatMoney(store.travelFees) }}</dd></div>
          <div v-if="store.urgencyFees" class="flex justify-between"><dt>Supplément urgence</dt><dd>{{ formatMoney(store.urgencyFees) }}</dd></div>
          <div v-if="store.discountAmount" class="flex justify-between text-red-700 dark:text-red-300"><dt>Remise</dt><dd>-{{ formatMoney(store.discountAmount) }}</dd></div>
          <div v-if="settings.vat.enabled" class="flex justify-between"><dt>TVA {{ settings.vat.rate }}%</dt><dd>{{ formatMoney(store.vatAmount) }}</dd></div>
          <div v-else class="pt-1"><AppBadge variant="neutral">{{ settings.vat.exemptionText }}</AppBadge></div>
        </dl>
        <div class="mt-4 rounded-lg bg-emerald-400 p-4 text-slate-950">
          <p class="text-sm font-semibold">TOTAL TTC</p>
          <p class="mt-1 text-3xl font-bold">{{ formatMoney(store.total) }}</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap justify-end gap-3">
      <AppButton variant="ghost" @click="emit('reset')">
        <template #icon><RotateCcw class="h-4 w-4" aria-hidden="true" /></template>
        Nouveau devis
      </AppButton>
      <AppButton variant="secondary" @click="emit('download')">
        <template #icon><Download class="h-4 w-4" aria-hidden="true" /></template>
        Télécharger PDF
      </AppButton>
      <AppButton :loading="sending" @click="emit('send')">
        <template #icon><Send class="h-4 w-4" aria-hidden="true" /></template>
        Envoyer par email
      </AppButton>
    </div>
  </section>
</template>

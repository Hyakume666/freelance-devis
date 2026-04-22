<script setup>
import { computed } from 'vue'
import { Clock, ReceiptText, Route, Zap } from 'lucide-vue-next'
import { useQuoteStore } from '../stores/quoteStore'
import { formatMoney } from '../composables/useQuote'
import AppBadge from './ui/AppBadge.vue'

const store = useQuoteStore()
const selectedRows = computed(() => store.rows)
</script>

<template>
  <aside class="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/20">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-slate-950 dark:text-white">Aperçu en direct</p>
        <p class="text-xs text-slate-600 dark:text-slate-400">{{ store.selectedCount }} prestation(s)</p>
      </div>
      <ReceiptText class="h-5 w-5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
    </div>

    <div v-if="selectedRows.length" class="mt-4 space-y-3">
      <div v-for="row in selectedRows" :key="row.service.id" class="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/35">
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ row.service.name }}</p>
          <p class="shrink-0 text-sm font-semibold text-slate-950 dark:text-white">{{ formatMoney(row.lineTotal) }}</p>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <AppBadge variant="neutral">
            <Clock class="mr-1 h-3 w-3" aria-hidden="true" />
            {{ row.service.estimatedDuration }}h
          </AppBadge>
          <AppBadge v-if="row.options.length" variant="info">{{ row.options.length }} option(s)</AppBadge>
        </div>
      </div>
    </div>
    <p v-else class="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-400">
      Sélectionnez une prestation pour voir le total évoluer.
    </p>

    <div class="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
      <div class="flex justify-between text-slate-600 dark:text-slate-300">
        <span>Sous-total</span>
        <span>{{ formatMoney(store.servicesSubtotal) }}</span>
      </div>
      <div v-if="store.travelFees" class="flex justify-between text-slate-600 dark:text-slate-300">
        <span class="inline-flex items-center gap-1"><Route class="h-3.5 w-3.5" />Déplacement</span>
        <span>{{ formatMoney(store.travelFees) }}</span>
      </div>
      <div v-if="store.urgencyFees" class="flex justify-between text-amber-700 dark:text-amber-200">
        <span class="inline-flex items-center gap-1"><Zap class="h-3.5 w-3.5" />Urgence</span>
        <span>{{ formatMoney(store.urgencyFees) }}</span>
      </div>
      <div v-if="store.discountAmount" class="flex justify-between text-red-700 dark:text-red-300">
        <span>Remise</span>
        <span>-{{ formatMoney(store.discountAmount) }}</span>
      </div>
      <div class="flex items-end justify-between pt-2">
        <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Total TTC</span>
        <span class="text-2xl font-bold text-slate-950 dark:text-white">{{ formatMoney(store.total) }}</span>
      </div>
    </div>
  </aside>
</template>

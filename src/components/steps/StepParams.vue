<script setup>
import { computed } from 'vue'
import { ChevronDown, Minus, Plus, Route, Sparkles, UserRoundCheck } from 'lucide-vue-next'
import { useQuoteStore } from '../../stores/quoteStore'
import { formatMoney } from '../../composables/useQuote'
import settings from '../../data/settings.json'
import AppBadge from '../ui/AppBadge.vue'
import AppInput from '../ui/AppInput.vue'
import AppSlider from '../ui/AppSlider.vue'

const store = useQuoteStore()
const rows = computed(() => store.rows)

function setExistingClient(value) {
  store.state.global.existingClient = value
  store.state.client.existingClient = value
}
</script>

<template>
  <section class="space-y-4">
    <details
      v-for="row in rows"
      :key="row.service.id"
      open
      class="group rounded-xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
    >
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-950 dark:text-white">{{ row.service.name }}</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ formatMoney(row.lineTotal) }}</p>
        </div>
        <ChevronDown class="h-5 w-5 text-slate-500 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div class="mt-4 space-y-4">
        <div v-if="row.service.options.length">
          <p class="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Options</p>
          <div class="grid gap-2 md:grid-cols-2">
            <label
              v-for="option in row.service.options"
              :key="option.id"
              class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 transition-colors duration-200 hover:border-emerald-500 dark:border-white/10 dark:bg-slate-950/35"
            >
              <span class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-500"
                  :checked="store.state.serviceDetails[row.service.id]?.optionIds.includes(option.id)"
                  @change="store.toggleOption(row.service.id, option.id)"
                />
                <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ option.name }}</span>
              </span>
              <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">+{{ formatMoney(option.extraPrice) }}</span>
            </label>
          </div>
        </div>

        <div v-if="row.service.unit === 'hour'" class="max-w-sm">
          <p class="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Quantité d'heures</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-white transition-colors duration-200 hover:border-emerald-500 dark:border-white/10 dark:bg-white/10"
              aria-label="Réduire la quantité"
              @click="store.setQuantity(row.service.id, row.quantity - 0.5)"
            >
              <Minus class="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              :value="row.quantity"
              type="number"
              min="0.5"
              step="0.5"
              class="h-10 w-24 rounded-lg border border-slate-300 bg-white px-3 text-center text-sm font-semibold outline-none transition-colors duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/10"
              @input="store.setQuantity(row.service.id, Number($event.target.value))"
            />
            <button
              type="button"
              class="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-white transition-colors duration-200 hover:border-emerald-500 dark:border-white/10 dark:bg-white/10"
              aria-label="Augmenter la quantité"
              @click="store.setQuantity(row.service.id, row.quantity + 0.5)"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </details>

    <section class="rounded-xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <h3 class="font-semibold text-slate-950 dark:text-white">Options globales</h3>
      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/35">
          <label class="flex cursor-pointer items-start gap-3">
            <input v-model="store.state.global.travelEnabled" type="checkbox" class="mt-1 h-4 w-4 cursor-pointer accent-emerald-500" />
            <span>
              <span class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Route class="h-4 w-4" aria-hidden="true" /> Frais de déplacement
              </span>
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ formatMoney(settings.quote.travelRatePerKm) }}/km</span>
            </span>
          </label>
          <AppInput
            v-if="store.state.global.travelEnabled"
            v-model.number="store.state.global.distanceKm"
            class="mt-3"
            label="Distance aller-retour (km)"
            type="number"
          />
          <AppBadge v-if="store.state.global.travelEnabled" class="mt-3" variant="info">
            Total déplacement: {{ formatMoney(store.travelFees) }}
          </AppBadge>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/35">
          <label class="flex cursor-pointer items-start gap-3">
            <input v-model="store.state.global.urgency" type="checkbox" class="mt-1 h-4 w-4 cursor-pointer accent-emerald-500" />
            <span>
              <span class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Sparkles class="h-4 w-4" aria-hidden="true" /> Supplément urgence
              </span>
              <span class="text-sm text-slate-600 dark:text-slate-400">Priorisation et délai raccourci.</span>
            </span>
          </label>
          <AppBadge v-if="store.state.global.urgency" class="mt-3" variant="warning">
            +{{ settings.quote.urgencySurchargePercent }}% sur toutes les prestations
          </AppBadge>
        </div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_8rem]">
        <AppSlider
          v-model="store.state.global.discountPercent"
          label="Remise"
          :max="settings.quote.maxDiscountPercent"
        />
        <AppInput v-model.number="store.state.global.discountPercent" label="Pourcentage" type="number" />
      </div>
      <label class="mt-4 block text-left">
        <span class="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">Motif de la remise</span>
        <textarea
          v-model="store.state.global.discountReason"
          rows="3"
          class="w-full resize-y rounded-lg border border-slate-300 bg-white/85 px-3 py-2.5 text-sm text-slate-950 outline-none transition-colors duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-white/10 dark:text-white"
        ></textarea>
      </label>

      <label class="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 transition-colors duration-200 hover:border-emerald-500 dark:border-white/10 dark:bg-slate-950/35">
        <input
          :checked="store.state.global.existingClient"
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-emerald-500"
          @change="setExistingClient($event.target.checked)"
        />
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <UserRoundCheck class="h-4 w-4" aria-hidden="true" />
          Client existant
        </span>
        <AppBadge v-if="store.state.global.existingClient" variant="success">Badge fidélité sur PDF</AppBadge>
      </label>
    </section>
  </section>
</template>

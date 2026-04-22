<script setup>
import { computed, ref } from 'vue'
import { Check, Clock, Cpu, Globe2, Package, SearchX, Tag, Wrench } from 'lucide-vue-next'
import services from '../../data/services.json'
import { useQuoteStore } from '../../stores/quoteStore'
import { formatMoney } from '../../composables/useQuote'
import AppBadge from '../ui/AppBadge.vue'

const store = useQuoteStore()
const activeCategory = ref('all')

const tabs = [
  { value: 'all', label: 'Tous' },
  { value: 'web', label: 'Web' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'pc_assembly', label: 'Montage PC' },
  { value: 'other', label: 'Autre' },
]

const icons = {
  web: Globe2,
  it_support: Wrench,
  pc_assembly: Cpu,
  other: Package,
}

const filteredServices = computed(() =>
  activeCategory.value === 'all'
    ? services
    : services.filter((service) => service.category === activeCategory.value),
)
</script>

<template>
  <section>
    <div class="mb-5 overflow-x-auto">
      <div class="relative inline-flex min-w-full gap-2 rounded-xl border border-slate-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/10">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="relative min-h-10 cursor-pointer whitespace-nowrap rounded-lg px-4 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:text-slate-300 dark:hover:text-white"
          :class="{ 'text-emerald-700 dark:text-emerald-200': activeCategory === tab.value }"
          @click="activeCategory = tab.value"
        >
          {{ tab.label }}
          <span
            v-if="activeCategory === tab.value"
            v-motion
            :initial="{ opacity: 0, scaleX: 0.7 }"
            :enter="{ opacity: 1, scaleX: 1 }"
            class="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-emerald-500"
          ></span>
        </button>
      </div>
    </div>

    <div v-if="filteredServices.length" class="grid gap-4 md:grid-cols-2">
      <button
        v-for="(service, index) in filteredServices"
        :key="service.id"
        v-motion
        :initial="{ opacity: 0, y: 18 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: index * 80, type: 'spring', stiffness: 250, damping: 24 } }"
        type="button"
        class="group relative cursor-pointer rounded-xl border bg-white/85 p-4 text-left shadow-lg shadow-slate-950/5 backdrop-blur-xl transition-colors duration-200 hover:border-emerald-500 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:bg-white/10 dark:shadow-black/20 dark:hover:bg-white/15"
        :class="store.state.selectedServiceIds.includes(service.id) ? 'border-emerald-500 ring-2 ring-emerald-500/25' : 'border-slate-200 dark:border-white/10'"
        @click="store.toggleService(service.id)"
      >
        <span
          v-if="store.state.selectedServiceIds.includes(service.id)"
          v-motion
          :initial="{ scale: 0, opacity: 0 }"
          :enter="{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 360, damping: 18 } }"
          class="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-400 text-slate-950"
        >
          <Check class="h-4 w-4" aria-hidden="true" />
        </span>

        <div class="flex gap-3 pr-8">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-slate-800 dark:border-white/10 dark:bg-slate-950/45 dark:text-emerald-300">
            <component :is="icons[service.category] || Package" class="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 class="font-semibold text-slate-950 dark:text-white">{{ service.name }}</h3>
            <p class="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{{ service.description }}</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppBadge variant="success">
            <Tag class="mr-1 h-3 w-3" aria-hidden="true" />
            {{ formatMoney(service.basePrice) }}{{ service.unit === 'hour' ? '/h' : '' }}
          </AppBadge>
          <AppBadge variant="neutral">
            <Clock class="mr-1 h-3 w-3" aria-hidden="true" />
            {{ service.estimatedDuration }}h estimées
          </AppBadge>
        </div>
      </button>
    </div>

    <div v-else class="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15">
      <SearchX class="mx-auto h-9 w-9 text-slate-500" aria-hidden="true" />
      <p class="mt-3 font-semibold text-slate-900 dark:text-white">Aucune prestation disponible</p>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Essayez une autre catégorie.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Download, FileClock, FileText, Plus, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import AppBadge from '../components/ui/AppBadge.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppModal from '../components/ui/AppModal.vue'
import { formatDate, formatMoney } from '../composables/useQuote'
import { useToast } from '../composables/useToast'

const toast = useToast()
const history = ref(JSON.parse(localStorage.getItem('quote_history') || '[]'))
const pendingDelete = ref(null)

const statusVariants = {
  Envoyé: 'success',
  Brouillon: 'neutral',
  Accepté: 'info',
  Refusé: 'error',
}

const rows = computed(() => history.value)

function persist() {
  localStorage.setItem('quote_history', JSON.stringify(history.value))
}

function download(entry) {
  if (!entry.pdfData) {
    toast.push({ type: 'warning', title: 'PDF indisponible', message: 'Ce devis ne contient pas de fichier enregistré.' })
    return
  }
  const link = document.createElement('a')
  link.href = `data:application/pdf;base64,${entry.pdfData}`
  link.download = `${entry.quoteNumber}.pdf`
  link.click()
}

function updateStatus(entry, status) {
  entry.status = status
  persist()
  toast.push({ type: 'success', title: 'Statut mis à jour' })
}

function confirmDelete() {
  if (!pendingDelete.value) return
  history.value = history.value.filter((entry) => entry.id !== pendingDelete.value.id)
  persist()
  pendingDelete.value = null
  toast.push({ type: 'info', title: 'Devis supprimé' })
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Suivi local</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Historique des devis</h1>
      </div>
      <RouterLink to="/devis" class="cursor-pointer">
        <AppButton>
          <template #icon><Plus class="h-4 w-4" aria-hidden="true" /></template>
          Créer
        </AppButton>
      </RouterLink>
    </header>

    <div v-if="rows.length" class="overflow-hidden rounded-xl border border-slate-200 bg-white/85 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-100/80 text-xs uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-400">
            <tr>
              <th class="px-4 py-3">N° Devis</th>
              <th class="px-4 py-3">Client</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in rows" :key="entry.id" class="border-b border-slate-200 last:border-b-0 dark:border-white/10">
              <td class="px-4 py-3 font-mono font-semibold text-slate-950 dark:text-white">{{ entry.quoteNumber }}</td>
              <td class="px-4 py-3">
                <span class="block font-semibold text-slate-900 dark:text-white">{{ entry.clientName || 'Client sans nom' }}</span>
                <span class="text-slate-600 dark:text-slate-400">{{ entry.clientEmail }}</span>
              </td>
              <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ formatDate(entry.date) }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ formatMoney(entry.total) }}</td>
              <td class="px-4 py-3">
                <select
                  :value="entry.status"
                  class="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-slate-900"
                  @change="updateStatus(entry, $event.target.value)"
                >
                  <option>Brouillon</option>
                  <option>Envoyé</option>
                  <option>Accepté</option>
                  <option>Refusé</option>
                </select>
                <AppBadge class="ml-2" :variant="statusVariants[entry.status]">{{ entry.status }}</AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    class="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-300 transition-colors duration-200 hover:border-emerald-500 dark:border-white/10"
                    aria-label="Re-télécharger PDF"
                    @click="download(entry)"
                  >
                    <Download class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-red-300 text-red-700 transition-colors duration-200 hover:bg-red-500/10 dark:border-red-400/30 dark:text-red-300"
                    aria-label="Supprimer"
                    @click="pendingDelete = entry"
                  >
                    <Trash2 class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
      <FileClock class="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
      <h2 class="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Aucun devis enregistré</h2>
      <p class="mt-2 text-slate-600 dark:text-slate-400">Votre historique affichera les devis générés ou envoyés.</p>
      <RouterLink to="/devis" class="mt-6 inline-flex cursor-pointer">
        <AppButton>
          <template #icon><FileText class="h-4 w-4" /></template>
          Créer le premier devis
        </AppButton>
      </RouterLink>
    </div>

    <AppModal :model-value="Boolean(pendingDelete)" title="Supprimer ce devis" @update:model-value="pendingDelete = null">
      <p class="text-slate-700 dark:text-slate-300">
        Cette action retire le devis de l'historique local de ce navigateur.
      </p>
      <div class="mt-5 flex justify-end gap-3">
        <AppButton variant="ghost" @click="pendingDelete = null">Annuler</AppButton>
        <AppButton variant="danger" @click="confirmDelete">
          <template #icon><Trash2 class="h-4 w-4" /></template>
          Supprimer
        </AppButton>
      </div>
    </AppModal>
  </section>
</template>

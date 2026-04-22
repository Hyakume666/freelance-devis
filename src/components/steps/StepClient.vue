<script setup>
import { reactive } from 'vue'
import { useQuoteStore } from '../../stores/quoteStore'
import AppInput from '../ui/AppInput.vue'

const store = useQuoteStore()
const touched = reactive({})
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorFor(field) {
  if (!touched[field]) return ''
  const value = store.state.client[field]?.trim?.() || ''
  if (['firstName', 'lastName', 'email'].includes(field) && !value) return 'Ce champ est requis.'
  if (field === 'email' && value && !emailRegex.test(value)) return 'Adresse email invalide.'
  return ''
}

function blur(field) {
  touched[field] = true
}
</script>

<template>
  <section class="space-y-5">
    <div class="grid gap-4 md:grid-cols-2">
      <AppInput v-model="store.state.client.firstName" label="Prénom" required :error="errorFor('firstName')" @blur="blur('firstName')" />
      <AppInput v-model="store.state.client.lastName" label="Nom" required :error="errorFor('lastName')" @blur="blur('lastName')" />
      <AppInput v-model="store.state.client.company" label="Entreprise" />
      <AppInput v-model="store.state.client.email" label="Email" type="email" required :error="errorFor('email')" @blur="blur('email')" />
      <AppInput v-model="store.state.client.phone" label="Téléphone" />
      <AppInput v-model="store.state.client.address" label="Adresse" />
      <AppInput v-model="store.state.client.zip" label="NPA" />
      <AppInput v-model="store.state.client.city" label="Ville" />
    </div>

    <label class="block text-left">
      <span class="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">Description du projet</span>
      <textarea
        v-model="store.state.client.projectDescription"
        rows="4"
        class="w-full resize-y rounded-lg border border-slate-300 bg-white/85 px-3 py-2.5 text-sm text-slate-950 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-white/10 dark:text-white"
      ></textarea>
    </label>

    <label class="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white">
      <input
        v-model="store.state.client.existingClient"
        type="checkbox"
        class="h-4 w-4 cursor-pointer accent-emerald-500"
        @change="store.state.global.existingClient = store.state.client.existingClient"
      />
      Client existant
    </label>
  </section>
</template>

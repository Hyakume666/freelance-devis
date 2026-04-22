<script setup>
import { RouterLink } from 'vue-router'
import { CheckCircle2, FileText, History } from 'lucide-vue-next'
import AppButton from '../components/ui/AppButton.vue'
</script>

<template>
  <section class="mx-auto max-w-2xl py-16 text-center">
    <div class="mx-auto grid h-16 w-16 place-items-center rounded-xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-600 dark:text-emerald-300">
      <CheckCircle2 class="h-9 w-9" aria-hidden="true" />
    </div>
    <h1 class="mt-6 text-3xl font-bold text-slate-950 dark:text-white">Devis envoyé</h1>
    <p class="mt-3 text-slate-700 dark:text-slate-300">
      L'email transactionnel a été accepté par Brevo et le devis est ajouté à l'historique.
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <RouterLink to="/devis" class="cursor-pointer">
        <AppButton>
          <template #icon><FileText class="h-4 w-4" /></template>
          Nouveau devis
        </AppButton>
      </RouterLink>
      <RouterLink to="/history" class="cursor-pointer">
        <AppButton variant="secondary">
          <template #icon><History class="h-4 w-4" /></template>
          Voir l'historique
        </AppButton>
      </RouterLink>
    </div>
  </section>
</template>

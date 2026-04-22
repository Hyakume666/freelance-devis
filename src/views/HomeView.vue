<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, BadgeCheck, Clock3, FileText, ShieldCheck } from 'lucide-vue-next'
import AppButton from '../components/ui/AppButton.vue'
</script>

<template>
  <section class="grid min-h-[calc(100vh-8rem)] items-center gap-8 py-10 lg:grid-cols-[1fr_28rem]">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Générateur de devis freelance</p>
      <h1 class="mt-4 max-w-4xl text-4xl font-bold leading-tight text-slate-950 dark:text-white md:text-6xl">
        Loïc Barthoulot — Freelance IT
      </h1>
      <p class="mt-5 max-w-2xl text-lg text-slate-700 dark:text-slate-300">
        Créez un devis clair, cohérent et prêt à envoyer pour vos prestations web, support informatique et montage PC.
      </p>
      <div class="mt-7 flex flex-wrap gap-3">
        <RouterLink to="/devis" class="cursor-pointer">
          <AppButton>
            <template #icon><FileText class="h-4 w-4" aria-hidden="true" /></template>
            Créer un devis
          </AppButton>
        </RouterLink>
        <RouterLink to="/history" class="cursor-pointer">
          <AppButton variant="secondary">
            Historique
            <template #icon><ArrowRight class="h-4 w-4" aria-hidden="true" /></template>
          </AppButton>
        </RouterLink>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/25">
      <div class="grid gap-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/35">
          <BadgeCheck class="h-6 w-6 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          <h2 class="mt-3 text-lg font-semibold text-slate-950 dark:text-white">Calcul automatisé</h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Options, déplacement, urgence, remise et TVA sont recalculés en direct.</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/35">
          <ShieldCheck class="h-6 w-6 text-sky-600 dark:text-sky-300" aria-hidden="true" />
          <h2 class="mt-3 text-lg font-semibold text-slate-950 dark:text-white">PDF professionnel</h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Un document A4 structuré, prêt à joindre à un email client.</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/35">
          <Clock3 class="h-6 w-6 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <h2 class="mt-3 text-lg font-semibold text-slate-950 dark:text-white">Historique local</h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Les 20 derniers devis restent accessibles depuis ce navigateur.</p>
        </div>
      </div>
    </div>
  </section>
</template>

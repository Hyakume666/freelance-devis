<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FileText, History, Home, MonitorCog, Moon, Sun } from 'lucide-vue-next'
import AppToast from './components/ui/AppToast.vue'

const route = useRoute()
const isDark = ref(true)

const navItems = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/devis', label: 'Créer un devis', icon: FileText },
  { to: '/history', label: 'Historique', icon: History },
]

const themeIcon = computed(() => (isDark.value ? Sun : Moon))

function applyTheme(value) {
  document.documentElement.classList.toggle('dark', value)
  document.documentElement.classList.add('transition-colors', 'duration-300')
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme ? savedTheme === 'dark' : true
  applyTheme(isDark.value)
})

watch(isDark, applyTheme)
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-950 antialiased dark:bg-[#020617] dark:text-slate-50"
  >
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(135deg,#020617,#0f172a_48%,#111827),linear-gradient(90deg,rgba(34,197,94,0.14),rgba(14,165,233,0.12))] dark:opacity-100"></div>
      <div class="absolute inset-0 bg-[linear-gradient(120deg,#f8fafc,#e2e8f0_55%,#f0fdf4)] opacity-100 dark:opacity-0"></div>
    </div>

    <header class="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex cursor-pointer items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
          <span class="grid h-10 w-10 place-items-center rounded-lg border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
            <MonitorCog class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="hidden text-left sm:block">
            <span class="block text-sm font-semibold text-slate-950 dark:text-white">Loïc Barthoulot</span>
            <span class="block text-xs text-slate-600 dark:text-slate-400">Freelance IT</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200/70 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            :class="{ 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300': route.path === item.to }"
          >
            <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
            <span class="hidden md:inline">{{ item.label }}</span>
          </RouterLink>
          <button
            v-motion
            :hovered="{ scale: 1.03 }"
            :pressed="{ scale: 0.97 }"
            type="button"
            class="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-white/80 text-slate-800 transition-colors duration-200 hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:border-emerald-300 dark:hover:text-emerald-300"
            :aria-label="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
            @click="toggleTheme"
          >
            <component :is="themeIcon" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <RouterView v-slot="{ Component }">
        <div
          :key="route.fullPath"
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } }"
        >
          <component :is="Component" />
        </div>
      </RouterView>
    </main>

    <AppToast />
  </div>
</template>

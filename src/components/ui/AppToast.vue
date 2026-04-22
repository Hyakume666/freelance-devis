<script setup>
import { computed } from 'vue'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'

const { toasts, remove } = useToast()

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

const styles = {
  success: 'border-emerald-400/40 bg-emerald-950/90 text-emerald-50',
  error: 'border-red-400/40 bg-red-950/90 text-red-50',
  warning: 'border-amber-400/40 bg-amber-950/90 text-amber-50',
  info: 'border-sky-400/40 bg-sky-950/90 text-sky-50',
}

const visibleToasts = computed(() => toasts.value)
</script>

<template>
  <Teleport to="body">
    <div class="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      <div
        v-for="toast in visibleToasts"
        :key="toast.id"
        v-motion
        :initial="{ opacity: 0, x: 48 }"
        :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }"
        :leave="{ opacity: 0, x: 48 }"
        class="overflow-hidden rounded-lg border shadow-2xl backdrop-blur-xl"
        :class="styles[toast.type]"
        role="status"
      >
        <div class="flex items-start gap-3 p-4">
          <component :is="icons[toast.type]" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            <p v-if="toast.message" class="mt-1 text-sm opacity-85">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-md p-1 opacity-80 transition-colors duration-200 hover:bg-white/10 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Fermer la notification"
            @click="remove(toast.id)"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div class="h-1 bg-white/15">
          <div class="h-full bg-white/70" :style="{ animation: `toast-progress ${toast.duration}ms linear forwards` }"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>

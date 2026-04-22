<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const variants = {
  primary:
    'border-emerald-400/70 bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:outline-emerald-300',
  secondary:
    'border-sky-400/50 bg-sky-500/15 text-sky-800 hover:bg-sky-500/25 focus-visible:outline-sky-400 dark:text-sky-200',
  ghost:
    'border-transparent bg-transparent text-slate-700 hover:bg-slate-200/80 focus-visible:outline-emerald-400 dark:text-slate-200 dark:hover:bg-white/10',
  danger:
    'border-red-500/60 bg-red-500/15 text-red-700 hover:bg-red-500/25 focus-visible:outline-red-500 dark:text-red-200',
}
</script>

<template>
  <button
    v-motion
    :hovered="disabled || loading ? undefined : { scale: 1.03 }"
    :pressed="disabled || loading ? undefined : { scale: 0.97 }"
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="variants[variant]"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>

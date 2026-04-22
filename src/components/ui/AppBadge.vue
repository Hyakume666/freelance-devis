<script setup>
defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error', 'neutral'].includes(value),
  },
})

const variants = {
  info: 'border-sky-400/40 bg-sky-500/15 text-sky-800 dark:text-sky-200',
  success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  warning: 'border-amber-400/50 bg-amber-500/15 text-amber-800 dark:text-amber-200',
  error: 'border-red-400/50 bg-red-500/15 text-red-800 dark:text-red-200',
  neutral: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200',
}
</script>

<template>
  <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" :class="variants[variant]">
    <slot />
  </span>
</template>

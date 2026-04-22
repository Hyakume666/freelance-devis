<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <span class="group relative inline-flex">
    <slot />
    <span
      class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-48 -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-white dark:text-slate-950"
    >
      {{ text }}
    </span>
  </span>
</template>

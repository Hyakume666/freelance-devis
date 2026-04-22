<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="block text-left">
    <span class="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">{{ label }}</span>
    <select
      :value="modelValue"
      class="w-full cursor-pointer rounded-lg border border-slate-300 bg-white/85 px-3 py-2.5 text-sm text-slate-950 outline-none transition-colors duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-slate-900 dark:text-white"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

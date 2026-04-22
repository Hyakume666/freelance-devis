<script setup>
defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
  label: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="block text-left">
    <span class="mb-2 flex items-center justify-between text-sm font-medium text-slate-800 dark:text-slate-200">
      <span>{{ label }}</span>
      <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ modelValue }}%</span>
    </span>
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      class="h-2 w-full cursor-pointer accent-emerald-500"
      @input="emit('update:modelValue', Number($event.target.value))"
    />
  </label>
</template>

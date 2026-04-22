<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  error: {
    type: String,
    default: '',
  },
  success: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'blur'])
const stateClass = computed(() => {
  if (props.error) return 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
  if (props.success) return 'border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500/30'
  return 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/30 dark:border-white/10'
})
</script>

<template>
  <label class="block text-left">
    <span class="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
      {{ label }}<span v-if="required" class="text-emerald-600 dark:text-emerald-300"> *</span>
    </span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      class="w-full rounded-lg border bg-white/85 px-3 py-2.5 text-sm text-slate-950 outline-none transition-colors duration-200 placeholder:text-slate-500 focus:ring-4 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-500"
      :class="stateClass"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />
    <span v-if="error" class="mt-1 block text-xs font-medium text-red-600 dark:text-red-300">{{ error }}</span>
  </label>
</template>

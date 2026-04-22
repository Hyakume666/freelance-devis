<script setup>
import { nextTick, onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
  if (event.key !== 'Tab') return

  const modal = document.querySelector('[data-app-modal]')
  const focusable = modal?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (!focusable?.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    document.body.classList.toggle('overflow-hidden', open)
    if (open) {
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      document.querySelector('[data-app-modal] button')?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.body.classList.remove('overflow-hidden')
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        class="absolute inset-0 cursor-pointer bg-slate-950/75 backdrop-blur-md"
        aria-label="Fermer la fenêtre"
        @click="close"
      ></button>
      <section
        v-motion
        data-app-modal
        :initial="{ opacity: 0, scale: 0.95, y: 12 }"
        :enter="{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } }"
        :leave="{ opacity: 0, scale: 0.95 }"
        class="relative w-full max-w-lg rounded-xl border border-white/15 bg-white p-5 text-slate-950 shadow-2xl dark:bg-slate-950 dark:text-white"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header class="mb-4 flex items-center justify-between gap-4">
          <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
          <button
            type="button"
            class="ml-auto grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Fermer"
            @click="close"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

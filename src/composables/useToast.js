import { readonly, ref } from 'vue'

const toasts = ref([])
let toastId = 0

/**
 * Display and manage application toasts.
 */
export function useToast() {
  /**
   * @param {{ type?: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number }} toast
   */
  function push(toast) {
    const id = ++toastId
    const entry = {
      id,
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message || '',
      duration: toast.duration ?? 4000,
    }

    toasts.value = [entry, ...toasts.value].slice(0, 3)

    window.setTimeout(() => remove(id), entry.duration)
    return id
  }

  /**
   * @param {number} id
   */
  function remove(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts: readonly(toasts),
    push,
    remove,
  }
}

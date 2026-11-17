import { readonly, ref } from 'vue';

const toasts = ref([]);
let nextId = 1;

function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function push(type, message, { duration = 4000 } = {}) {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, type, message }].slice(-4);
  if (duration > 0) setTimeout(() => dismiss(id), duration);
  return id;
}

/** App-wide toast notifications (module-level state, no store needed). */
export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    success: (message, opts) => push('success', message, opts),
    error: (message, opts) => push('error', message, { duration: 6000, ...opts }),
    info: (message, opts) => push('info', message, opts),
  };
}

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';

/**
 * Wrapper around a native <dialog> styled as a DaisyUI modal. Gives focus
 * trapping, Esc-to-close and a proper backdrop for free.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  labelledby: { type: String, default: undefined },
  size: { type: String, default: 'md' }, // sm | md
  persistent: { type: Boolean, default: false }, // block closing (e.g. while saving)
});
const emit = defineEmits(['close']);

const dialog = ref(null);

watch(
  () => props.open,
  (open) => {
    const el = dialog.value;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  },
  { flush: 'post' }
);

function requestClose() {
  if (!props.persistent) emit('close');
}

// Esc fires "cancel": keep the dialog open and let the parent decide.
function onCancel(event) {
  event.preventDefault();
  requestClose();
}

onBeforeUnmount(() => dialog.value?.open && dialog.value.close());
</script>

<template>
  <dialog
    ref="dialog"
    class="modal modal-bottom sm:modal-middle"
    :aria-labelledby="labelledby"
    @cancel="onCancel"
  >
    <div
      class="modal-box w-full rounded-t-box p-0 sm:rounded-box"
      :class="size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg'"
    >
      <slot v-if="open" />
    </div>
    <div class="modal-backdrop bg-slate-900/40" @click="requestClose" />
  </dialog>
</template>

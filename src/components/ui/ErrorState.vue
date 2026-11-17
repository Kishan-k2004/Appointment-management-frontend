<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  message: { type: String, default: 'Something went wrong.' },
  compact: { type: Boolean, default: false },
});
defineEmits(['retry']);
</script>

<template>
  <div role="alert" class="flex flex-col items-center justify-center text-center" :class="compact ? 'px-4 py-8' : 'px-6 py-14'">
    <div class="mb-3 grid size-12 place-items-center rounded-full bg-rose-50 text-rose-500">
      <AppIcon name="alert" :size="22" />
    </div>
    <p class="font-medium">Couldn't load appointments</p>
    <p class="mt-1 max-w-sm text-sm text-base-content/60">{{ message }}</p>
    <button type="button" class="btn btn-sm btn-outline mt-4" @click="$emit('retry')">
      <AppIcon name="refresh" :size="14" /> Try again
    </button>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'inbox' },
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center" :class="compact ? 'px-4 py-8' : 'px-6 py-14'">
    <div class="mb-3 grid size-12 place-items-center rounded-full bg-base-200 text-base-content/40">
      <AppIcon :name="icon" :size="22" />
    </div>
    <p class="font-medium">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-base-content/60">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>

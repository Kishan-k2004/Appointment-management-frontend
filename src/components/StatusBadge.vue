<script setup>
import { statusClass } from '@/constants/status';

defineProps({
  status: { type: String, required: true },
  size: { type: String, default: 'md' },
});
</script>

<template>
  <span
    :class="[
      statusClass(status),
      'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
      'border-(--status-border) bg-(--status-bg) text-(--status-text)',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
    ]"
  >
    <span class="size-1.5 rounded-full bg-(--status-dot)" aria-hidden="true" />
    {{ status }}
  </span>
</template>

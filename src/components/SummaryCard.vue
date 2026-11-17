<script setup>
import AppIcon from './ui/AppIcon.vue';

defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: null },
  icon: { type: String, required: true },
  tone: { type: String, default: 'primary' }, // primary | pending | confirmed | cancelled
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
});

const TONES = {
  primary: 'bg-indigo-50 text-indigo-600',
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-rose-50 text-rose-600',
};
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="card-surface group flex items-center gap-4 p-5 transition"
    :class="to && 'hover:border-primary/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary'"
  >
    <div :class="[TONES[tone], 'grid size-11 place-items-center rounded-xl']">
      <AppIcon :name="icon" :size="20" />
    </div>
    <div class="min-w-0">
      <p class="text-sm text-base-content/60">{{ label }}</p>
      <div v-if="loading" class="skeleton mt-1.5 h-7 w-14" />
      <p v-else class="text-2xl font-semibold tracking-tight tabular-nums">{{ value ?? '—' }}</p>
    </div>
    <AppIcon
      v-if="to"
      name="arrow-right"
      :size="16"
      class="ml-auto text-base-content/30 transition group-hover:translate-x-0.5 group-hover:text-primary"
    />
  </component>
</template>

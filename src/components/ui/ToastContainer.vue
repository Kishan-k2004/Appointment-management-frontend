<script setup>
import { useToast } from '@/composables/useToast';
import AppIcon from './AppIcon.vue';

const { toasts, dismiss } = useToast();

const STYLES = {
  success: { icon: 'check-circle', cls: 'text-emerald-600' },
  error: { icon: 'alert', cls: 'text-rose-600' },
  info: { icon: 'info', cls: 'text-sky-600' },
};
</script>

<template>
  <div class="toast toast-end toast-bottom z-[1000] p-4" aria-live="polite" aria-atomic="false">
    <TransitionGroup
      enter-from-class="opacity-0 translate-y-2"
      enter-active-class="transition duration-200"
      leave-to-class="opacity-0"
      leave-active-class="transition duration-150"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :role="t.type === 'error' ? 'alert' : 'status'"
        class="flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-box border border-base-300 bg-base-100 px-4 py-3 text-sm shadow-lg"
      >
        <AppIcon :name="STYLES[t.type].icon" :size="18" :class="[STYLES[t.type].cls, 'mt-px']" />
        <p class="flex-1 break-words whitespace-normal">{{ t.message }}</p>
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square -mr-1 text-base-content/50"
          aria-label="Dismiss notification"
          @click="dismiss(t.id)"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { STATUSES } from '@/constants/status';
import { useAppointmentStore } from '@/stores/appointmentStore';
import StatusBadge from './StatusBadge.vue';
import AppIcon from './ui/AppIcon.vue';

/** Status badge that doubles as a dropdown to PATCH a new status. */
const props = defineProps({
  appointment: { type: Object, required: true },
  align: { type: String, default: 'end' },
});

const store = useAppointmentStore();
const { statusUpdating } = storeToRefs(store);
const busy = computed(() => statusUpdating.value.has(props.appointment.id));

function select(status) {
  // Close the DaisyUI focus-based dropdown.
  document.activeElement?.blur();
  store.changeStatus(props.appointment, status);
}
</script>

<template>
  <div class="dropdown" :class="align === 'end' ? 'dropdown-end' : 'dropdown-start'">
    <button
      type="button"
      tabindex="0"
      class="inline-flex cursor-pointer items-center gap-1 rounded-full transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait"
      :disabled="busy"
      :aria-label="`Change status (currently ${appointment.status})`"
      aria-haspopup="menu"
    >
      <StatusBadge :status="appointment.status" />
      <span v-if="busy" class="loading loading-spinner loading-xs text-base-content/50" />
      <AppIcon v-else name="chevron-down" :size="14" class="text-base-content/40" />
    </button>
    <ul
      tabindex="0"
      role="menu"
      class="dropdown-content menu z-30 mt-1 w-44 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-lg"
    >
      <li class="menu-title px-2 py-1 text-[11px] uppercase tracking-wide">Set status</li>
      <li v-for="status in STATUSES" :key="status" role="none">
        <button
          type="button"
          role="menuitem"
          class="flex items-center justify-between"
          :class="{ 'menu-active': status === appointment.status }"
          @click="select(status)"
        >
          <StatusBadge :status="status" size="sm" />
          <AppIcon v-if="status === appointment.status" name="check" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

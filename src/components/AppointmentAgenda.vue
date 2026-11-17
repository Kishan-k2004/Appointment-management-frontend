<script setup>
import { useAppointmentStore } from '@/stores/appointmentStore';
import { formatDate, formatTime } from '@/utils/date';
import { statusClass } from '@/constants/status';
import StatusMenu from './StatusMenu.vue';

/** Compact list of appointments (calendar side panel, dashboard). */
defineProps({
  items: { type: Array, required: true },
  showDate: { type: Boolean, default: false },
});

const store = useAppointmentStore();
</script>

<template>
  <ul class="divide-y divide-base-300">
    <li v-for="appt in items" :key="appt.id" class="flex items-center gap-3 py-3">
      <span
        :class="statusClass(appt.status)"
        class="h-10 w-1 shrink-0 rounded-full bg-(--status-dot)"
        aria-hidden="true"
      />
      <button
        type="button"
        class="min-w-0 flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="store.openDetails(appt)"
      >
        <p class="truncate text-sm font-medium" :class="appt.status === 'Cancelled' && 'line-through decoration-base-content/40'">
          {{ appt.customerName }}
        </p>
        <p class="truncate text-xs text-base-content/60">
          <span class="tabular-nums">{{ showDate ? `${formatDate(appt.dateTime)}, ` : '' }}{{ formatTime(appt.dateTime) }}</span>
          · {{ appt.service }}
        </p>
      </button>
      <StatusMenu :appointment="appt" />
    </li>
  </ul>
</template>

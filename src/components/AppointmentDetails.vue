<script setup>
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { formatDate, formatLongDate, formatTime } from '@/utils/date';
import BaseModal from './ui/BaseModal.vue';
import AppIcon from './ui/AppIcon.vue';
import StatusMenu from './StatusMenu.vue';

const store = useAppointmentStore();
const { details } = storeToRefs(store);

function edit() {
  const appt = details.value.appointment;
  store.closeDetails();
  store.openEdit(appt);
}

function remove() {
  store.requestDelete(details.value.appointment);
}
</script>

<template>
  <BaseModal :open="details.open" size="sm" labelledby="details-title" @close="store.closeDetails">
    <template v-if="details.appointment">
      <header class="flex items-start justify-between gap-3 px-6 pt-5">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">Appointment</p>
          <h2 id="details-title" class="mt-0.5 truncate text-lg font-semibold">
            {{ details.appointment.customerName }}
          </h2>
        </div>
        <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Close" @click="store.closeDetails">
          <AppIcon name="x" />
        </button>
      </header>

      <dl class="space-y-3.5 px-6 py-5 text-sm">
        <div class="flex items-center gap-3">
          <dt class="text-base-content/50"><AppIcon name="briefcase" :size="16" /><span class="sr-only">Service</span></dt>
          <dd>{{ details.appointment.service }}</dd>
        </div>
        <div class="flex items-center gap-3">
          <dt class="text-base-content/50"><AppIcon name="calendar" :size="16" /><span class="sr-only">Date</span></dt>
          <dd>{{ formatLongDate(details.appointment.dateTime) }}</dd>
        </div>
        <div class="flex items-center gap-3">
          <dt class="text-base-content/50"><AppIcon name="clock" :size="16" /><span class="sr-only">Time</span></dt>
          <dd>{{ formatTime(details.appointment.dateTime) }}</dd>
        </div>
        <div class="flex items-center gap-3">
          <dt class="text-base-content/50"><AppIcon name="layers" :size="16" /><span class="sr-only">Status</span></dt>
          <dd><StatusMenu :appointment="details.appointment" align="start" /></dd>
        </div>
        <p v-if="details.appointment.updatedAt" class="pt-1 text-xs text-base-content/45">
          Last updated {{ formatDate(details.appointment.updatedAt) }}, {{ formatTime(details.appointment.updatedAt) }}
        </p>
      </dl>

      <footer class="flex justify-end gap-2 border-t border-base-300 bg-base-200/50 px-6 py-4">
        <button type="button" class="btn btn-ghost text-error hover:bg-error/10" @click="remove">
          <AppIcon name="trash" :size="16" /> Delete
        </button>
        <button type="button" class="btn btn-primary" @click="edit">
          <AppIcon name="pencil" :size="16" /> Edit
        </button>
      </footer>
    </template>
  </BaseModal>
</template>

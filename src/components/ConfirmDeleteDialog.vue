<script setup>
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { formatDate, formatTime } from '@/utils/date';
import BaseModal from './ui/BaseModal.vue';
import AppIcon from './ui/AppIcon.vue';

const store = useAppointmentStore();
const { deletion } = storeToRefs(store);
</script>

<template>
  <BaseModal
    :open="deletion.open"
    size="sm"
    labelledby="delete-title"
    :persistent="deletion.loading"
    @close="store.cancelDelete"
  >
    <div class="p-6">
      <div class="flex items-start gap-4">
        <div class="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
          <AppIcon name="trash" :size="18" />
        </div>
        <div class="min-w-0">
          <h2 id="delete-title" class="text-base font-semibold">Delete appointment?</h2>
          <p v-if="deletion.appointment" class="mt-1 text-sm text-base-content/70">
            <span class="font-medium text-base-content">{{ deletion.appointment.customerName }}</span>
            — {{ deletion.appointment.service }} on {{ formatDate(deletion.appointment.dateTime) }} at
            {{ formatTime(deletion.appointment.dateTime) }}. This can't be undone.
          </p>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="btn btn-ghost" :disabled="deletion.loading" @click="store.cancelDelete">
          Cancel
        </button>
        <button type="button" class="btn btn-error" :disabled="deletion.loading" @click="store.confirmDelete">
          <span v-if="deletion.loading" class="loading loading-spinner loading-sm" />
          {{ deletion.loading ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

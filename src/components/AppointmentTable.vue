<script setup>
import { useAppointmentStore } from '@/stores/appointmentStore';
import { formatDate, formatTime } from '@/utils/date';
import StatusMenu from './StatusMenu.vue';
import AppIcon from './ui/AppIcon.vue';

defineProps({
  items: { type: Array, required: true },
  sortOrder: { type: String, default: 'asc' },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle-sort']);

const store = useAppointmentStore();
</script>

<template>
  <div :class="loading && 'opacity-60 transition-opacity'" :aria-busy="loading">
    <!-- Desktop / tablet table -->
    <div class="hidden md:block">
      <table class="table">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-base-content/50">
            <th scope="col">Customer</th>
            <th scope="col">Service</th>
            <th scope="col" :aria-sort="sortOrder === 'asc' ? 'ascending' : 'descending'">
              <button
                type="button"
                class="inline-flex items-center gap-1 uppercase hover:text-base-content"
                :title="`Sort by date (${sortOrder === 'asc' ? 'oldest' : 'newest'} first)`"
                @click="emit('toggle-sort')"
              >
                Date
                <AppIcon name="chevron-down" :size="14" :class="sortOrder === 'asc' && 'rotate-180'" class="transition" />
              </button>
            </th>
            <th scope="col">Time</th>
            <th scope="col">Status</th>
            <th scope="col" class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appt in items" :key="appt.id" class="hover:bg-base-200/50">
            <td class="max-w-56">
              <button
                type="button"
                class="block max-w-full truncate text-left font-medium hover:text-primary hover:underline"
                @click="store.openDetails(appt)"
              >
                {{ appt.customerName }}
              </button>
            </td>
            <td class="max-w-56 truncate text-base-content/80">{{ appt.service }}</td>
            <td class="whitespace-nowrap tabular-nums">{{ formatDate(appt.dateTime) }}</td>
            <td class="whitespace-nowrap tabular-nums">{{ formatTime(appt.dateTime) }}</td>
            <td><StatusMenu :appointment="appt" align="start" /></td>
            <td class="text-right whitespace-nowrap">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square"
                :aria-label="`Edit appointment for ${appt.customerName}`"
                title="Edit"
                @click="store.openEdit(appt)"
              >
                <AppIcon name="pencil" :size="16" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                :aria-label="`Delete appointment for ${appt.customerName}`"
                title="Delete"
                @click="store.requestDelete(appt)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <ul class="divide-y divide-base-300 md:hidden">
      <li v-for="appt in items" :key="appt.id" class="space-y-2 px-4 py-3.5">
        <div class="flex items-start justify-between gap-3">
          <button type="button" class="min-w-0 text-left" @click="store.openDetails(appt)">
            <p class="truncate font-medium">{{ appt.customerName }}</p>
            <p class="truncate text-sm text-base-content/60">{{ appt.service }}</p>
          </button>
          <StatusMenu :appointment="appt" />
        </div>
        <div class="flex items-center justify-between gap-3">
          <p class="flex items-center gap-1.5 text-sm tabular-nums text-base-content/70">
            <AppIcon name="clock" :size="14" />
            {{ formatDate(appt.dateTime) }}, {{ formatTime(appt.dateTime) }}
          </p>
          <div class="flex shrink-0">
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square"
              :aria-label="`Edit appointment for ${appt.customerName}`"
              @click="store.openEdit(appt)"
            >
              <AppIcon name="pencil" :size="16" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square text-error"
              :aria-label="`Delete appointment for ${appt.customerName}`"
              @click="store.requestDelete(appt)"
            >
              <AppIcon name="trash" :size="16" />
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

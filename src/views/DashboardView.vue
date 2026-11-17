<script setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useRequest } from '@/composables/useRequest';
import { getAppointmentStats, getCalendarAppointments } from '@/services/appointmentService';
import { addDays, formatLongDate, startOfDay, toApiRange, toDateKey } from '@/utils/date';
import SummaryCard from '@/components/SummaryCard.vue';
import AppointmentAgenda from '@/components/AppointmentAgenda.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const store = useAppointmentStore();
const { revision } = storeToRefs(store);

const stats = useRequest((signal) => getAppointmentStats({ signal }));

// Today + the next 7 days in a single calendar request, split client-side.
const upcoming = useRequest(
  (signal) => {
    const today = startOfDay(new Date());
    return getCalendarAppointments(toApiRange(today, addDays(today, 8)), { signal });
  },
  { initialData: { items: [] } }
);

watch(
  revision,
  () => {
    stats.run();
    upcoming.run();
  },
  { immediate: true }
);

const todayKey = computed(() => toDateKey(new Date()));
const todayItems = computed(() =>
  upcoming.data.value.items.filter((a) => toDateKey(new Date(a.dateTime)) === todayKey.value)
);
const nextItems = computed(() =>
  upcoming.data.value.items.filter((a) => toDateKey(new Date(a.dateTime)) !== todayKey.value)
);

const CARDS = [
  { key: 'total', label: 'Total Appointments', icon: 'layers', tone: 'primary', to: '/appointments' },
  { key: 'Pending', label: 'Pending', icon: 'hourglass', tone: 'pending', to: '/appointments?status=Pending' },
  { key: 'Confirmed', label: 'Confirmed', icon: 'check-circle', tone: 'confirmed', to: '/appointments?status=Confirmed' },
  { key: 'Cancelled', label: 'Cancelled', icon: 'x-circle', tone: 'cancelled', to: '/appointments?status=Cancelled' },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm text-base-content/60">{{ formatLongDate(new Date()) }}</p>
      <h2 class="text-xl font-semibold tracking-tight sm:text-2xl">Overview</h2>
    </div>

    <section aria-label="Appointment summary">
      <div
        v-if="stats.error.value"
        role="alert"
        class="alert alert-soft alert-error mb-4 flex flex-wrap items-center justify-between text-sm"
      >
        <span class="flex items-center gap-2">
          <AppIcon name="alert" :size="16" /> Couldn't load summary: {{ stats.error.value.message }}
        </span>
        <button type="button" class="btn btn-xs btn-outline" @click="stats.run">Retry</button>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          v-for="card in CARDS"
          :key="card.key"
          :label="card.label"
          :icon="card.icon"
          :tone="card.tone"
          :to="card.to"
          :value="stats.data.value?.[card.key]"
          :loading="stats.loading.value && !stats.data.value"
        />
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section class="card-surface" aria-labelledby="today-title">
        <header class="flex items-center justify-between border-b border-base-300 px-5 py-3.5">
          <h3 id="today-title" class="font-semibold">Today</h3>
          <span class="badge badge-ghost badge-sm tabular-nums">{{ todayItems.length }}</span>
        </header>
        <div class="px-5">
          <ErrorState v-if="upcoming.error.value" compact :message="upcoming.error.value.message" @retry="upcoming.run" />
          <div v-else-if="upcoming.loading.value && !upcoming.data.value.items.length" class="space-y-3 py-4">
            <div v-for="i in 3" :key="i" class="skeleton h-10 w-full" />
          </div>
          <AppointmentAgenda v-else-if="todayItems.length" :items="todayItems" />
          <EmptyState v-else compact icon="calendar" title="No appointments today" description="Enjoy the free time, or book something new.">
            <button type="button" class="btn btn-sm btn-primary btn-soft" @click="store.openCreate({ date: todayKey })">
              <AppIcon name="plus" :size="14" /> Add appointment
            </button>
          </EmptyState>
        </div>
      </section>

      <section class="card-surface" aria-labelledby="upcoming-title">
        <header class="flex items-center justify-between border-b border-base-300 px-5 py-3.5">
          <h3 id="upcoming-title" class="font-semibold">Next 7 days</h3>
          <RouterLink to="/calendar" class="link link-hover text-sm text-primary">Open calendar</RouterLink>
        </header>
        <div class="px-5">
          <ErrorState v-if="upcoming.error.value" compact :message="upcoming.error.value.message" @retry="upcoming.run" />
          <div v-else-if="upcoming.loading.value && !upcoming.data.value.items.length" class="space-y-3 py-4">
            <div v-for="i in 3" :key="i" class="skeleton h-10 w-full" />
          </div>
          <AppointmentAgenda v-else-if="nextItems.length" :items="nextItems.slice(0, 8)" show-date />
          <EmptyState v-else compact icon="clock" title="Nothing coming up" description="No appointments in the next 7 days." />
          <p v-if="nextItems.length > 8" class="border-t border-base-300 py-3 text-center text-sm">
            <RouterLink to="/calendar" class="link link-hover text-primary">
              +{{ nextItems.length - 8 }} more in the calendar
            </RouterLink>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

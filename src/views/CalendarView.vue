<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useRequest } from '@/composables/useRequest';
import { getCalendarAppointments } from '@/services/appointmentService';
import { STATUSES, statusClass } from '@/constants/status';
import {
  addDays,
  addMonths,
  eachDay,
  formatLongDate,
  formatRangeTitle,
  getViewRange,
  groupByDateKey,
  isSameDay,
  startOfDay,
  toApiRange,
  toDateKey,
} from '@/utils/date';
import MonthGrid from '@/components/calendar/MonthGrid.vue';
import TimeGrid from '@/components/calendar/TimeGrid.vue';
import AppointmentAgenda from '@/components/AppointmentAgenda.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const store = useAppointmentStore();
const { revision } = storeToRefs(store);

const VIEWS = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
];

const view = ref('month');
const cursor = ref(startOfDay(new Date())); // drives the visible range
const selected = ref(startOfDay(new Date())); // the highlighted day (side panel)

const range = computed(() => getViewRange(view.value, cursor.value));
const title = computed(() => formatRangeTitle(view.value, cursor.value));
const selectedKey = computed(() => toDateKey(selected.value));

/* ------------------------------- Data loading ------------------------------ */
// Fetch everything in the visible range (incl. leading/trailing days of the
// neighbouring months in month view) with exact local-midnight instants.
const { data, loading, error, run } = useRequest(
  (signal) => getCalendarAppointments(toApiRange(range.value.start, range.value.end), { signal }),
  { initialData: { items: [] } }
);

const rangeKey = computed(() => `${range.value.start.getTime()}-${range.value.end.getTime()}`);
watch([rangeKey, revision], run, { immediate: true });

/* ------------------------- Client-side status legend ----------------------- */
const visibleStatuses = reactive(Object.fromEntries(STATUSES.map((s) => [s, true])));

const visibleItems = computed(() => data.value.items.filter((a) => visibleStatuses[a.status]));
const byDay = computed(() => groupByDateKey(visibleItems.value));
const selectedItems = computed(() => byDay.value.get(selectedKey.value) || []);

const countsInRange = computed(() => {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const a of data.value.items) counts[a.status] = (counts[a.status] || 0) + 1;
  return counts;
});

/* -------------------------------- Navigation ------------------------------- */
function move(direction) {
  if (view.value === 'month') {
    const next = addMonths(cursor.value, direction);
    next.setDate(1);
    cursor.value = next;
    const today = new Date();
    selected.value =
      today.getFullYear() === next.getFullYear() && today.getMonth() === next.getMonth() ? startOfDay(today) : next;
  } else {
    const step = view.value === 'week' ? 7 : 1;
    cursor.value = addDays(cursor.value, direction * step);
    selected.value = addDays(selected.value, direction * step);
  }
}

function goToday() {
  cursor.value = startOfDay(new Date());
  selected.value = startOfDay(new Date());
}

function setView(id) {
  view.value = id;
  cursor.value = selected.value;
}

function selectDate(date) {
  selected.value = date;
  if (view.value === 'day') cursor.value = date;
}

function openDay(date) {
  selected.value = date;
  cursor.value = date;
  view.value = 'day';
}

const timeGridDays = computed(() => eachDay(range.value.start, range.value.end));

function createOnSelected() {
  store.openCreate({ date: selectedKey.value });
}

const isSelectedToday = computed(() => isSameDay(selected.value, new Date()));
</script>

<template>
  <div class="flex flex-col gap-4 xl:flex-row">
    <!-- Main calendar -->
    <section class="card-surface flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="Calendar">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-base-300 px-3 py-3 sm:px-4">
        <button type="button" class="btn btn-sm btn-outline border-base-300" @click="goToday">Today</button>
        <div class="flex items-center">
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square"
            :aria-label="`Previous ${view}`"
            @click="move(-1)"
          >
            <AppIcon name="chevron-left" />
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-square" :aria-label="`Next ${view}`" @click="move(1)">
            <AppIcon name="chevron-right" />
          </button>
        </div>
        <h2 class="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg" aria-live="polite">{{ title }}</h2>
        <span v-if="loading" class="loading loading-spinner loading-sm text-primary" aria-label="Loading appointments" />

        <div role="tablist" aria-label="Calendar view" class="join order-last w-full sm:order-none sm:w-auto">
          <button
            v-for="v in VIEWS"
            :key="v.id"
            type="button"
            role="tab"
            :aria-selected="view === v.id"
            class="btn btn-sm join-item flex-1 border-base-300 sm:flex-none"
            :class="view === v.id ? 'btn-primary' : 'btn-outline bg-base-100 hover:bg-base-200 hover:text-base-content'"
            @click="setView(v.id)"
          >
            {{ v.label }}
          </button>
        </div>
      </div>

      <!-- Legend / status toggles -->
      <div class="flex flex-wrap items-center gap-2 border-b border-base-300 px-3 py-2 sm:px-4">
        <span class="text-xs text-base-content/50">Show:</span>
        <label
          v-for="s in STATUSES"
          :key="s"
          class="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition has-focus-visible:outline-2 has-focus-visible:outline-primary"
          :class="[
            statusClass(s),
            visibleStatuses[s]
              ? 'border-(--status-border) bg-(--status-bg) text-(--status-text)'
              : 'border-base-300 bg-base-100 hover:bg-base-200',
          ]"
          :title="visibleStatuses[s] ? `Hide ${s} appointments` : `Show ${s} appointments`"
        >
          <input v-model="visibleStatuses[s]" type="checkbox" class="sr-only" />
          <span class="size-2 rounded-full bg-(--status-dot)" :class="!visibleStatuses[s] && 'opacity-30'" />
          <span :class="!visibleStatuses[s] && 'text-base-content/40 line-through'">{{ s }}</span>
          <span class="tabular-nums opacity-60">{{ countsInRange[s] }}</span>
        </label>
      </div>

      <!-- Body -->
      <ErrorState v-if="error" :message="error.message" @retry="run" />
      <div
        v-else
        class="relative"
        :class="view === 'month' ? '' : 'h-[min(70vh,720px)]'"
        :aria-busy="loading"
      >
        <MonthGrid
          v-if="view === 'month'"
          :start="range.start"
          :end="range.end"
          :month="cursor.getMonth()"
          :by-day="byDay"
          :selected-key="selectedKey"
          @select="selectDate"
          @open="store.openDetails"
          @open-day="openDay"
        />
        <TimeGrid
          v-else
          :days="timeGridDays"
          :by-day="byDay"
          :selected-key="selectedKey"
          @select="selectDate"
          @open="store.openDetails"
          @create="store.openCreate"
        />
      </div>
    </section>

    <!-- Selected day panel -->
    <aside class="card-surface flex flex-col xl:w-80 xl:shrink-0 xl:self-start" aria-labelledby="selected-day-title">
      <div class="flex items-start justify-between gap-2 border-b border-base-300 px-4 py-3">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">
            {{ isSelectedToday ? 'Today' : 'Selected day' }}
          </p>
          <h2 id="selected-day-title" class="truncate font-semibold">{{ formatLongDate(selected) }}</h2>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-ghost btn-square text-primary"
          :aria-label="`Add appointment on ${formatLongDate(selected)}`"
          @click="createOnSelected"
        >
          <AppIcon name="plus" />
        </button>
      </div>
      <div class="px-4">
        <div v-if="loading && !data.items.length" class="space-y-3 py-4">
          <div v-for="i in 3" :key="i" class="skeleton h-10 w-full" />
        </div>
        <AppointmentAgenda v-else-if="selectedItems.length" :items="selectedItems" />
        <EmptyState v-else compact icon="calendar" title="No appointments" description="Nothing scheduled for this day.">
          <button type="button" class="btn btn-sm btn-primary btn-soft" @click="createOnSelected">
            <AppIcon name="plus" :size="14" /> Add appointment
          </button>
        </EmptyState>
      </div>
    </aside>
  </div>
</template>

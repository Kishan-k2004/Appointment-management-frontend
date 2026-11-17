<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useRequest } from '@/composables/useRequest';
import { listAppointments } from '@/services/appointmentService';
import { STATUSES } from '@/constants/status';
import { addDays, parseDateKey } from '@/utils/date';
import AppointmentFilters from '@/components/AppointmentFilters.vue';
import AppointmentTable from '@/components/AppointmentTable.vue';
import PaginationBar from '@/components/ui/PaginationBar.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const router = useRouter();
const store = useAppointmentStore();
const { revision } = storeToRefs(store);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIMITS = [10, 20, 50];
const EMPTY_FILTERS = { search: '', status: '', date: '', startDate: '', endDate: '' };

/* ------------------------- State, seeded from the URL ---------------------- */
// Filters live in the query string so they survive reloads and can be linked
// to (e.g. the dashboard cards link to ?status=Pending).
function readQuery(q) {
  const str = (v) => (typeof v === 'string' ? v : '');
  const dateOrEmpty = (v) => (DATE_RE.test(str(v)) ? str(v) : '');
  const date = dateOrEmpty(q.date);
  return {
    filters: {
      search: str(q.search).slice(0, 100),
      status: STATUSES.includes(q.status) ? q.status : '',
      date,
      startDate: date ? '' : dateOrEmpty(q.startDate),
      endDate: date ? '' : dateOrEmpty(q.endDate),
    },
    page: Math.max(1, Number.parseInt(q.page, 10) || 1),
    limit: LIMITS.includes(Number(q.limit)) ? Number(q.limit) : 10,
    sortOrder: q.sort === 'desc' ? 'desc' : 'asc',
  };
}

const initial = readQuery(route.query);
const filters = ref(initial.filters);
const page = ref(initial.page);
const limit = ref(initial.limit);
const sortOrder = ref(initial.sortOrder);

// External navigation to this route with a different query (e.g. clicking a
// dashboard card while already here) re-seeds the state.
watch(
  () => route.query,
  (q) => {
    if (JSON.stringify(q) === JSON.stringify(buildQuery())) return;
    const next = readQuery(q);
    filters.value = next.filters;
    page.value = next.page;
    limit.value = next.limit;
    sortOrder.value = next.sortOrder;
  }
);

function buildQuery() {
  const f = filters.value;
  const q = { ...f, page: page.value > 1 ? String(page.value) : '', limit: limit.value !== 10 ? String(limit.value) : '' };
  q.sort = sortOrder.value === 'desc' ? 'desc' : '';
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v));
}

/* ------------------------------ Debounced search --------------------------- */
const debouncedSearch = ref(filters.value.search);
let searchTimer = null;
watch(
  () => filters.value.search,
  (value) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => (debouncedSearch.value = value.trim()), 350);
  }
);

/* ------------------------------- Validation -------------------------------- */
const rangeError = computed(() => {
  const { startDate, endDate } = filters.value;
  return startDate && endDate && startDate > endDate ? 'End date must be on or after the start date.' : '';
});

/* ------------------------------- API params -------------------------------- */
// The date range is sent as exact local-midnight instants so the filter matches
// what the user sees, whatever their timezone. `date` is sent as YYYY-MM-DD and
// the service attaches the matching tzOffset.
const apiParams = computed(() => {
  const f = filters.value;
  const params = {
    search: debouncedSearch.value,
    status: f.status,
    page: page.value,
    limit: limit.value,
    sortOrder: sortOrder.value,
  };
  if (f.date) params.date = f.date;
  else {
    if (f.startDate) params.startDate = parseDateKey(f.startDate).toISOString();
    if (f.endDate) params.endDate = new Date(addDays(parseDateKey(f.endDate), 1).getTime() - 1).toISOString();
  }
  return params;
});

const { data, loading, error, run } = useRequest((signal) => listAppointments(apiParams.value, { signal }), {
  initialData: null,
});

function load() {
  if (rangeError.value) return;
  run();
}

// Any filter change returns to page 1. `sync` so the page reset lands in the
// same tick as the filter change and only one request is sent.
watch(
  () => [debouncedSearch.value, filters.value.status, filters.value.date, filters.value.startDate, filters.value.endDate, limit.value],
  () => {
    page.value = 1;
  },
  { flush: 'sync' }
);

watch([() => JSON.stringify(apiParams.value), revision], load, { immediate: true });

// Keep the URL in sync (replace, so the back button isn't flooded).
watch(
  () => JSON.stringify(buildQuery()),
  () => router.replace({ query: buildQuery() })
);

// If a deletion empties the current page, step back one page.
watch(data, (value) => {
  if (value && value.items.length === 0 && page.value > 1 && value.pagination.totalPages < page.value) {
    page.value = Math.max(1, value.pagination.totalPages);
  }
});

/* --------------------------------- Helpers --------------------------------- */
const items = computed(() => data.value?.items || []);
const pagination = computed(() => data.value?.pagination || { total: 0, page: 1, limit: limit.value, totalPages: 0 });
const hasActiveFilters = computed(() => Object.values(filters.value).some(Boolean));

function clearFilters() {
  clearTimeout(searchTimer);
  filters.value = { ...EMPTY_FILTERS };
  debouncedSearch.value = '';
}

function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}
</script>

<template>
  <div class="space-y-4">
    <section class="card-surface p-4" aria-label="Filters">
      <AppointmentFilters v-model="filters" :range-error="rangeError" @clear="clearFilters" />
    </section>

    <section class="card-surface overflow-hidden" aria-label="Appointments">
      <div class="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-3">
        <h2 class="font-semibold">
          Appointments
          <span v-if="data" class="ml-1 text-sm font-normal text-base-content/50 tabular-nums">({{ pagination.total }})</span>
        </h2>
        <div class="flex items-center gap-2">
          <span v-if="loading" class="loading loading-spinner loading-sm text-primary" aria-label="Loading" />
          <button
            type="button"
            class="btn btn-ghost btn-sm md:hidden"
            :aria-label="`Sort by date, currently ${sortOrder === 'asc' ? 'oldest' : 'newest'} first`"
            @click="toggleSort"
          >
            Date
            <AppIcon name="chevron-down" :size="14" :class="sortOrder === 'asc' && 'rotate-180'" />
          </button>
        </div>
      </div>

      <ErrorState v-if="error" :message="error.message" @retry="load" />

      <div v-else-if="!data && loading" class="space-y-3 p-4" aria-busy="true">
        <div v-for="i in 6" :key="i" class="skeleton h-11 w-full" />
      </div>

      <EmptyState
        v-else-if="rangeError"
        icon="alert"
        title="Invalid date range"
        description="Adjust the start and end dates to see results."
      />

      <EmptyState
        v-else-if="data && !items.length"
        :icon="hasActiveFilters ? 'search' : 'inbox'"
        :title="hasActiveFilters ? 'No matching appointments' : 'No appointments yet'"
        :description="hasActiveFilters ? 'Try a different name, status or date.' : 'Create your first appointment to get started.'"
      >
        <button v-if="hasActiveFilters" type="button" class="btn btn-sm btn-outline" @click="clearFilters">
          Clear filters
        </button>
        <button v-else type="button" class="btn btn-sm btn-primary" @click="store.openCreate()">
          <AppIcon name="plus" :size="14" /> Add appointment
        </button>
      </EmptyState>

      <template v-else-if="data">
        <AppointmentTable :items="items" :sort-order="sortOrder" :loading="loading" @toggle-sort="toggleSort" />
        <PaginationBar
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limits="LIMITS"
        />
      </template>
    </section>
  </div>
</template>

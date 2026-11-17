<script setup>
import { computed } from 'vue';
import { STATUSES } from '@/constants/status';
import AppIcon from './ui/AppIcon.vue';

/**
 * Search + filter controls. The backend accepts either `date` OR
 * `startDate`/`endDate` (not both), so picking one clears the other.
 */
const filters = defineModel({ type: Object, required: true });
defineProps({
  rangeError: { type: String, default: '' },
});
const emit = defineEmits(['clear']);

const hasFilters = computed(() =>
  Boolean(filters.value.search || filters.value.status || filters.value.date || filters.value.startDate || filters.value.endDate)
);

function update(patch) {
  filters.value = { ...filters.value, ...patch };
}

function setDate(value) {
  update({ date: value, ...(value ? { startDate: '', endDate: '' } : {}) });
}

function setRange(field, value) {
  update({ [field]: value, ...(value ? { date: '' } : {}) });
}
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
    <div class="lg:col-span-4">
      <label for="flt-search" class="mb-1 block text-xs font-medium text-base-content/70">Customer name</label>
      <label class="input w-full">
        <AppIcon name="search" :size="16" class="text-base-content/40" />
        <input
          id="flt-search"
          :value="filters.search"
          type="search"
          class="grow"
          placeholder="Search customers…"
          maxlength="100"
          autocomplete="off"
          @input="update({ search: $event.target.value })"
        />
      </label>
    </div>

    <div class="lg:col-span-2">
      <label for="flt-status" class="mb-1 block text-xs font-medium text-base-content/70">Status</label>
      <select
        id="flt-status"
        class="select w-full"
        :value="filters.status"
        @change="update({ status: $event.target.value })"
      >
        <option value="">All statuses</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="lg:col-span-2">
      <label for="flt-date" class="mb-1 block text-xs font-medium text-base-content/70">Date</label>
      <input
        id="flt-date"
        type="date"
        class="input w-full"
        :value="filters.date"
        @change="setDate($event.target.value)"
      />
    </div>

    <div class="sm:col-span-2 lg:col-span-3">
      <span id="flt-range-label" class="mb-1 block text-xs font-medium text-base-content/70">Date range</span>
      <div class="flex items-center gap-2" role="group" aria-labelledby="flt-range-label">
        <label for="flt-start" class="sr-only">Start date</label>
        <input
          id="flt-start"
          type="date"
          class="input w-full min-w-0"
          :class="rangeError && 'input-error'"
          :value="filters.startDate"
          :max="filters.endDate || undefined"
          @change="setRange('startDate', $event.target.value)"
        />
        <span class="text-base-content/40" aria-hidden="true">–</span>
        <label for="flt-end" class="sr-only">End date</label>
        <input
          id="flt-end"
          type="date"
          class="input w-full min-w-0"
          :class="rangeError && 'input-error'"
          :value="filters.endDate"
          :min="filters.startDate || undefined"
          :aria-describedby="rangeError ? 'flt-range-err' : undefined"
          @change="setRange('endDate', $event.target.value)"
        />
      </div>
    </div>

    <div class="sm:col-span-2 lg:col-span-1">
      <button
        type="button"
        class="btn btn-ghost w-full text-base-content/70"
        :disabled="!hasFilters"
        @click="emit('clear')"
      >
        <AppIcon name="x" :size="16" /> Clear
      </button>
    </div>

    <p v-if="rangeError" id="flt-range-err" role="alert" class="text-xs text-error sm:col-span-2 lg:col-span-12">
      {{ rangeError }}
    </p>
  </div>
</template>

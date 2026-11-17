<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, required: true },
  limit: { type: Number, required: true },
  limits: { type: Array, default: () => [10, 20, 50] },
});
const emit = defineEmits(['update:page', 'update:limit']);

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1));
const to = computed(() => Math.min(props.page * props.limit, props.total));

/** Compact page list: 1 … 4 5 6 … 12 */
const pages = computed(() => {
  const { page, totalPages } = props;
  const set = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
});
</script>

<template>
  <nav
    class="flex flex-col items-center justify-between gap-3 border-t border-base-300 px-4 py-3 text-sm sm:flex-row"
    aria-label="Pagination"
  >
    <div class="flex items-center gap-3 text-base-content/60">
      <span class="tabular-nums">{{ from }}–{{ to }} of {{ total }}</span>
      <label class="flex items-center gap-1.5">
        <span class="sr-only sm:not-sr-only">Rows</span>
        <select
          class="select select-sm w-20"
          :value="limit"
          aria-label="Rows per page"
          @change="emit('update:limit', Number($event.target.value))"
        >
          <option v-for="n in limits" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </div>

    <div v-if="totalPages > 1" class="join">
      <button
        type="button"
        class="btn btn-sm join-item"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="emit('update:page', page - 1)"
      >
        <AppIcon name="chevron-left" :size="16" />
      </button>
      <template v-for="p in pages" :key="p">
        <span v-if="typeof p === 'string'" class="btn btn-sm join-item btn-disabled" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="btn btn-sm join-item tabular-nums"
          :class="p === page && 'btn-primary'"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="`Page ${p}`"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        type="button"
        class="btn btn-sm join-item"
        :disabled="page >= totalPages"
        aria-label="Next page"
        @click="emit('update:page', page + 1)"
      >
        <AppIcon name="chevron-right" :size="16" />
      </button>
    </div>
  </nav>
</template>

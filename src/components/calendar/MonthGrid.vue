<script setup>
import { computed } from 'vue';
import { WEEKDAY_LABELS, eachDay, formatLongDate, formatTime, isToday, toDateKey } from '@/utils/date';
import { statusClass } from '@/constants/status';

const props = defineProps({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  month: { type: Number, required: true }, // 0-11, the month being displayed
  byDay: { type: Map, required: true },
  selectedKey: { type: String, required: true },
});
const emit = defineEmits(['select', 'open', 'open-day']);

const MAX_CHIPS = 3;

const cells = computed(() =>
  eachDay(props.start, props.end).map((date) => {
    const key = toDateKey(date);
    const items = props.byDay.get(key) || [];
    return {
      date,
      key,
      items,
      inMonth: date.getMonth() === props.month,
      today: isToday(date),
      selected: key === props.selectedKey,
    };
  })
);

function onKeydown(event, cell) {
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (event.key in moves) {
    event.preventDefault();
    const index = cells.value.indexOf(cell) + moves[event.key];
    const target = cells.value[index];
    if (target) {
      emit('select', target.date);
      requestAnimationFrame(() => document.getElementById(`cell-${target.key}`)?.focus());
    }
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('select', cell.date);
  }
}
</script>

<template>
  <div class="flex h-full flex-col" role="grid" aria-label="Month view">
    <div class="grid grid-cols-7 border-b border-base-300" role="row">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        role="columnheader"
        class="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-base-content/50"
      >
        {{ label }}
      </div>
    </div>

    <div class="grid flex-1 grid-cols-7 grid-rows-6">
      <div
        v-for="(cell, i) in cells"
        :id="`cell-${cell.key}`"
        :key="cell.key"
        role="gridcell"
        :tabindex="cell.selected ? 0 : -1"
        :aria-selected="cell.selected"
        :aria-label="`${formatLongDate(cell.date)}, ${cell.items.length} appointment${cell.items.length === 1 ? '' : 's'}`"
        class="group relative flex min-h-[64px] cursor-pointer flex-col gap-0.5 border-base-300 p-1 outline-none transition-colors sm:min-h-[104px] sm:p-1.5"
        :class="[
          i % 7 !== 6 && 'border-r',
          i < 35 && 'border-b',
          cell.inMonth ? 'bg-base-100' : 'bg-base-200/60',
          cell.selected ? 'bg-primary/5! ring-2 ring-inset ring-primary/40' : 'hover:bg-base-200/70',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        ]"
        @click="emit('select', cell.date)"
        @keydown="onKeydown($event, cell)"
      >
        <div class="flex justify-center sm:justify-start">
          <button
            type="button"
            tabindex="-1"
            class="grid size-7 place-items-center rounded-full text-xs font-medium transition hover:bg-base-300"
            :class="[
              cell.today && 'bg-primary! text-primary-content',
              !cell.today && !cell.inMonth && 'text-base-content/40',
            ]"
            :aria-label="`Open day view for ${formatLongDate(cell.date)}`"
            @click.stop="emit('open-day', cell.date)"
          >
            {{ cell.date.getDate() }}
          </button>
        </div>

        <!-- Desktop: labelled chips -->
        <ul class="hidden min-w-0 flex-col gap-0.5 sm:flex">
          <li v-for="appt in cell.items.slice(0, MAX_CHIPS)" :key="appt.id" class="min-w-0">
            <button
              type="button"
              tabindex="-1"
              :class="statusClass(appt.status)"
              class="flex w-full min-w-0 items-center gap-1.5 rounded-md border-l-[3px] border-(--status-dot) bg-(--status-bg) px-1.5 py-0.5 text-left text-[11px] leading-4 text-(--status-text) transition hover:brightness-95"
              :title="`${formatTime(appt.dateTime)} · ${appt.customerName} — ${appt.service} (${appt.status})`"
              @click.stop="emit('open', appt)"
            >
              <span class="shrink-0 tabular-nums opacity-80">{{ formatTime(appt.dateTime) }}</span>
              <span class="truncate font-medium" :class="appt.status === 'Cancelled' && 'line-through opacity-70'">
                {{ appt.customerName }}
              </span>
            </button>
          </li>
          <li v-if="cell.items.length > MAX_CHIPS">
            <button
              type="button"
              tabindex="-1"
              class="w-full rounded-md px-1.5 text-left text-[11px] font-medium text-base-content/60 hover:bg-base-300/60"
              @click.stop="emit('select', cell.date)"
            >
              +{{ cell.items.length - MAX_CHIPS }} more
            </button>
          </li>
        </ul>

        <!-- Mobile: status dots -->
        <div v-if="cell.items.length" class="flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden="true">
          <span
            v-for="appt in cell.items.slice(0, 4)"
            :key="appt.id"
            :class="statusClass(appt.status)"
            class="size-1.5 rounded-full bg-(--status-dot)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

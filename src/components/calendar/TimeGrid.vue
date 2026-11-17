<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatHour, formatTime, formatWeekday, isToday, toDateKey } from '@/utils/date';
import { statusClass } from '@/constants/status';

/**
 * Week / day time grid. Appointments have a start time but no duration in the
 * backend, so each one is drawn as a 30-minute block; overlapping blocks are
 * laid out side by side.
 */
const props = defineProps({
  days: { type: Array, required: true }, // Date[]
  byDay: { type: Map, required: true },
  selectedKey: { type: String, required: true },
});
const emit = defineEmits(['open', 'create', 'select']);

const HOUR_HEIGHT = 56; // px
const BLOCK_MINUTES = 30;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const scroller = ref(null);
const now = ref(new Date());
let timer = null;

/** Assigns side-by-side columns to overlapping appointments within one day. */
function layoutDay(items) {
  const events = items
    .map((appt) => {
      const d = new Date(appt.dateTime);
      const start = d.getHours() * 60 + d.getMinutes();
      return { appt, start, end: start + BLOCK_MINUTES, col: 0, cols: 1 };
    })
    .sort((a, b) => a.start - b.start);

  let cluster = [];
  let columns = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const e of cluster) e.cols = columns.length;
    cluster = [];
    columns = [];
  };

  for (const event of events) {
    if (event.start >= clusterEnd) flush();
    let col = columns.findIndex((end) => end <= event.start);
    if (col === -1) {
      col = columns.length;
      columns.push(event.end);
    } else {
      columns[col] = event.end;
    }
    event.col = col;
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.end);
  }
  flush();
  return events;
}

const columns = computed(() =>
  props.days.map((date) => {
    const key = toDateKey(date);
    return { date, key, today: isToday(date), events: layoutDay(props.byDay.get(key) || []) };
  })
);

const nowTop = computed(() => ((now.value.getHours() * 60 + now.value.getMinutes()) / 60) * HOUR_HEIGHT);

function createAt(date, event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const minutes = Math.floor(((event.clientY - rect.top) / HOUR_HEIGHT) * 60);
  const snapped = Math.min(23 * 60 + 30, Math.max(0, Math.floor(minutes / 30) * 30));
  const time = `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;
  emit('create', { date: toDateKey(date), time });
}

/** Scroll to the first appointment of the visible days, else to 8 AM. */
function scrollToRelevantTime() {
  if (!scroller.value) return;
  const starts = columns.value.flatMap((c) => c.events.map((e) => e.start));
  const minutes = starts.length ? Math.max(0, Math.min(...starts) - 60) : 8 * 60;
  scroller.value.scrollTop = (minutes / 60) * HOUR_HEIGHT;
}

// Re-scroll once per visible range, after its data arrives (not on every refresh).
const daysKey = computed(() => props.days.map(toDateKey).join());
let scrolledFor = '';
watch(
  () => props.byDay,
  () => {
    if (scrolledFor === daysKey.value) return;
    scrolledFor = daysKey.value;
    nextTick(scrollToRelevantTime);
  }
);

onMounted(() => {
  scrollToRelevantTime();
  timer = setInterval(() => (now.value = new Date()), 60_000);
});
onBeforeUnmount(() => clearInterval(timer));

defineExpose({ scrollToRelevantTime });
</script>

<template>
  <div class="flex h-full flex-col overflow-x-auto">
    <div :class="days.length > 1 ? 'min-w-160' : ''" class="flex h-full flex-col">
      <!-- Day headers -->
      <div class="flex border-b border-base-300">
        <div class="w-14 shrink-0" />
        <button
          v-for="col in columns"
          :key="col.key"
          type="button"
          class="flex flex-1 flex-col items-center gap-0.5 py-2 transition hover:bg-base-200/60"
          :aria-pressed="col.key === selectedKey"
          @click="emit('select', col.date)"
        >
          <span
            class="text-[11px] font-semibold uppercase tracking-wide"
            :class="col.today ? 'text-primary' : 'text-base-content/50'"
          >
            {{ formatWeekday(col.date) }}
          </span>
          <span
            class="grid size-8 place-items-center rounded-full text-base font-medium"
            :class="[
              col.today && 'bg-primary text-primary-content',
              !col.today && col.key === selectedKey && 'bg-primary/10 text-primary',
            ]"
          >
            {{ col.date.getDate() }}
          </span>
        </button>
      </div>

      <!-- Scrollable hours -->
      <div ref="scroller" class="relative flex-1 overflow-y-auto">
        <div class="relative flex" :style="{ height: `${HOUR_HEIGHT * 24}px` }">
          <!-- Hour labels -->
          <div class="relative w-14 shrink-0" aria-hidden="true">
            <div
              v-for="h in HOURS"
              :key="h"
              class="absolute right-2 -translate-y-1/2 text-[10px] text-base-content/45"
              :style="{ top: `${h * HOUR_HEIGHT}px` }"
            >
              {{ h === 0 ? '' : formatHour(h) }}
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="col in columns"
            :key="col.key"
            class="relative flex-1 cursor-pointer border-l border-base-300"
            :class="col.today && 'bg-primary/2.5'"
            :aria-label="`Create appointment on ${col.key}`"
            @click.self="createAt(col.date, $event)"
          >
            <div
              v-for="h in HOURS"
              :key="h"
              class="pointer-events-none absolute inset-x-0 border-t border-base-300/70"
              :style="{ top: `${h * HOUR_HEIGHT}px` }"
            />

            <button
              v-for="ev in col.events"
              :key="ev.appt.id"
              type="button"
              :class="statusClass(ev.appt.status)"
              class="absolute overflow-hidden rounded-md border-l-[3px] border-(--status-dot) bg-(--status-bg) px-1.5 text-left text-[11px] leading-3.5 text-(--status-text) shadow-sm ring-1 ring-base-100 transition hover:z-10 hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary"
              :style="{
                top: `${(ev.start / 60) * HOUR_HEIGHT + 1}px`,
                height: `${(BLOCK_MINUTES / 60) * HOUR_HEIGHT - 2}px`,
                left: `calc(${(ev.col / ev.cols) * 100}% + 2px)`,
                width: `calc(${100 / ev.cols}% - 4px)`,
              }"
              :title="`${formatTime(ev.appt.dateTime)} · ${ev.appt.customerName} — ${ev.appt.service} (${ev.appt.status})`"
              @click="emit('open', ev.appt)"
            >
              <span class="block truncate font-semibold" :class="ev.appt.status === 'Cancelled' && 'line-through opacity-70'">
                {{ ev.appt.customerName }}
              </span>
              <span class="block truncate opacity-80">{{ formatTime(ev.appt.dateTime) }} · {{ ev.appt.service }}</span>
            </button>

            <div
              v-if="col.today"
              class="pointer-events-none absolute inset-x-0 z-20 flex items-center"
              :style="{ top: `${nowTop}px` }"
              aria-hidden="true"
            >
              <span class="-ml-1 size-2 rounded-full bg-rose-500" />
              <span class="h-px flex-1 bg-rose-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './ui/AppIcon.vue';

defineProps({
  collapsed: { type: Boolean, default: false },
});
const emit = defineEmits(['navigate', 'toggle-collapse']);

const LINKS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/appointments', label: 'All Appointments', icon: 'list' },
];
</script>

<template>
  <aside
    class="flex h-full flex-col border-r border-base-300 bg-base-100 transition-[width] duration-200"
    :class="collapsed ? 'w-64 lg:w-[4.5rem]' : 'w-64'"
    aria-label="Main navigation"
  >
    <div class="flex h-16 items-center gap-3 px-4">
      <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-content">
        <AppIcon name="calendar" :size="18" />
      </div>
      <div class="min-w-0 leading-tight" :class="collapsed && 'lg:hidden'">
        <p class="truncate font-semibold">Appointments</p>
        <p class="truncate text-xs text-base-content/50">Manager</p>
      </div>
    </div>

    <nav class="flex-1 px-3 py-2">
      <ul class="space-y-1">
        <li v-for="link in LINKS" :key="link.to">
          <RouterLink
            v-slot="{ href, navigate, isExactActive }"
            :to="link.to"
            custom
          >
            <a
              :href="href"
              :title="collapsed ? link.label : undefined"
              :aria-current="isExactActive ? 'page' : undefined"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              :class="[
                isExactActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                collapsed && 'lg:justify-center lg:px-0',
              ]"
              @click="(e) => { navigate(e); emit('navigate'); }"
            >
              <AppIcon :name="link.icon" :size="18" />
              <span :class="collapsed && 'lg:sr-only'">{{ link.label }}</span>
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="hidden border-t border-base-300 p-3 lg:block">
      <button
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start gap-3 font-normal text-base-content/60"
        :class="collapsed && 'justify-center px-0'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="emit('toggle-collapse')"
      >
        <AppIcon name="panel-left" :size="18" />
        <span v-if="!collapsed">Collapse</span>
      </button>
    </div>
  </aside>
</template>

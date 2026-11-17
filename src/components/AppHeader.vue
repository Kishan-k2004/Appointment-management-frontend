<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppointmentStore } from '@/stores/appointmentStore';
import AppIcon from './ui/AppIcon.vue';

defineEmits(['open-menu']);

const route = useRoute();
const store = useAppointmentStore();
const title = computed(() => route.meta.title || 'Appointment Manager');
</script>

<template>
  <header
    class="sticky py-4 top-0 z-20 flex h-16 items-center gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur sm:px-6"
  >
    <button
      type="button"
      class="btn btn-ghost btn-sm btn-square lg:hidden"
      aria-label="Open navigation menu"
      @click="$emit('open-menu')"
    >
      <AppIcon name="menu" :size="20" />
    </button>
    <h1 class="truncate text-lg font-semibold tracking-tight">{{ title }}</h1>
    <button type="button" class="btn btn-primary btn-sm ml-auto gap-1.5" @click="store.openCreate()">
      <AppIcon name="plus" :size="16" />
      <span class="hidden sm:inline">Add appointment</span>
      <span class="sm:hidden">Add</span>
    </button>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import AppSidebar from '@/components/AppSidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import AppointmentModal from '@/components/AppointmentModal.vue';
import AppointmentDetails from '@/components/AppointmentDetails.vue';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';

const mobileOpen = ref(false);

// Desktop collapse preference is a per-browser convenience, safe to lose.
function readCollapsed() {
  try {
    return localStorage.getItem('sidebar-collapsed') === '1';
  } catch {
    return false;
  }
}
const collapsed = ref(readCollapsed());
watch(collapsed, (value) => {
  try {
    localStorage.setItem('sidebar-collapsed', value ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
});
</script>

<template>
  <div class="drawer lg:drawer-open h-full">
    <input id="app-drawer" v-model="mobileOpen" type="checkbox" class="drawer-toggle" aria-hidden="true" tabindex="-1" />

    <div class="drawer-content flex min-h-full min-w-0 flex-col">
      <AppHeader @open-menu="mobileOpen = true" />
      <main class="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
        <RouterView />
      </main>
    </div>

    <div class="drawer-side z-40">
      <label for="app-drawer" aria-label="Close navigation menu" class="drawer-overlay" />
      <AppSidebar
        :collapsed="collapsed"
        @navigate="mobileOpen = false"
        @toggle-collapse="collapsed = !collapsed"
      />
    </div>
  </div>

  <AppointmentModal />
  <AppointmentDetails />
  <ConfirmDeleteDialog />
  <ToastContainer />
</template>

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import * as service from '@/services/appointmentService';
import { useToast } from '@/composables/useToast';

/**
 * Shared UI state + mutations for appointments.
 *
 * The backend is the single source of truth: this store does not cache the
 * appointment list. Instead every successful mutation bumps `revision`, and the
 * dashboard, calendar and list views watch it to refetch exactly what they show.
 * The create/edit modal, details panel and delete dialog live here because they
 * can be opened from any page (header button, calendar, table).
 */
export const useAppointmentStore = defineStore('appointments', () => {
  const toast = useToast();

  const revision = ref(0);
  const bump = () => {
    revision.value += 1;
  };

  /* ------------------------------ Create / edit ----------------------------- */
  const form = reactive({ open: false, mode: 'create', appointment: null, preset: null });

  function openCreate(preset = null) {
    Object.assign(form, { open: true, mode: 'create', appointment: null, preset });
  }

  function openEdit(appointment) {
    Object.assign(form, { open: true, mode: 'edit', appointment, preset: null });
  }

  function closeForm() {
    form.open = false;
  }

  /** Throws ApiRequestError so the form can show field-level messages. */
  async function saveAppointment(payload) {
    const result =
      form.mode === 'edit'
        ? await service.updateAppointment(form.appointment.id, payload)
        : await service.createAppointment(payload);

    if (details.appointment?.id === result.appointment.id) details.appointment = result.appointment;
    toast.success(result.message);
    form.open = false;
    bump();
    return result.appointment;
  }

  /* --------------------------------- Details -------------------------------- */
  const details = reactive({ open: false, appointment: null });

  function openDetails(appointment) {
    details.appointment = appointment;
    details.open = true;
  }

  function closeDetails() {
    details.open = false;
  }

  /* ---------------------------------- Status -------------------------------- */
  const statusUpdating = ref(new Set());

  async function changeStatus(appointment, status) {
    if (appointment.status === status || statusUpdating.value.has(appointment.id)) return;
    statusUpdating.value = new Set(statusUpdating.value).add(appointment.id);
    try {
      const result = await service.updateAppointmentStatus(appointment.id, status);
      if (details.appointment?.id === appointment.id) details.appointment = result.appointment;
      toast.success(result.message);
      bump();
    } catch (error) {
      toast.error(error.message);
    } finally {
      const next = new Set(statusUpdating.value);
      next.delete(appointment.id);
      statusUpdating.value = next;
    }
  }

  /* ---------------------------------- Delete -------------------------------- */
  const deletion = reactive({ open: false, appointment: null, loading: false });

  function requestDelete(appointment) {
    Object.assign(deletion, { open: true, appointment, loading: false });
  }

  function cancelDelete() {
    if (!deletion.loading) deletion.open = false;
  }

  async function confirmDelete() {
    const target = deletion.appointment;
    if (!target) return;
    deletion.loading = true;
    try {
      const result = await service.deleteAppointment(target.id);
      if (details.appointment?.id === target.id) details.open = false;
      toast.success(result.message);
      deletion.open = false;
      bump();
    } catch (error) {
      toast.error(error.message);
    } finally {
      deletion.loading = false;
    }
  }

  return {
    revision,
    form,
    openCreate,
    openEdit,
    closeForm,
    saveAppointment,
    details,
    openDetails,
    closeDetails,
    statusUpdating,
    changeStatus,
    deletion,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
});

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { STATUSES } from '@/constants/status';
import { toDateKey, toIsoDateTime, toTimeValue } from '@/utils/date';
import { useToast } from '@/composables/useToast';
import BaseModal from './ui/BaseModal.vue';
import AppIcon from './ui/AppIcon.vue';

const store = useAppointmentStore();
const { form } = storeToRefs(store);
const toast = useToast();

const isEdit = computed(() => form.value.mode === 'edit');

const values = reactive({ customerName: '', service: '', date: '', time: '', status: 'Pending' });
const errors = reactive({});
const touched = reactive({});
const submitted = ref(false);
const saving = ref(false);
const formError = ref('');

function defaultTime() {
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return toTimeValue(next);
}

function reset() {
  const appt = form.value.appointment;
  const preset = form.value.preset || {};
  if (isEdit.value && appt) {
    const when = new Date(appt.dateTime);
    Object.assign(values, {
      customerName: appt.customerName,
      service: appt.service,
      date: toDateKey(when),
      time: toTimeValue(when),
      status: appt.status,
    });
  } else {
    Object.assign(values, {
      customerName: '',
      service: '',
      date: preset.date || toDateKey(new Date()),
      time: preset.time || defaultTime(),
      status: 'Pending',
    });
  }
  for (const key of Object.keys(errors)) delete errors[key];
  for (const key of Object.keys(touched)) delete touched[key];
  submitted.value = false;
  saving.value = false;
  formError.value = '';
}

watch(
  () => form.value.open,
  (open) => open && reset(),
  { immediate: true }
);

/** Mirrors the backend validators so most problems are caught before a request. */
function validateField(field) {
  const value = typeof values[field] === 'string' ? values[field].trim() : values[field];
  let message = '';
  if (field === 'customerName' || field === 'service') {
    const label = field === 'customerName' ? 'Customer name' : 'Service';
    if (!value) message = `${label} is required.`;
    else if (value.length < 2) message = `${label} must be at least 2 characters.`;
    else if (value.length > 100) message = `${label} must be at most 100 characters.`;
  } else if (field === 'date') {
    if (!value) message = 'Date is required.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00`).getTime()))
      message = 'Enter a valid date.';
  } else if (field === 'time') {
    if (!value) message = 'Time is required.';
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) message = 'Enter a valid time.';
  } else if (field === 'status' && !STATUSES.includes(value)) {
    message = 'Choose a valid status.';
  }
  if (message) errors[field] = message;
  else delete errors[field];
  return !message;
}

const FIELDS = computed(() => (isEdit.value ? ['customerName', 'service', 'date', 'time'] : ['customerName', 'service', 'date', 'time', 'status']));

function onBlur(field) {
  touched[field] = true;
  validateField(field);
}

function onInput(field) {
  if (touched[field] || submitted.value) validateField(field);
}

const showError = (field) => (touched[field] || submitted.value) && errors[field];

/** Backend field names -> form field names. */
const SERVER_FIELD_MAP = { customerName: 'customerName', service: 'service', dateTime: 'date', status: 'status' };

async function submit() {
  submitted.value = true;
  formError.value = '';
  const valid = FIELDS.value.map(validateField).every(Boolean);
  if (!valid) return;

  const payload = {
    customerName: values.customerName.trim(),
    service: values.service.trim(),
    dateTime: toIsoDateTime(values.date, values.time),
  };
  if (!isEdit.value) payload.status = values.status;

  saving.value = true;
  try {
    await store.saveAppointment(payload);
  } catch (error) {
    const fieldErrors = error.fieldErrors || {};
    let mapped = false;
    for (const [field, message] of Object.entries(fieldErrors)) {
      const target = SERVER_FIELD_MAP[field];
      if (target) {
        errors[target] = message;
        mapped = true;
      }
    }
    formError.value = mapped ? 'Please fix the highlighted fields.' : error.message;
    toast.error(error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :open="form.open" labelledby="appointment-form-title" :persistent="saving" @close="store.closeForm">
    <form novalidate @submit.prevent="submit">
      <header class="flex items-center justify-between border-b border-base-300 px-6 py-4">
        <h2 id="appointment-form-title" class="text-base font-semibold">
          {{ isEdit ? 'Edit appointment' : 'New appointment' }}
        </h2>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square"
          aria-label="Close"
          :disabled="saving"
          @click="store.closeForm"
        >
          <AppIcon name="x" />
        </button>
      </header>

      <div class="space-y-4 px-6 py-5">
        <div v-if="formError" role="alert" class="alert alert-soft alert-error py-2.5 text-sm">
          <AppIcon name="alert" :size="16" />
          <span>{{ formError }}</span>
        </div>

        <fieldset class="fieldset p-0">
          <label for="f-customer" class="fieldset-label text-sm font-medium text-base-content">
            Customer name <span class="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="f-customer"
            v-model="values.customerName"
            type="text"
            class="input w-full"
            :class="showError('customerName') && 'input-error'"
            placeholder="e.g. Priya Sharma"
            maxlength="100"
            autocomplete="off"
            required
            :aria-invalid="!!showError('customerName')"
            aria-describedby="f-customer-err"
            @blur="onBlur('customerName')"
            @input="onInput('customerName')"
          />
          <p id="f-customer-err" class="min-h-4 text-xs text-error">{{ showError('customerName') || '' }}</p>
        </fieldset>

        <fieldset class="fieldset p-0">
          <label for="f-service" class="fieldset-label text-sm font-medium text-base-content">
            Service <span class="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="f-service"
            v-model="values.service"
            type="text"
            class="input w-full"
            :class="showError('service') && 'input-error'"
            placeholder="e.g. Haircut, Consultation"
            maxlength="100"
            autocomplete="off"
            required
            :aria-invalid="!!showError('service')"
            aria-describedby="f-service-err"
            @blur="onBlur('service')"
            @input="onInput('service')"
          />
          <p id="f-service-err" class="min-h-4 text-xs text-error">{{ showError('service') || '' }}</p>
        </fieldset>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset p-0">
            <label for="f-date" class="fieldset-label text-sm font-medium text-base-content">
              Date <span class="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="f-date"
              v-model="values.date"
              type="date"
              class="input w-full"
              :class="showError('date') && 'input-error'"
              required
              :aria-invalid="!!showError('date')"
              aria-describedby="f-date-err"
              @blur="onBlur('date')"
              @input="onInput('date')"
            />
            <p id="f-date-err" class="min-h-4 text-xs text-error">{{ showError('date') || '' }}</p>
          </fieldset>

          <fieldset class="fieldset p-0">
            <label for="f-time" class="fieldset-label text-sm font-medium text-base-content">
              Time <span class="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="f-time"
              v-model="values.time"
              type="time"
              class="input w-full"
              :class="showError('time') && 'input-error'"
              required
              :aria-invalid="!!showError('time')"
              aria-describedby="f-time-err"
              @blur="onBlur('time')"
              @input="onInput('time')"
            />
            <p id="f-time-err" class="min-h-4 text-xs text-error">{{ showError('time') || '' }}</p>
          </fieldset>
        </div>

        <fieldset v-if="!isEdit" class="fieldset p-0">
          <label for="f-status" class="fieldset-label text-sm font-medium text-base-content">Status</label>
          <select
            id="f-status"
            v-model="values.status"
            class="select w-full"
            :class="showError('status') && 'select-error'"
            @change="onInput('status')"
          >
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
          <p class="min-h-4 text-xs text-error">{{ showError('status') || '' }}</p>
        </fieldset>
        <p v-else class="text-xs text-base-content/60">
          To change the status, use the status menu on the appointment.
        </p>

        <p class="text-xs text-base-content/50">
          Times are in your local timezone ({{ Intl.DateTimeFormat().resolvedOptions().timeZone }}).
        </p>
      </div>

      <footer class="flex justify-end gap-2 border-t border-base-300 bg-base-200/50 px-6 py-4">
        <button type="button" class="btn btn-ghost" :disabled="saving" @click="store.closeForm">Cancel</button>
        <button type="submit" class="btn btn-primary min-w-32" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create appointment' }}
        </button>
      </footer>
    </form>
  </BaseModal>
</template>

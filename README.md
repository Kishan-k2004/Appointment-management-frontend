# Appointment Manager — Frontend

A Google Calendar–style dashboard for the [Appointment Management API](https://github.com/Kishan-k2004/appintment-management) (Node.js · Express · MongoDB).

**Stack:** Vue 3 (Composition API, `<script setup>`) · Vite · Vue Router · Pinia · Tailwind CSS v4 · DaisyUI v5 · Axios

The calendar (month/week/day) is built in-house rather than with a calendar library. That keeps the bundle small (~76 kB gzipped JS) and gives full control over status colours, cross-month ranges and timezone handling.

---

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Total / Pending / Confirmed / Cancelled counts from the API (each card links to the filtered list), plus today's appointments and the next 7 days. |
| **Calendar** | Month (default), Week and Day views; previous / next / Today; colour-coded chips (Pending = amber, Confirmed = green, Cancelled = red, struck through); click a date to list its appointments in the side panel; click a chip to open details; click a day number to jump to Day view; click an empty slot in Week/Day to create an appointment at that time; status legend toggles; arrow-key navigation in Month view. |
| **All Appointments** | Table on desktop, cards on mobile. Customer-name search (debounced), status filter, single-date filter, start/end date range, clear filters, sort by date, server-side pagination with rows-per-page. Filters are kept in the URL, so they survive reloads and can be shared. |
| **Create / Edit** | Modal form with client-side validation that mirrors the backend rules (required, 2–100 chars), inline messages, server field errors mapped back onto the fields, saving state, and toasts. |
| **Status** | Every status badge is a dropdown that calls `PATCH /:id/status`. |
| **Delete** | Confirmation dialog, then `DELETE /:id`. |
| **States** | Skeleton loaders, empty states, error states with retry, toast notifications. |

After any create, edit, status change or delete, the dashboard, calendar and list all refetch from the backend, which is the only source of truth.

---

## Getting started

### Prerequisites

- Node.js **20.19+ or 22.12+** (required by Vite 8)
- A running backend: local or deployed

### 1. Install

```bash
npm install
```

### 2. Configure the API URL

```bash
cp .env.example .env
```

```dotenv
# Backend origin WITHOUT the trailing /api
VITE_API_BASE_URL=http://localhost:5000
# or the deployed API:
# VITE_API_BASE_URL=https://<your-service>.onrender.com
```

The URL is read in exactly one place, [src/services/api.js](src/services/api.js). Vite inlines `VITE_*` variables at **build time**, so restart `npm run dev` (or rebuild) after changing it.

> **CORS:** the backend only accepts origins listed in its `FRONTEND_URL` env var (comma-separated). Add `http://localhost:5173` for local development, and add your deployed frontend URL once it exists.

### 3. Run

```bash
npm run dev        # http://localhost:5173
```

### 4. Build and preview

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally on http://localhost:4173
```

---

## Project structure

```
src/
  assets/main.css                 Tailwind + DaisyUI theme, status colour tokens
  constants/status.js             Status list (mirrors the backend enum)
  utils/date.js                   Local-timezone date helpers, view ranges, formatters
  services/
    api.js                        Axios instance, base URL, error normalisation
    appointmentService.js         One function per endpoint + dashboard stats
  stores/appointmentStore.js      Pinia: shared modals + mutations + refresh signal
  composables/
    useRequest.js                 Loading/error state; aborts stale requests
    useToast.js                   Toast notifications
  components/
    AppSidebar.vue  AppHeader.vue
    AppointmentModal.vue          Create / edit form
    AppointmentDetails.vue        Details modal (status, edit, delete)
    ConfirmDeleteDialog.vue
    AppointmentTable.vue  AppointmentFilters.vue  AppointmentAgenda.vue
    StatusBadge.vue  StatusMenu.vue  SummaryCard.vue
    calendar/MonthGrid.vue        6-week month grid
    calendar/TimeGrid.vue         Week / day hour grid
    ui/                           AppIcon, BaseModal, EmptyState, ErrorState, PaginationBar, ToastContainer
  views/
    DashboardView.vue  CalendarView.vue  AppointmentsView.vue
  router/index.js
```

**Why Pinia:** the create/edit modal, details modal and delete dialog can be opened from any page (header, calendar, table, dashboard), and every page needs to know when data changed. The store holds that UI state and a `revision` counter that each view watches to refetch. It deliberately does **not** cache appointments.

---

## API integration

All endpoints are under `${VITE_API_BASE_URL}/api`.

| UI action | Request |
| --- | --- |
| List page (search, filters, pages) | `GET /appointments?search&status&date&startDate&endDate&page&limit&sortOrder` |
| Dashboard counts | `GET /appointments?limit=1` and `?status=<S>&limit=1` → reads `pagination.total` (the backend has no stats endpoint) |
| Calendar / dashboard upcoming | `GET /appointments/calendar?startDate&endDate` |
| Details refresh | `GET /appointments/:id` |
| Create | `POST /appointments` `{ customerName, service, dateTime, status }` |
| Edit | `PUT /appointments/:id` `{ customerName, service, dateTime }` |
| Change status | `PATCH /appointments/:id/status` `{ status }` |
| Delete | `DELETE /appointments/:id` |

**Response shapes used** (taken from the backend source):

- Success: `{ success, message, data, pagination?: { total, page, limit, totalPages }, meta? }`. `message` is shown in success toasts.
- Error: `{ success: false, message, errors: [{ field, message, location, value }] }`. `errors[].field` is mapped onto form fields (`dateTime` → the Date input).
- Appointment: `{ id, _id, customerName, service, dateTime, status, createdAt, updatedAt }`

### Timezones

The backend stores `dateTime` as a UTC instant and requires ISO strings **with** a timezone.

- **Writing:** the form's local date + time is converted with `new Date(y, m, d, hh, mm).toISOString()`.
- **Displaying:** always in the browser's local timezone (`Intl.DateTimeFormat`).
- **Calendar ranges:** sent as exact instants, from local midnight of the first visible day to 1 ms before local midnight after the last one. A month view always spans 6 full weeks, so appointments on the leading and trailing days of neighbouring months appear correctly. Because exact instants are sent, a range that crosses a daylight-saving change stays correct.
- **List `date` filter:** sent as `YYYY-MM-DD` plus `tzOffset` (the backend parameter) for that specific day.
- **List date range:** sent as exact instants, like the calendar.
- The backend rejects `date` combined with `startDate`/`endDate`, so the UI clears one when you set the other.

---

## Deployment

The frontend is a static SPA. Set `VITE_API_BASE_URL` in the host's environment **before building**, and configure a rewrite so deep links such as `/calendar` serve `index.html`.

### Render (Static Site)

1. New → **Static Site** → connect this repository.
2. Build command: `npm ci && npm run build`. Publish directory: `dist`.
3. Environment: `VITE_API_BASE_URL=https://<your-api>.onrender.com`.
4. Redirects/Rewrites: add a **Rewrite** from `/*` to `/index.html`.
5. In the **backend** service, add the new site URL to `FRONTEND_URL` and redeploy it.

### Netlify

Build command `npm run build`, publish directory `dist`, and set `VITE_API_BASE_URL`. SPA routing is handled by [public/_redirects](public/_redirects).

### Vercel

Framework preset **Vite**; set `VITE_API_BASE_URL`. SPA routing is handled by [vercel.json](vercel.json).

> Render's free backend sleeps when idle, so the first request can take ~50 s. The Axios timeout is 60 s, and loading states stay visible meanwhile.

---

## Testing checklist

**Dashboard**
- [ ] The four counts match the database; clicking a card opens the list filtered by that status.
- [ ] Creating, deleting or changing a status updates the counts without a page reload.

**Calendar**
- [ ] Month view loads by default with today highlighted; Prev / Next / Today work.
- [ ] Week and Day views show appointments at the correct local times; overlapping ones sit side by side.
- [ ] Leading/trailing days from adjacent months show their appointments (e.g. Oct 31 / Dec 1 in the November grid).
- [ ] Clicking a date lists its appointments in the side panel; clicking a chip opens details.
- [ ] The legend toggles hide and show statuses.
- [ ] Clicking an empty Week/Day slot opens the form pre-filled with that date and time.

**All Appointments**
- [ ] Search is case-insensitive and partial; it combines with status, date and range filters.
- [ ] Setting a date clears the range and vice versa; an inverted range shows a validation message.
- [ ] Clear resets everything; pagination and rows-per-page work; filters persist after a reload.

**CRUD**
- [ ] Submitting an empty form shows inline errors and sends no request.
- [ ] Create, edit, status change and delete each show a toast and refresh the calendar and list.
- [ ] Deleting the last item on a page moves back one page.
- [ ] The edit form shows the same local date/time the calendar shows.

**States and responsiveness**
- [ ] Stopping the backend shows error states with Retry and an error toast on mutations.
- [ ] At 390 px wide: the drawer sidebar works, the list shows cards, the calendar shows dots, and there is no horizontal page scroll.
- [ ] Modals close with Esc and keep focus inside while open.

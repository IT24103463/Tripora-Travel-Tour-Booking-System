# Admin Telemetry Synchronization Design

## Goal

The three Executive Command Pulse cards in `Frontend/src/pages/admin/AdminDashboard.jsx` must reflect database changes within the next completed poll and immediately after a successful mutation performed in an admin management module.

## Scope

The synchronization path has three layers:

1. The dashboard polls metric endpoints safely and without cached responses.
2. Management modules notify the dashboard after successful local mutations.
3. Backend metric endpoints query the database directly and prohibit response caching.

This design does not add a global React context, WebSocket transport, or landing-page telemetry.

## Dashboard Polling

`AdminDashboard` owns one telemetry refresh operation and one timeout reference. The operation prevents concurrent batches with an in-flight reference, starts all three metric requests with `Promise.allSettled`, applies successful results independently, and always clears the syncing state in `finally`.

The request configuration used for every metric request is:

```js
const requestConfig = {
  params: { _t: Date.now() },
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
};
```

After a refresh settles, a recursive `setTimeout` schedules the next poll for six seconds later. It never schedules while another timeout exists or after component unmount. Manual refresh, page visibility restoration, and mutation events cancel a pending timeout and invoke the same single refresh operation. This guarantees no interval drift or overlapping request batches.

The cards retain the existing metric state names:

- `confirmedExpeditions`
- `activeOffers`
- `openInquiries`

A failed endpoint leaves that metric's most recently known value intact while results from the other endpoints are applied.

## Management-Module Notifications

`CrudModule` dispatches `window` event `tripora:sync-telemetry` only after a successful create, update, deactivate, or delete operation. `InquiriesModule` dispatches the same event after a successful status update or deletion.

`AdminDashboard` has the sole event listener. It calls the shared manual-refresh function, which clears any pending timer, respects the in-flight guard, and resumes recursive scheduling after the current batch completes. Module requests do not need knowledge of count endpoints or local metric state.

## Backend Metric Endpoints

The following admin-authorized endpoints remain the telemetry source of truth:

- `GET /api/bookings/metrics/confirmed-count`
- `GET /api/offers/metrics/active-count`
- `GET /api/inquiries/metrics/open-count`

Each action uses an `AsNoTracking()` database count query and returns `{ count }`. Each action has `[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]` and sends `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, and `Expires: 0` headers.

Counts match the dashboard's labels: booking status `Confirmed`, offer `IsActive`, and inquiry status `UNREAD`.

## Tests

Frontend tests mock the API client and prove:

1. The initial batch requests each metric endpoint with the exact cache-busting params and headers, then renders returned counts.
2. Dispatching `tripora:sync-telemetry` starts a refresh using the same shared operation.
3. A pending poll does not create an overlapping request batch; the next timeout is scheduled only after settlement.
4. Existing manual refresh and management mutation behavior remain intact.

Backend controller tests seed in-memory databases and prove each count endpoint returns its expected count and no-cache headers.

## Error Handling and Lifecycle

The timer and event listeners are removed on unmount. State is not updated after unmount. An individual request failure does not reset other metric values, and a failed batch still restores the UI from its syncing state and schedules a later retry.

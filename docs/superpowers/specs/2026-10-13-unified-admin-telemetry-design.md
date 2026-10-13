# Unified Admin Telemetry Design

## Purpose

The Tripora admin landing page and dashboard overview must display the same live values for confirmed expeditions, active offers, and concierge inquiries. A single telemetry provider will be the in-memory source of truth for both pages during an admin session.

## Scope

- Add `Frontend/src/context/TelemetryContext.jsx`.
- Share live telemetry between `/admin` and `/admin/dashboard`.
- Retain the existing three metric endpoints and mutation event name.
- Replace the landing page's hard-coded metric values and the dashboard's local telemetry state.
- Add focused tests for shared fetching and rendering.

No backend contract, visual card design, or non-admin route behavior changes are included.

## Context Interface

`TelemetryProvider` owns the following state:

```js
const [metrics, setMetrics] = useState({
  confirmedExpeditions: 0,
  activeOffers: 0,
  conciergeInquiries: 0,
});
const [isSyncing, setIsSyncing] = useState(false);
const [lastSync, setLastSync] = useState(null);
```

`useTelemetry()` returns these values plus `refreshTelemetry()`. Calling `useTelemetry()` outside the provider will throw a clear error, preventing silent local-state fallbacks.

The provider also owns an internal in-flight guard and one polling timer. Those implementation details are not part of the consumer interface.

## Data Flow

The provider fetches the existing endpoints concurrently with cache-busting headers:

1. `/bookings/metrics/confirmed-count`
2. `/offers/metrics/active-count`
3. `/inquiries/metrics/open-count`

It accepts the present API count formats (`count`, `total`, numeric payload, or arrays), including the existing array fallback calculations. A successful endpoint updates only its corresponding metric. If one request fails, the provider retains the previous value for that metric while applying successful results from the other endpoints.

After every completed refresh attempt, `isSyncing` becomes false and `lastSync` is updated. A refresh is started on provider mount, on the existing six-second polling interval, when the document becomes visible, and when `window` receives `tripora:sync-telemetry`. Concurrent refresh attempts are coalesced into the active request.

## Provider Placement

`App.jsx` wraps both authenticated admin route elements in the same `TelemetryProvider` instance. The provider stays mounted while navigating between `/admin` and `/admin/dashboard`, so both card collections observe the same state rather than reinitializing independent copies.

The provider is restricted to authenticated admin routes; public and customer routes do not fetch admin telemetry.

## Consumer Changes

`AdminLanding` reads `metrics` from `useTelemetry()` and renders:

- `confirmedExpeditions`
- `activeOffers`
- `conciergeInquiries`

Its existing metric-card navigation and visual status labels remain unchanged.

`AdminDashboard` removes its local metrics, syncing, polling, and telemetry-event wiring. Its overview cards, side-rail sync state, live indicator, and refresh button read from `useTelemetry()`. It changes the inquiry display from the local `openInquiries` name to `metrics.conciergeInquiries`.

Existing CRUD and inquiry mutation code may continue to dispatch `tripora:sync-telemetry`; the provider becomes the single listener and calls `refreshTelemetry()`.

## Error Handling and Lifecycle

Failures never replace a known metric with zero. The provider clears its timer and event listeners on unmount and prevents state updates after unmount. Repeated manual refreshes while a fetch is active do not launch overlapping requests.

## Testing

Add tests that mock the API client and verify:

1. The provider fetches all three metrics and exposes normalized values.
2. A `tripora:sync-telemetry` event refreshes the shared state.
3. Landing and dashboard card consumers render values from the same provider state.
4. Existing admin navigation and dashboard refresh interactions remain functional.

The frontend build and relevant Vitest test files must pass before completion.

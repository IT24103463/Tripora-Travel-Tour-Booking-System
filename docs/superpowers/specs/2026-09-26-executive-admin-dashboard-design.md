# Executive Admin Dashboard Design

## Purpose

Replace the legacy admin dashboard at `/admin/dashboard` with a modular executive command center. The dashboard is for authenticated Tripora staff who need a concise operational view of bookings, inventory, offers, and concierge inquiries. The admin landing gateway at `/admin` remains the only intended entry point; the dashboard is reached through its explicit action.

## Scope

This delivery establishes the command-center shell, consistent visual system, live operational views, and lightweight status controls. It does not add new create/edit modal workflows. Existing management screens and APIs are not removed.

## File Structure

```
Frontend/src/pages/admin/
  AdminDashboard.jsx
  AdminDashboard.css
  components/
    Sidebar.jsx
    Header.jsx
  tabs/
    OverviewTab.jsx
    ToursTab.jsx
    PackagesTab.jsx
    HotelsTab.jsx
    OffersTab.jsx
    BookingsTab.jsx
    InquiriesTab.jsx
```

`App.jsx` will import the new dashboard component for `/admin/dashboard`. The current legacy dashboard files remain untouched until the route replacement is verified, avoiding changes to unrelated work in the repository.

## Shell and Navigation

`AdminDashboard` owns only tab selection and the live console clock. It composes the fixed background canvas, `Sidebar`, `Header`, and the selected tab. `Sidebar` receives the active tab and a callback; it uses `navigate('/admin')` for brand and exit actions. `Header` receives the active tab label, clock, and booking action callback. Neither component fetches data or mutates inventory.

Navigation contains these modules: Executive Overview, Booking Ledger, Curated Tours, Travel Packages, Hotels & Stays, Special Offers, and Concierge Inbox. The quick reservation action switches to Booking Ledger. Special Offers uses the gold accent; booking and inbox labels carry their Live and IMAP badges.

## Data Boundaries

Each tab owns its data lifecycle: initial loading state, request error, empty state, and success rendering. Requests use `API_BASE_URL` from `Frontend/src/apiConfig.js`.

| Tab | Data source | Delivery interaction |
| --- | --- | --- |
| Overview | Tours, hotels, bookings, packages/offers where available | Read-only KPIs and activity summary |
| Curated Tours | `/api/tours` | Live inventory table and visibility/status display |
| Travel Packages | `/api/travel-packages` | Live package cards/table, with unavailable state if API is absent |
| Hotels & Stays | `/api/hotels?includeInactive=true` | Live availability/status display |
| Special Offers | `/api/offers` | Offer status and `isExclusive`/VIP gating indicator |
| Booking Ledger | `/api/bookings` | Guest reservation table and status filtering |
| Concierge Inbox | Existing inbox endpoint if present; otherwise explicit IMAP-unavailable state | Read-only feed and operational availability state |

The tabs normalize safely across existing DTO field variants and must not silently invent records. When an optional endpoint is unavailable, the tab displays a clear empty/unavailable panel rather than mock data. Existing API mutation actions remain outside this redesign.

## Visual System

The full viewport uses `/images/admin-bg.jpg` behind a fixed obsidian scrim. The image uses `object-fit: cover`; the scrim blends `rgba(5, 8, 12, 0.88)` into `#05080c`, with a subtle two-pixel backdrop blur. The dashboard has a faint grid layer above the scrim and below all UI.

CSS custom properties centralize the palette: base `#05080c`, glass `rgba(9, 14, 21, 0.75)`, teal `#2dd4bf`, gold `#fbbf24`, confirmed `#10b981`, pending `#f59e0b`, and alert `#ef4444`. Cards use the specified low-contrast white border. Typography is Inter/system sans-serif only; operational labels are small uppercase with wide tracking. No serif declaration is permitted in the dashboard module.

Desktop uses a fixed sidebar and scrollable workspace. Tablet compresses spacing and the telemetry grid. Mobile converts the sidebar into a compact horizontal navigation and keeps the content fully scrollable without fixed-background jank.

## Error Handling and Accessibility

Loading views use non-jarring glass skeletons. Errors identify the unavailable data domain and include a retry action. Empty views explain the absence of records. Interactive buttons have accessible names, the active navigation item exposes state, tables retain headers, and status colors are paired with text.

## Verification

Tests cover dashboard routing, tab changes, gateway exit navigation, and exclusive-offer rendering. The production build must pass. The full frontend suite will be run; unrelated existing failures will be reported separately.

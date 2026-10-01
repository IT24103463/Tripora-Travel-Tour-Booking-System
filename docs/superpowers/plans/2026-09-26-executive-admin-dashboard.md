# Executive Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a modular, live-data executive dashboard at `/admin/dashboard` that uses Tripora’s obsidian-glass visual system and makes `/admin` the only gateway entry point.

**Architecture:** A new `pages/admin` feature module owns the dashboard shell, its visual tokens, and the selected tab. The shell passes navigation state to presentational sidebar/header components; each tab independently loads and presents one administrative domain through a shared response-normalizing API helper. The legacy dashboard remains in place until the route import changes to the new module.

**Tech Stack:** React 19, React Router, CSS, Vitest, Testing Library, existing REST APIs through `API_BASE_URL`.

**Spec:** `docs/superpowers/specs/2026-09-26-executive-admin-dashboard-design.md`

## Global Constraints

- Use `/images/admin-bg.jpg` with an obsidian scrim from `rgba(5, 8, 12, 0.88)` to `#05080c` and a two-pixel blur.
- Use only sans-serif typography in the dashboard module; metadata uses uppercase wide tracking.
- Use glass surfaces `rgba(9, 14, 21, 0.75)` with `1px solid rgba(255, 255, 255, 0.08)` borders.
- Use `#2dd4bf` for primary action, `#fbbf24` for exclusive/VIP offers, and the specified green/amber/red status palette.
- Keep `/admin/dashboard` read/control-oriented; do not add create/edit modal workflows in this delivery.
- Use `API_BASE_URL`; unavailable optional APIs show a transparent unavailable state, never fabricated records.

## Review Focus

- An admin deep-link to an unknown dashboard subpath must land at `/admin`, not render an operational tab; covered by Task 1.
- A failed or malformed API response must render its domain error state and retry control; covered by Task 2.
- Empty booking, inventory, and inquiry collections must render an explicit empty state instead of a blank table; covered by Tasks 3 and 4.
- A special offer with `isExclusive: true` must visibly carry the VIP/exclusive treatment without relying only on color; covered by Task 4.
- Narrow viewports must keep the navigation and tables usable without horizontal page overflow; covered by Task 5’s responsive assertions and manual viewport check.

---

### Task 1: Establish the Admin Feature Shell and Routing

**Files:**
- Create: `Frontend/src/pages/admin/AdminDashboard.jsx`
- Create: `Frontend/src/pages/admin/AdminDashboard.css`
- Create: `Frontend/src/pages/admin/components/Sidebar.jsx`
- Create: `Frontend/src/pages/admin/components/Header.jsx`
- Create: `Frontend/src/pages/admin/AdminDashboard.test.jsx`
- Modify: `Frontend/src/App.jsx`

**Interfaces:**
- Produces: `AdminDashboard()` as the default export; `Sidebar({ navItems, activeTab, onSelect, onExit })`; `Header({ activeLabel, currentTime, onNewReservation })`.
- Consumes: `navigate` from React Router and the existing `/admin` gateway route.

- [ ] **Step 1: Write failing shell tests**

Test that an authenticated admin at `/admin/dashboard` sees Executive Overview, switches to Booking Ledger when its navigation button is clicked, and activates Booking Ledger from “New Reservation.” Test that the exit action navigates to `/admin`.

- [ ] **Step 2: Run the shell test to verify it fails**

Run: `npx vitest run src/pages/admin/AdminDashboard.test.jsx`

Expected: FAIL because the new module and tab navigation do not exist.

- [ ] **Step 3: Implement the shell and route replacement**

Create `AdminDashboard` with `activeTab` defaulting to `overview`, a one-second clock initialized immediately, and the seven specified navigation items. Render the fixed image/scrim/grid layer, `Sidebar`, `Header`, and a dynamic tab region. Update `App.jsx` to import this component for `/admin/dashboard`; preserve the existing `/admin` gateway route and its guards.

- [ ] **Step 4: Run the shell test to verify it passes**

Run: `npx vitest run src/pages/admin/AdminDashboard.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the shell**

```bash
git add Frontend/src/App.jsx Frontend/src/pages/admin
git commit -m "feat: add executive admin dashboard shell"
```

### Task 2: Add Shared Live-Data Loading States

**Files:**
- Create: `Frontend/src/pages/admin/adminApi.js`
- Create: `Frontend/src/pages/admin/components/AsyncPanel.jsx`
- Create: `Frontend/src/pages/admin/adminApi.test.js`

**Interfaces:**
- Produces: `loadAdminCollection(path: string): Promise<Array<Record<string, unknown>>>`; `AsyncPanel({ state, onRetry, emptyCopy, children })`.
- Consumes: `API_BASE_URL` from `Frontend/src/apiConfig.js`.
- Used by: every tab in Tasks 3 and 4.

- [ ] **Step 1: Write failing API-state tests**

Mock `fetch` to prove `loadAdminCollection('/api/tours')` unwraps an array from either `data` or `data.data`; prove an unsuccessful response raises an error; render `AsyncPanel` to assert loading, error-with-retry, and empty states.

- [ ] **Step 2: Run the data-state tests to verify they fail**

Run: `npx vitest run src/pages/admin/adminApi.test.js`

Expected: FAIL because no shared loader or panel exists.

- [ ] **Step 3: Implement `loadAdminCollection` and `AsyncPanel`**

`loadAdminCollection` must call `${API_BASE_URL}${path}`, reject non-OK responses, accept array response bodies plus `data`/`data.data` arrays, and return an empty array for successful but empty payloads. `AsyncPanel` must provide accessible loading, unavailable/error, retry, and empty views using the glass-panel styles.

- [ ] **Step 4: Run the data-state tests to verify they pass**

Run: `npx vitest run src/pages/admin/adminApi.test.js`

Expected: PASS.

- [ ] **Step 5: Commit shared data support**

```bash
git add Frontend/src/pages/admin/adminApi.js Frontend/src/pages/admin/components/AsyncPanel.jsx Frontend/src/pages/admin/adminApi.test.js Frontend/src/pages/admin/AdminDashboard.css
git commit -m "feat: add admin data loading states"
```

### Task 3: Build Overview, Booking, Tour, and Hotel Tabs

**Files:**
- Create: `Frontend/src/pages/admin/tabs/OverviewTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/BookingsTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/ToursTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/HotelsTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/OperationsTabs.test.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.css`

**Interfaces:**
- Consumes: `loadAdminCollection`, `AsyncPanel`, and `OverviewTab({ onNavigate })`.
- Produces: tab components that fetch `/api/bookings`, `/api/tours`, and `/api/hotels?includeInactive=true`.

- [ ] **Step 1: Write failing operational-tab tests**

Mock the three endpoints and assert Overview shows operational KPIs and a recent-booking activity row; BookingsTab renders guest, reservation, amount, and text status; ToursTab and HotelsTab render inventory rows. Add the empty-bookings assertion from Review Focus.

- [ ] **Step 2: Run the operational-tab tests to verify they fail**

Run: `npx vitest run src/pages/admin/tabs/OperationsTabs.test.jsx`

Expected: FAIL because the tab components do not exist.

- [ ] **Step 3: Implement the four operational tabs**

Normalize DTO variants only at render boundaries (for example `guestName`/`customerName`, `totalAmount`/`amount`, and `bookingStatus`/`status`). Overview derives counts and totals from live collections and sends “View ledger” to `onNavigate('bookings')`. Booking statuses render text plus confirmed, pending, or cancelled badges. Tours and hotels render status/availability as read-only controls.

- [ ] **Step 4: Run the operational-tab tests to verify they pass**

Run: `npx vitest run src/pages/admin/tabs/OperationsTabs.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit operational tabs**

```bash
git add Frontend/src/pages/admin/tabs/OverviewTab.jsx Frontend/src/pages/admin/tabs/BookingsTab.jsx Frontend/src/pages/admin/tabs/ToursTab.jsx Frontend/src/pages/admin/tabs/HotelsTab.jsx Frontend/src/pages/admin/tabs/OperationsTabs.test.jsx Frontend/src/pages/admin/AdminDashboard.jsx Frontend/src/pages/admin/AdminDashboard.css
git commit -m "feat: add admin operational tabs"
```

### Task 4: Build Packages, Offers, and Concierge Tabs

**Files:**
- Create: `Frontend/src/pages/admin/tabs/PackagesTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/OffersTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/InquiriesTab.jsx`
- Create: `Frontend/src/pages/admin/tabs/CommercialTabs.test.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.css`

**Interfaces:**
- Consumes: `loadAdminCollection` and `AsyncPanel`.
- Produces: read-only live views for `/api/travel-packages`, `/api/offers`, and `/api/inquiries`.

- [ ] **Step 1: Write failing commercial-tab tests**

Mock package, offer, and inquiry responses. Assert a package’s destination and duration appear; assert an offer with `isExclusive: true` contains a visible “Exclusive” badge; assert an unavailable inquiries endpoint renders the IMAP-unavailable state rather than rows.

- [ ] **Step 2: Run the commercial-tab tests to verify they fail**

Run: `npx vitest run src/pages/admin/tabs/CommercialTabs.test.jsx`

Expected: FAIL because the commercial tab components do not exist.

- [ ] **Step 3: Implement the three commercial tabs**

Render packages as compact inventory cards, offers as promotion cards with gold “Exclusive” text for `isExclusive`, and inquiry rows with sender, subject, timestamp, and unread/handled text state. If the inquiries API is unavailable, preserve the explicit IMAP-unavailable state from `AsyncPanel`.

- [ ] **Step 4: Run the commercial-tab tests to verify they pass**

Run: `npx vitest run src/pages/admin/tabs/CommercialTabs.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit commercial tabs**

```bash
git add Frontend/src/pages/admin/tabs/PackagesTab.jsx Frontend/src/pages/admin/tabs/OffersTab.jsx Frontend/src/pages/admin/tabs/InquiriesTab.jsx Frontend/src/pages/admin/tabs/CommercialTabs.test.jsx Frontend/src/pages/admin/AdminDashboard.jsx Frontend/src/pages/admin/AdminDashboard.css
git commit -m "feat: add admin commercial tabs"
```

### Task 5: Complete Responsive Obsidian Theme and Regression Coverage

**Files:**
- Modify: `Frontend/src/pages/admin/AdminDashboard.css`
- Modify: `Frontend/src/pages/admin/AdminDashboard.test.jsx`
- Modify: `Frontend/src/App.loginRedirect.test.jsx`

**Interfaces:**
- Consumes: completed shell and tabs from Tasks 1–4.
- Produces: final responsive visual contract and route regression coverage.

- [ ] **Step 1: Write failing final-regression tests**

Assert the dashboard background image has the `/images/admin-bg.jpg` source, the primary dashboard uses no serif-font declaration, and the existing authenticated-admin fallback test still returns to the `/admin` gateway instead of rendering the dashboard.

- [ ] **Step 2: Run the final-regression tests to verify they fail**

Run: `npx vitest run src/pages/admin/AdminDashboard.test.jsx src/App.loginRedirect.test.jsx`

Expected: FAIL until background markup/styles and final accessibility hooks are complete.

- [ ] **Step 3: Finish CSS tokens, desktop/tablet/mobile layouts, and accessibility hooks**

Apply fixed image, scrim, grid, glass, palette, status, and responsive rules from the spec. At `max-width: 768px`, convert the sidebar to compact navigation and make workspace tables horizontally scroll within their panel, not the page. Do a manual browser check at desktop, tablet, and 375px mobile widths.

- [ ] **Step 4: Run regression tests and production build**

Run: `npx vitest run src/pages/admin/AdminDashboard.test.jsx src/App.loginRedirect.test.jsx && npm run build`

Expected: PASS and a successful Vite build.

- [ ] **Step 5: Run the full suite and commit the completed redesign**

Run: `npx vitest run`

Expected: Record any unrelated existing failures by file and cause.

```bash
git add Frontend/src/pages/admin Frontend/src/App.jsx Frontend/src/App.loginRedirect.test.jsx
git commit -m "feat: redesign executive admin dashboard"
```

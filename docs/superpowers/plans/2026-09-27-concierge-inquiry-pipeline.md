# Direct Concierge Inquiry Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the customer `mailto:` concierge workflow with persistent inquiries that administrators can inspect and act on inside the dashboard.

**Architecture:** DestinationService owns the `inquiries` table, entity configuration, and REST controller. The API gateway forwards the new route to DestinationService. Contact uses the shared Axios client for anonymous submission, while a dedicated admin module uses the same client for authenticated listing and staff actions.

**Tech Stack:** ASP.NET Core 10, EF Core/MySQL migrations, YARP API gateway, React 19, React Router, Axios, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-concierge-inquiry-pipeline-design.md`

## Global Constraints

- Store inquiries in `Tripora.DestinationService` using the lowercase `inquiries` table and an auto-increment `int` ID.
- Accept public submissions without authentication; protect list, status update, and deletion with the Admin JWT role.
- Only `UNREAD` and `RESOLVED` are valid persisted statuses; default to `UNREAD`.
- The customer form sends only `name`, `phoneNumber`, `reason`, and `message`; do not retain `mailto:` dispatch.
- Use the existing shared Axios client; its base URL already includes `/api`, so call `/inquiries` rather than `/api/inquiries`.
- Preserve the crystalline dashboard visual system and provide loading, error, and empty states.

## Review Focus

- Empty/whitespace-only public fields return 400 and do not create an inquiry; cover in Task 1 controller tests.
- A non-admin JWT cannot list, resolve, or delete inquiries; cover the authorization metadata/endpoint behavior in Task 1 tests.
- Unknown status values do not overwrite an existing inquiry; cover in Task 1 tests.
- A network failure in the contact form preserves entered data and shows an error; cover in Task 3 tests.
- Phone values containing `+`, spaces, and punctuation create safe `tel:` and digits-only WhatsApp URLs; cover in Task 4 tests.

---

## File Structure

- `Backend/Services/Tripora.DestinationService/Models/Inquiry.cs` — persisted inquiry entity.
- `Backend/Services/Tripora.DestinationService/DTOs/InquiryRequestDto.cs` — public create payload and status-update payload.
- `Backend/Services/Tripora.DestinationService/DTOs/InquiryResponseDto.cs` — stable JSON returned to public/admin callers.
- `Backend/Services/Tripora.DestinationService/Controllers/InquiriesController.cs` — public submission and protected staff endpoints.
- `Backend/Services/Tripora.DestinationService/Data/DestinationDbContext.cs` — `DbSet` and mapping/index configuration.
- `Backend/Services/Tripora.DestinationService/Migrations/<timestamp>_AddInquiries.cs` and snapshot — database schema migration.
- `Backend/ApiGateway/appsettings.json` — `/api/inquiries` base and catch-all destination routes.
- `Frontend/src/pages/Contact.jsx` and `Contact.css` — direct four-field submission form and feedback states.
- `Frontend/src/pages/admin/components/InquiriesModule.jsx` — dedicated concierge ledger and staff actions.
- `Frontend/src/pages/admin/AdminDashboard.jsx` and `AdminDashboard.css` — mount desk module and calculate unread overview metric.
- `Frontend/src/pages/Contact.test.jsx`, `Frontend/src/pages/admin/components/InquiriesModule.test.jsx`, and `Frontend/src/pages/admin/AdminDashboard.live-data.test.jsx` — frontend behavior coverage.
- `Backend/Services/Tripora.DestinationService.Tests/*` — controller tests if no existing DestinationService test project is available.

### Task 1: Persist and expose concierge inquiries in DestinationService

**Files:**
- Create: `Backend/Services/Tripora.DestinationService/Models/Inquiry.cs`
- Create: `Backend/Services/Tripora.DestinationService/DTOs/InquiryRequestDto.cs`
- Create: `Backend/Services/Tripora.DestinationService/DTOs/InquiryResponseDto.cs`
- Create: `Backend/Services/Tripora.DestinationService/Controllers/InquiriesController.cs`
- Modify: `Backend/Services/Tripora.DestinationService/Data/DestinationDbContext.cs`
- Create: `Backend/Services/Tripora.DestinationService.Tests/Tripora.DestinationService.Tests.csproj`
- Create: `Backend/Services/Tripora.DestinationService.Tests/InquiriesControllerTests.cs`

**Interfaces:**
- Consumes: `DestinationDbContext`, ASP.NET Core authorization, existing DestinationService JWT configuration.
- Produces: `POST /api/inquiries`, `GET /api/inquiries`, `PATCH /api/inquiries/{id}/status`, and `DELETE /api/inquiries/{id}`.

- [ ] **Step 1: Write failing controller tests for creation, ordered listing, invalid status rejection, and deletion**

Create in-memory-context tests for these outcomes:

```csharp
[Fact]
public async Task Create_returns_created_inquiry_with_unread_status()
{
    var result = await controller.Create(new InquiryRequestDto
    {
        Name = "Asha Perera", PhoneNumber = "+94 77 123 4567",
        Reason = "Private safari", Message = "Please call after 5 PM."
    });
    // Assert CreatedAtActionResult and response.Status == "UNREAD".
}

[Fact]
public async Task UpdateStatus_rejects_unknown_status_without_changing_record();
[Fact]
public async Task GetAll_returns_newest_first();
[Fact]
public async Task Delete_returns_no_content_for_existing_inquiry();
```

Also add tests for whitespace required fields and admin authorization requirements using the controller/action metadata or an integration host appropriate to the new test project.

- [ ] **Step 2: Run the new controller tests and verify they fail**

Run: `dotnet test Backend/Services/Tripora.DestinationService.Tests/Tripora.DestinationService.Tests.csproj --no-restore`

Expected: FAIL because the inquiry entity, DTOs, controller, and test host are absent.

- [ ] **Step 3: Implement entity, DTOs, DbContext mapping, and controller**

Implement these exact contracts:

```csharp
public sealed class InquiryRequestDto
{
    [Required, MaxLength(150)] public string Name { get; init; } = string.Empty;
    [Required, MaxLength(50)] public string PhoneNumber { get; init; } = string.Empty;
    [Required, MaxLength(100)] public string Reason { get; init; } = string.Empty;
    [Required] public string Message { get; init; } = string.Empty;
}

public sealed class InquiryStatusRequestDto
{
    [Required] public string Status { get; init; } = string.Empty;
}
```

`Inquiry` maps to `inquiries` with the spec's column names, `Status = "UNREAD"`, UTC `CreatedAt`, and `int` identity key. Configure `DbSet<Inquiry> Inquiries`, required/length fields, timestamp default, and a `(Status, CreatedAt)` index. `InquiriesController` maps entities to `InquiryResponseDto`; marks only `Create` `[AllowAnonymous]`, and applies `[Authorize(Roles = "Admin")]` to list, PATCH, and DELETE. Normalize/validate status with `StringComparer.OrdinalIgnoreCase`, persist uppercase values, return 400 for any value other than `UNREAD`/`RESOLVED`, return 404 for missing IDs, and return `CreatedAtAction` for posts.

- [ ] **Step 4: Run controller tests and verify they pass**

Run: `dotnet test Backend/Services/Tripora.DestinationService.Tests/Tripora.DestinationService.Tests.csproj --no-restore`

Expected: PASS.

- [ ] **Step 5: Commit the DestinationService inquiry API**

```bash
git add Backend/Services/Tripora.DestinationService
git commit -m "feat: add concierge inquiry API"
```

### Task 2: Add the inquiry schema migration and gateway route

**Files:**
- Create: `Backend/Services/Tripora.DestinationService/Migrations/<timestamp>_AddInquiries.cs`
- Modify: `Backend/Services/Tripora.DestinationService/Migrations/DestinationDbContextModelSnapshot.cs`
- Modify: `Backend/ApiGateway/appsettings.json`

**Interfaces:**
- Consumes: `DestinationDbContext.Inquiries` from Task 1.
- Produces: a deployable `inquiries` table and API-gateway forwarding for `/api/inquiries` and its subpaths.

- [ ] **Step 1: Write a migration/schema assertion test or scripted verification that expects the `inquiries` columns and `(status, created_at)` index**

Use the DestinationService test project to inspect EF model metadata for `Inquiry` table/column mapping and index names, including `Id` value generation.

- [ ] **Step 2: Run the schema test and verify it fails before the migration exists**

Run: `dotnet test Backend/Services/Tripora.DestinationService.Tests/Tripora.DestinationService.Tests.csproj --no-restore --filter InquirySchema`

Expected: FAIL because `Inquiry` model mapping/migration is incomplete.

- [ ] **Step 3: Generate the migration and add gateway base/catch-all routes**

From `Backend/Services/Tripora.DestinationService`, run EF migration generation using its existing design-time factory:

```bash
dotnet ef migrations add AddInquiries
```

Add `inquiry-route` matching `/api/inquiries/{**catch-all}` and `inquiry-base-route` matching `/api/inquiries`, both using `destination-cluster` and `AllowFrontend`.

- [ ] **Step 4: Verify the schema test and service build pass**

Run:

```bash
dotnet test Backend/Services/Tripora.DestinationService.Tests/Tripora.DestinationService.Tests.csproj --no-restore --filter InquirySchema
dotnet build Backend/Services/Tripora.DestinationService/Tripora.DestinationService.csproj --no-restore
```

Expected: PASS with the migration generated and compilation successful.

- [ ] **Step 5: Commit migration and gateway exposure**

```bash
git add Backend/Services/Tripora.DestinationService/Migrations Backend/ApiGateway/appsettings.json
git commit -m "feat: route concierge inquiries through gateway"
```

### Task 3: Replace contact email dispatch with direct inquiry submission

**Files:**
- Modify: `Frontend/src/pages/Contact.jsx`
- Modify: `Frontend/src/pages/Contact.css`
- Create: `Frontend/src/pages/Contact.test.jsx`

**Interfaces:**
- Consumes: `api.post('/inquiries', { name, phoneNumber, reason, message })` from Task 1.
- Produces: a public form with submitted, loading, and error states.

- [ ] **Step 1: Write failing contact-form tests**

Mock `../api/apiClient` and cover:

```jsx
it('posts only the four concierge fields and confirms successful submission', async () => {
  api.post.mockResolvedValue({ data: { id: 1, status: 'UNREAD' } });
  // Fill Name, Phone Number, Reason, Message and submit.
  expect(api.post).toHaveBeenCalledWith('/inquiries', {
    name: 'Asha Perera', phoneNumber: '+94 77 123 4567',
    reason: 'Private safari', message: 'Please call after 5 PM.'
  });
  expect(await screen.findByRole('status')).toHaveTextContent(/received/i);
});

it('preserves entered data and shows an error when submission fails', async () => {
  api.post.mockRejectedValue(new Error('offline'));
  // Assert form values remain and an alert is displayed.
});
```

Assert that Email, destination, month, guest, `mailto:`, and “Prepare inquiry” are absent.

- [ ] **Step 2: Run contact tests and verify they fail**

Run: `cd Frontend && npx vitest run src/pages/Contact.test.jsx`

Expected: FAIL because the page still builds a mail client URL and exposes obsolete fields.

- [ ] **Step 3: Refactor `Contact` to the four-field Axios form**

Replace `INITIAL_FORM` with `{ name: '', phoneNumber: '', reason: '', message: '' }`. Use the existing glass controls for Name, Phone Number, Reason (select with current journey reasons), and Message. Implement `handleSubmit` as an async method that posts to `/inquiries`, uses `submitting` to disable the submit button, clears only after success, and records a success or error message. Update labels/copy to say the inquiry is delivered to the concierge desk, not an email client. Remove unused triple-row styles and adapt responsive layout only as needed.

- [ ] **Step 4: Run contact tests and verify they pass**

Run: `cd Frontend && npx vitest run src/pages/Contact.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit direct contact submission**

```bash
git add Frontend/src/pages/Contact.jsx Frontend/src/pages/Contact.css Frontend/src/pages/Contact.test.jsx
git commit -m "feat: submit concierge inquiries directly"
```

### Task 4: Build the admin concierge desk and unread overview metric

**Files:**
- Create: `Frontend/src/pages/admin/components/InquiriesModule.jsx`
- Create: `Frontend/src/pages/admin/components/InquiriesModule.test.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `Frontend/src/pages/admin/AdminDashboard.css`
- Modify: `Frontend/src/pages/admin/AdminDashboard.live-data.test.jsx`

**Interfaces:**
- Consumes: `GET /inquiries`, `PATCH /inquiries/:id/status`, and `DELETE /inquiries/:id` from Task 1.
- Produces: a crystalline inquiry ledger, staff contact actions, and `openInquiriesCount` based on UNREAD records.

- [ ] **Step 1: Write failing desk and overview tests**

Mock the shared API client and add coverage for:

```jsx
it('shows unread inquiries with WhatsApp, phone, resolve, and delete actions', async () => {
  api.get.mockResolvedValue({ data: [{ id: 7, name: 'Asha', phoneNumber: '+94 77 123 4567', reason: 'Safari', message: 'Call me', status: 'UNREAD', createdAt: '2026-09-27T10:00:00Z' }] });
  // Assert tel:+94771234567 and https://wa.me/94771234567 links.
  // Click Resolve and assert api.patch('/inquiries/7/status', { status: 'RESOLVED' }).
});

it('requires confirmation before deleting an inquiry');
it('counts unread inquiries in the overview metric');
```

Also cover load failure and zero-inquiry empty state.

- [ ] **Step 2: Run desk tests and verify they fail**

Run:

```bash
cd Frontend
npx vitest run src/pages/admin/components/InquiriesModule.test.jsx src/pages/admin/AdminDashboard.live-data.test.jsx
```

Expected: FAIL because the inquiry navigation item is a placeholder and the overview hardcodes zero.

- [ ] **Step 3: Implement `InquiriesModule` and integrate it into the dashboard**

Implement `InquiriesModule()` with local `inquiries`, `loading`, `error`, `deleting`, and `updatingId` state. Fetch newest-first data from `/inquiries`; render the existing ledger/table visual classes plus specific inquiry status/action classes. Normalize a phone to digits for `tel:`/WhatsApp. The status button toggles between `UNREAD` and `RESOLVED` through PATCH and updates the matching local row only after the response succeeds. Deletion requires an existing-style confirmation dialog and removes the row after DELETE succeeds.

In `AdminDashboard`, import/render the module when `activeModule === 'inquiries'`; remove `inquiries` from the placeholder module list. Extend `fetchDashboardData` to request `/inquiries` alongside bookings/offers and set `openInquiriesCount` to the number whose status uppercases to `UNREAD`. Rename the nav label from “Concierge IMAP Desk” to “Concierge Desk”. Add compact crystalline CSS for status actions, contact action links, message preview, and error/empty states; do not alter the existing rail or card scale.

- [ ] **Step 4: Run desk and overview tests and verify they pass**

Run:

```bash
cd Frontend
npx vitest run src/pages/admin/components/InquiriesModule.test.jsx src/pages/admin/AdminDashboard.live-data.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Run the relevant frontend suite and production build**

Run:

```bash
cd Frontend
npx vitest run src/pages/Contact.test.jsx src/pages/admin
npm run build
```

Expected: all scoped inquiry tests PASS and the Vite build succeeds. Report existing unrelated test failures separately if the complete suite is also run.

- [ ] **Step 6: Commit the concierge desk**

```bash
git add Frontend/src/pages/admin Frontend/src/pages/Contact.jsx Frontend/src/pages/Contact.css
git commit -m "feat: add admin concierge inquiry desk"
```

## Self-Review

- Spec coverage: Tasks 1–2 cover persistence, API, CORS-compatible gateway routing, and migration; Task 3 covers the four-field public form; Task 4 covers the desk, direct contact, status, deletion, and overview count.
- Step scan: every task starts red, verifies failure, implements one coherent deliverable, and verifies green.
- Type consistency: frontend payload uses `name`, `phoneNumber`, `reason`, `message`; backend `InquiryRequestDto` uses the same fields. Staff status uses `{ status }` consistently.
- Review focus: each listed failure mode is assigned to a concrete test task.
- Proportion: the plan specifies interfaces and test behavior without reproducing full implementation bodies.

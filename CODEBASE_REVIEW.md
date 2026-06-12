# ShinyStar CRM — Codebase Review

_Date: June 12, 2026_

---

## 1. Project Overview

### Backend (`backend/`) — ASP.NET Core Web API, .NET 10

A 5-project Clean Architecture–style solution (`CRM.sln`):

| Project | Role |
| --- | --- |
| `CRM.API` | Web host. 8 controllers (`Programs`, `Participants`, `Staff`, `Attendance`, `Calendar`, `Tasks`, `Scripts`, `Health`), `Program.cs`, `DataSeeder.cs`, Swagger (Swashbuckle), CORS policy for the frontend. |
| `CRM.Application` | DTOs, service interfaces (`Interfaces/Services/`), service implementations (`Services/`), `IRepository<T>` / `IUnitOfWork` abstractions, DI registration. |
| `CRM.Domain` | 14 entities (`Participant`, `CrmProgram`, `StaffMember`, `Session`, `AttendanceRecord`, etc.), enums, `BaseEntity` (Id/CreatedAt/UpdatedAt). |
| `CRM.Persistence` | EF Core 9 + SQL Server. `AppDbContext`, per-entity `IEntityTypeConfiguration` classes, `GenericRepository<T>`, `UnitOfWork`, one `InitialCreate` migration. |
| `CRM.Infrastructure` | Empty placeholder (planned Blob Storage / Email). |

**Patterns:** layered/clean architecture, generic repository + unit of work, DTO mapping done by hand inside services, controllers as thin pass-throughs.

### Frontend (`frontend/`) — Next.js 16, React 19, TypeScript, Tailwind v4

- **App Router** with a route group: `app/(admin)/` contains `dashboard`, `students`, `staff`, `attendance`, `calendar`, `tasks`, `programs/[slug]`, `documents`, `reports`, `settings`.
- **Shared components** in `app/(admin)/components/` (`Widget`, `StatCard`, `BarChart`, `AlertList`, `PipelineList`, `TasksList`, `StaffList`) and `app/components/` (`AdminSidebar`, `ComingSoon`).
- **API layer** in `lib/api/` — `client.ts` (generic `apiFetch`) plus per-resource modules (`programs.ts`, `participants.ts`, `staff.ts`, `attendance.ts`, `calendar.ts`, `tasks.ts`, `scripts.ts`).
- **Types** in `lib/types/api.ts` — hand-mirrored DTOs and enums from the backend.
- **Styling** is mostly custom CSS (`app/styles/admin.css`, `tokens.css`, `components.css`) with design tokens, plus some Tailwind utilities; icons via `lucide-react`.

**Patterns:** mix of Server Components (`programs/_hub.tsx`) and Client Components (`students/page.tsx`, `attendance/page.tsx`), centralized fetch wrapper, design-token CSS.

---

## 2. Strengths

- **Clean layer separation on the backend.** Dependencies flow correctly: `CRM.API` → `Application`/`Infrastructure`/`Persistence`; `CRM.Persistence` implements interfaces defined in `CRM.Application` (`IRepository.cs`, `IUnitOfWork.cs`). The domain has no infrastructure dependencies.
- **Consistent DI registration.** Each layer exposes a `DependencyInjection.cs` extension method (`AddApplicationServices`, `AddPersistenceServices`, `AddInfrastructureServices`), keeping `Program.cs` short and readable.
- **EF Core done by-the-book.** Per-entity configurations in `CRM.Persistence/Configurations/` applied via `ApplyConfigurationsFromAssembly`, a real migration committed, and automatic `UpdatedAt` stamping in `AppDbContext.SaveChangesAsync`.
- **Thin controllers.** Controllers like `ParticipantsController` and `StaffController` delegate everything to services and translate `null`/`bool` into proper `NotFound()`/`NoContent()`/`CreatedAtAction` results.
- **Typed, centralized frontend API layer.** `lib/api/client.ts` + per-resource modules + a single `lib/types/api.ts` type file is a clean pattern; pages never hand-roll `fetch` calls (with one exception noted below).
- **Good DTO discipline.** Separate `Summary`/`Detail`/`Create`/`Update` DTOs (e.g., `DTOs/Participants/`) keep API contracts intentional and avoid over-posting entities.
- **Design tokens + reusable widgets.** `app/styles/tokens.css` and components like `Widget`/`StatCard` give the admin UI a consistent visual system.
- **Correct Next.js 16 idioms where used.** `programs/[slug]/page.tsx` correctly awaits the `params` promise; `_hub.tsx` is a proper async Server Component with `cache: "no-store"`.
- **Secrets are not committed.** `appsettings.json` is gitignored; CORS origins are configurable via `Cors:AllowedOrigins`.

---

## 3. Areas for Improvement

### 3.1 Frontend (Next.js)

- **Hard-coded mock data on key pages.** `app/(admin)/dashboard/page.tsx` (stats, alerts, events, pipeline, onboarding, attendance chart) and `app/(admin)/attendance/page.tsx` (`INITIAL` roster array, lines 43–56) render entirely fake data even though backend endpoints exist (`/api/programs`, `/api/attendance/session/{id}`, `/api/projects`). The UI silently shows wrong numbers ("Active Participants 48") against a database with 16 participants.
- **`_hub.tsx` bypasses the API layer.** `fetchProgramDetail` in `app/(admin)/programs/_hub.tsx` (lines 14–23) duplicates the base-URL logic from `lib/api/client.ts`. It should use `programsApi.getDetail` so error handling and base URL stay in one place. (Note: `api.get` runs on the client default; for server components, either make `apiFetch` isomorphic or add a server-side variant — but keep it in `lib/api/`.)
- **Two competing API clients.** `lib/api.ts` (old `apiGet`/`apiPost`, default port **5000**) and `lib/api/client.ts` (new, default port **5208**) coexist with different defaults. Delete `lib/api.ts`.
- **Hard-coded dates.** "Thursday, June 5, 2026" in `dashboard/page.tsx` (line 38) and `attendance/page.tsx` (line 108); "Friday, June 12, 2026" in `_hub.tsx` (line 55). Compute from `new Date()`.
- **Heavy inline styles.** `attendance/page.tsx` and `students/page.tsx` contain dozens of `style={{...}}` objects (e.g., the `th` style object, the note modal, the add-participant modal). These belong in `app/styles/` classes or extracted components (`Modal`, `DataTable`).
- **Non-functional controls.** In `students/page.tsx` the stat-tabs, program filter chips, search input, sorting carets, rows-per-page select, and pager (lines 296–476) are visual only. In `attendance/page.tsx` the program chips, Morning/Afternoon segment, Export, and "Submit attendance" buttons do nothing. Either wire them or hide them — dead controls erode user trust.
- **No `loading.tsx` / `error.tsx` boundaries.** Server-fetching routes like `programs/[slug]` have no streaming or error UI; client pages roll their own `loading` flags. Use App Router conventions.
- **`students/page.tsx` fetches client-side what could be server-rendered.** The initial `Promise.all([participantsApi.getAll(), programsApi.getAll()])` in a `useEffect` (lines 217–228) causes a loading flash; this page could be a Server Component with a small client island for the modal/filters.

### 3.2 Backend (C# / .NET 10)

- **`IRepository<T>` is the root performance problem.** It only exposes `GetAllAsync()`/`GetByIdAsync()`, so every service filters in memory. `AttendanceService.GetSessionAsync` loads **all** attendance records and **all** participants to render one session (lines 18–22); `ProgramService.GetDetailAsync` calls `GetAllAsync` on four tables and even calls `_uow.Programs.GetAllAsync()` twice (lines 61, 78). Add predicate/spec support: `FindAsync(Expression<Func<T,bool>>)`, `FirstOrDefaultAsync(...)`, paging, and `Include` support — or drop the generic repository and inject `AppDbContext` query services.
- **Dead/misleading code.** `ProgramService.GetDetailAsync` line 78: `var allAssignments = (await _uow.Programs.GetAllAsync()); // nav not loaded; use UoW.Staff approach below` — the variable is unused and `Staff = new()` (line 116) is always empty. `StaffService.GetAllAsync` builds a `programMap` (line 18) that `ToSummary` never uses; `ProgramNames` is always `new()` (line 84).
- **DTO fields silently ignored.** `CreateStaffDto.ProgramIds` and `UpdateStaffDto.ProgramIds` are never written to `StaffProgramAssignments` in `StaffService`. `CreateScriptDto.ProgramIds` / `UpdateScriptDto.ProgramIds` are ignored in `ScriptService`, and `ScriptDto.ProgramNames` is always empty (line 76). Clients can send data that vanishes.
- **`GetBySlugAsync` is O(everything).** `ProgramService.GetBySlugAsync` (lines 53–57) calls `GetAllAsync()` (which itself loads participants + sessions for every program) just to find one slug. `GetDetailAsync` then calls it _again_ for the summary stats.
- **No `CancellationToken`s.** No service or repository method accepts a `CancellationToken`; ASP.NET Core provides one per request for free. Thread `CancellationToken ct = default` through `IRepository`, services, and controllers.
- **No async suffix consistency issue, but no logging at all.** No `ILogger<T>` is injected anywhere. At minimum log seeding, failed lookups, and unexpected exceptions.

### 3.3 Database / Entity Framework

- **Navigation properties exist but are never used.** `Participant.Program`, `Participant.AttendanceRecords`, `Participant.Documents` (entity lines 17–19) are defined yet every service does manual dictionary joins (`ParticipantService.ToSummary` with `programMap`/`slugMap`). Use `Include`/projection queries (`.Select(p => new ParticipantSummaryDto {...})`) and let SQL do the join.
- **Denormalized, never-updated columns.** `Participant.AttendancePct` is a stored int set only by the seeder; marking attendance via `AttendanceService.UpdateRecordAsync` never recalculates it. Either compute it from `AttendanceRecords` in queries or add a recalculation step — today it will drift from reality immediately.
- **`CalendarEvent.IsUpcoming` is a stored snapshot.** Set once at creation (`CalendarService.CreateEventAsync` line 39) and at seed time; it becomes wrong as time passes. It should be computed (`Date >= today`) in queries, not persisted.
- **`Project.Status` is a raw string** (`"inprogress"`, `"planning"` in `DataSeeder.cs` lines 131–133) while `ProjectTask.Status` is a proper enum. Make `ProjectStatus` an enum for type safety and consistent JSON.
- **`GenericRepository.UpdateAsync` marks the whole entity modified** (`_db.Entry(entity).State = EntityState.Modified`, line 32). Combined with `FindAsync` (tracked entities), this is redundant and overwrites every column. Since `GetByIdAsync` returns tracked entities, plain `SaveChangesAsync` would persist only changed properties.
- **No indexes/uniqueness visible for lookups by slug.** `CrmProgram.Slug` is queried by `GetBySlugAsync` and the `/api/programs/{slug}` route; it should have a unique index in `CrmProgramConfiguration`.
- **Seeder runs without migration check.** `Program.cs` lines 69–74 seed but never call `db.Database.MigrateAsync()`. On a fresh database the app crashes on the first query. Add `await db.Database.MigrateAsync()` before `DataSeeder.SeedAsync(db)` (dev only, or gate behind config).

### 3.4 API structure & controllers

- **Inconsistent route shapes.** Most controllers use `[Route("api/[controller]")]`, but `TasksController` uses `[Route("api")]` with mixed resources (`/api/projects`, `/api/projects/{id}/tasks`, `/api/tasks/{id}`). Split into `ProjectsController` and `TasksController` or at least document the deviation.
- **Wrong status codes on create.** `TasksController.AddTask` (line 30) and `CalendarController.CreateEvent` (line 30) return `200 OK` instead of `201 Created`. `TasksController.CreateProject` calls `CreatedAtAction(nameof(GetProjects), result)` which produces a Location header pointing at the collection, not the new resource.
- **Missing endpoints.** No `DELETE` for staff, programs, scripts, projects, tasks, or calendar events; no `GET /api/projects/{id}`; no way to list sessions for a program (the frontend attendance page has no way to discover a `sessionId` for `GET /api/attendance/session/{sessionId}`). This is why the attendance UI is still mock data.
- **No API versioning or `ProducesResponseType` annotations.** Swagger output won't document 404/400 responses; add `[ProducesResponseType]` attributes or enable `Microsoft.AspNetCore.OpenApi` conventions.

### 3.5 Authentication & authorization

- **There is none.** Every endpoint — including `POST`/`PUT`/`DELETE` on participants (sensitive data: disability-services participants, service coordinators, attendance, documents) — is anonymous. `app.UseAuthorization()` is in the pipeline (`Program.cs` line 78) but no authentication scheme is registered and no `[Authorize]` attributes exist.
- **Recommendation:** add JWT bearer (or Microsoft Entra ID, given the Azure stack) in `CRM.API`, `[Authorize]` by default via a global fallback policy, role-based policies matching `StaffRole` (`Admin`, `Coordinator`, `Teacher`), and a login flow in the frontend (the orphaned `app/styles/login.css` suggests a login page was planned). For a CRM holding data about adults with developmental disabilities, this is the single most important gap.

### 3.6 Error handling & validation

- **No global exception handler.** An unhandled exception (e.g., `DateTime.Parse(dto.Date, ...)` in `CalendarService.CreateEventAsync` line 29 on a malformed date) returns a raw 500. Add `app.UseExceptionHandler()` + `AddProblemDetails()` so all errors are RFC 7807 responses.
- **No input validation.** DTOs have no DataAnnotations or FluentValidation. `CreateParticipantDto.FullName` can be empty; `CreateProgramDto.ColorHex` can be `"not-a-color"`; `CreateProgramDto.Name` of `"???"` produces slug `"???"` via the naive `Replace` chain in `ProgramService.CreateAsync` (lines 132–135). Add FluentValidation in `CRM.Application` with auto-validation in the pipeline.
- **Duplicate slugs are possible.** `ProgramService.CreateAsync` never checks slug uniqueness; two programs named "MJC" break `GetBySlugAsync` (first-match wins) and the `/programs/{slug}` route.
- **Frontend swallows errors.** `lib/api/client.ts` throws `Error("API 404: /path")` with no body details; `students/page.tsx` `.catch(() => { setData([]); ... })` (lines 223–226) shows "No participants yet" when the backend is actually down — misleading. Worse, `handleSubmit`'s catch (lines 258–273) **inserts a fake local row with a `temp-` id** when the POST fails, making the user believe the save succeeded.

### 3.7 UI / UX & component organization

- **Two component folders.** `app/components/` (`AdminSidebar`, `ComingSoon`) vs `app/(admin)/components/` (widgets). Consolidate under one convention, e.g., `app/(admin)/_components/` or a top-level `components/`.
- **Repeated empty-state markup.** The "No participants yet" / "No upcoming events" / "No staff assigned" blocks in `_hub.tsx` (lines 108–111, 142–145, 223–226) are copy-pasted inline styles. Extract an `EmptyState` component.
- **Program chips duplicated.** The MJC/Pathways/Manteca chip row appears hard-coded in `dashboard/page.tsx` (lines 42–57) and `attendance/page.tsx` (lines 115–131) instead of being driven by `programsApi.getAll()` and a shared `ProgramChips` component — adding a program in the DB won't show up in these filters.
- **Accessibility gaps.** Clickable `<span className="ss-chip">` elements with `onClick` (filter chips in `attendance/page.tsx` lines 163–172) are not keyboard-accessible — use `<button>`. The note modal and add-student modal have no focus trap, `role="dialog"`, or Escape handling. The skip-link exists only on the dashboard.

### 3.8 Performance

- **Backend N×table loads** (see 3.2/3.3): every list endpoint loads whole tables; `ProgramsController.GetAll` triggers 3 full-table reads, and `GetDetail` ~7. Fine at 16 rows; quadratic pain as data grows. Push filtering/aggregation into SQL with projections.
- **`TaskService.UpdateTaskAsync`/`AddTaskAsync` reload all staff** (lines 76, 95) to resolve one assignee name — fetch by id.
- **No pagination anywhere.** `GET /api/participants` returns the entire table; the frontend pager in `students/page.tsx` is fake. Add `skip/take` (or page/pageSize) parameters before the data set grows.
- **No caching headers / `revalidate`.** `_hub.tsx` uses `cache: "no-store"` for data that changes rarely (program metadata); consider `next: { revalidate: 60 }` per fetch.

### 3.9 Security

- **No authentication/authorization** (see 3.5) — critical.
- **CORS allows any header/method** for the configured origins — acceptable, but once auth cookies exist you'll need `AllowCredentials()` and tighter config.
- **No rate limiting or request size limits** on the API (`AddRateLimiter` is one-liner setup in .NET).
- **HTTPS redirection** is enabled but there's no HSTS (`app.UseHsts()`) for non-dev environments.
- **PII in a sensitive domain.** Participants' names, birth years, coordinator names, and attendance/medical-adjacent notes ("Anaphylactic" allergy flags in the attendance UI) deserve an audit-logging story and field-level care before production.

### 3.10 Readability & maintainability

- **Hand-written DTO mapping is drifting.** `ParticipantService`, `StaffService`, `ProgramService` each contain bespoke `ToSummary`/`ToDto` code with subtle inconsistencies (`HasDocAlerts = false` hard-coded in three places). Adopt Mapster/Mapperly (source-generated, fast) or at least centralize mappers per DTO.
- **Magic strings.** Severity `"Warning"` in `ProgramService` line 121 vs the `AlertSeverity` union in `lib/types/api.ts`; status string `"inprogress"` for projects. Use enums end-to-end.
- **Duplicated type definitions across the stack.** `lib/types/api.ts` mirrors backend DTOs by hand — workable, but consider generating types from Swagger (`openapi-typescript`) so the contract can't drift (e.g., `ScriptDto.programNames` is typed non-optional but the backend always sends `[]`).
- **Stale starter docs.** `frontend/README.md` is the default create-next-app README; root `README.md` should document run instructions for both halves (ports 3000/5208, env vars, migration + seed steps).

---

## 4. Recommended Refactors

1. **`backend/CRM.Application/Interfaces/IRepository.cs` — add query capability.**
   Why: it is the upstream cause of nearly every in-memory join and full-table load in the services.
   ```csharp
   public interface IRepository<T> where T : BaseEntity
   {
       Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
       Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default);
       Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
       Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
       Task<T> AddAsync(T entity, CancellationToken ct = default);
       void Remove(T entity);
   }
   ```
   Then `AttendanceService.GetSessionAsync` becomes `_uow.Attendance.ListAsync(r => r.SessionId == sessionId)` instead of filtering `GetAllAsync()`.

2. **`backend/CRM.Application/Services/ProgramService.cs` — rewrite `GetDetailAsync`.**
   Why: it currently makes ~7 full-table reads, contains dead code (line 78), and returns an always-empty `Staff` list. Query `StaffProgramAssignments` (add it to `IUnitOfWork`) and project staff for the program; compute summary stats once instead of calling `GetBySlugAsync` (which re-runs `GetAllAsync`).

3. **`backend/CRM.Application/Services/StaffService.cs` — honor `ProgramIds`.**
   Why: `CreateStaffDto.ProgramIds`/`UpdateStaffDto.ProgramIds` are accepted by the API and silently dropped; `StaffSummaryDto.ProgramNames` is always empty so the staff page can never show assignments. Persist/replace `StaffProgramAssignment` rows and populate `ProgramNames` from a join.

4. **`backend/CRM.API/Controllers/TasksController.cs` — split into `ProjectsController` + `TasksController`.**
   Why: `[Route("api")]` breaks the `api/[controller]` convention, and `CreateProject`'s `CreatedAtAction(nameof(GetProjects), result)` emits a wrong Location header. Add `GET /api/projects/{id}` and point `CreatedAtAction` at it.

5. **`frontend/lib/api.ts` — delete.**
   Why: superseded by `lib/api/client.ts`; its different default port (5000 vs 5208) is a trap for the next developer who imports the wrong module.

6. **`frontend/app/(admin)/attendance/page.tsx` — replace the `INITIAL` mock array with API data.**
   Why: the page duplicates seed data by hand (and even disagrees with it — roles like "admin/teacher" applied to students). Requires a new backend endpoint such as `GET /api/programs/{slug}/sessions` or `GET /api/attendance/today`, then `attendanceApi.getSession(...)` + `updateRecord(...)` on toggle.

7. **`frontend/app/(admin)/dashboard/page.tsx` — fetch real stats.**
   Why: every number is hard-coded. Make it an async Server Component aggregating `programsApi.getAll()`, `participantsApi.getAll()`, `tasksApi`/projects, and staff onboarding — or better, add a single `GET /api/dashboard` endpoint so the page makes one request.

8. **`frontend/app/(admin)/students/page.tsx` — extract components and remove the fake-success catch.**
   Why: at 492 lines it mixes a modal, a table, filters, and data fetching. Extract `AddStudentModal` (already a function — move to its own file), `ParticipantsTable`, and `FilterBar`; replace the offline-fallback insert in `handleSubmit` (lines 258–273) with an error toast.

9. **`frontend/app/(admin)/programs/_hub.tsx` — use `programsApi.getDetail` and derive "Next Session".**
   Why: duplicates fetch logic; `nextSessionLabel` is hard-coded to `"—"` (line 44) even though the backend computes `nextSessionDate`/`nextSessionMeta` in `ProgramSummaryDto`.

10. **Centralize mapping in `CRM.Application` (Mapperly or static mapper classes per aggregate).**
    Why: `ToSummary`/`ToDto` logic is duplicated across `ParticipantService`, `StaffService`, `TaskService`, `CalendarService`, `ScriptService` with inconsistencies (`HasDocAlerts`, `ProgramNames`, `Documents` always defaulted).

---

## 5. Suggested Architecture Improvements

The 5-project layout is sound — keep it. Adjustments:

- **Move `DataSeeder.cs` out of `CRM.API`** into `CRM.Persistence/Seed/` (it depends on `AppDbContext` and entities, not on anything web). Gate it behind `Database:SeedOnStartup` config rather than `IsDevelopment()` only.
- **Replace string-formatted dates in DTOs with `DateOnly`/`DateTime`.** Services currently format dates as strings (`ToString("yyyy-MM-dd")`, `"MMM d"` in `ProgramService` line 46). Let DTOs carry `DateOnly` and let `System.Text.Json` serialize; move display formatting ("Jun 9", "Thursday") into the frontend. Presentation logic in the Application layer is a separation-of-concerns leak.
- **Introduce query objects or move read models out of the UoW.** For read-heavy endpoints (`ProgramDetail`, dashboard), a dedicated query service in `CRM.Persistence` that uses `AppDbContext` LINQ projections directly is simpler and faster than forcing everything through `IRepository<T>`. Keep the repository/UoW for writes. (Full CQRS/MediatR is optional at this size.)
- **Add `StaffProgramAssignments`, `OnboardingItems`, `AttendanceNotes`, and `DocumentRecords` to `IUnitOfWork`.** They exist in `AppDbContext` but are unreachable from services — which is exactly why `OnboardingItems`, `Documents`, and `Notes` come back empty in `StaffService.GetByIdAsync`, `ParticipantService.GetByIdAsync`, and `AttendanceService.GetSessionAsync`.
- **Frontend structure:**
  - One components home: `app/(admin)/_components/` (the `_` prefix keeps it out of routing) — merge `app/components/` into it, leaving truly global pieces (e.g., marketing homepage parts) elsewhere.
  - Add `app/(admin)/loading.tsx` and `app/(admin)/error.tsx`.
  - Generate `lib/types/api.ts` from the Swagger doc (`npx openapi-typescript http://localhost:5208/swagger/v1/swagger.json`) in a `npm run gen:api` script.
  - Prefer Server Components for initial data (students, staff, programs lists) with client islands for interactivity.

---

## 6. Bugs or Risky Code

| # | Location | Issue | Risk |
| --- | --- | --- | --- |
| 1 | `frontend/app/(admin)/students/page.tsx` lines 258–273 | On POST failure, a fake participant row with a `temp-` id is added to the table. | Users believe a save succeeded when it didn't — silent data loss. |
| 2 | `backend/CRM.Application/Services/CalendarService.cs` line 29 | `DateTime.Parse(dto.Date, ...)` on raw client input. | Malformed date → `FormatException` → unhandled 500. Use `DateTime.TryParse` or type the DTO property as `DateTime`/`DateOnly`. |
| 3 | `backend/CRM.Application/Services/ProgramService.cs` lines 127–142 | No slug uniqueness check; naive slug generation. | Duplicate or empty slugs break `GET /api/programs/{slug}` routing and the frontend `/programs/[slug]` page. |
| 4 | `backend/CRM.API/Program.cs` lines 69–74 | Seeding without `MigrateAsync()`. | Fresh environment crashes at startup ("Invalid object name 'Programs'"). |
| 5 | `backend/CRM.Domain/Entities/Participant.cs` line 15 / `AttendanceService.UpdateRecordAsync` | `AttendancePct` never recalculated when attendance is marked. | Reported attendance percentages become stale/wrong — a core metric for this CRM. |
| 6 | `CalendarEvent.IsUpcoming` (entity + `DataSeeder.cs`) | Stored boolean that decays over time. | "Upcoming events" lists will show past events forever. |
| 7 | `backend/CRM.Application/Services/StaffService.cs` / `ScriptService.cs` | `ProgramIds` from Create/Update DTOs ignored; `ProgramNames` always `[]`. | API contract lies; frontend staff/scripts pages can never display program assignments. |
| 8 | `frontend/lib/api.ts` vs `lib/api/client.ts` | Two clients, two default ports (5000 / 5208). | Importing the old module sends requests to a dead port; confusing failures. |
| 9 | `frontend/app/(admin)/attendance/page.tsx` line 200 | `key={s.nm}` (student name) as React key; toggling uses array index `i` after filtering with `visible()`. | Duplicate names break rendering; filtering + index-based mutation is fragile (it works now only because `visible` is applied inside `map`). Use stable ids. |
| 10 | Entire API surface | No auth on endpoints exposing participants' PII and quasi-medical notes. | Regulatory/ethical exposure if ever deployed beyond localhost. |
| 11 | `backend/.../GenericRepository.cs` line 22 (`AsNoTracking` in `GetAllAsync`) vs `UpdateAsync` pattern | Mixed tracked/untracked entity flows. | Subtle: entities obtained from `GetAllAsync` then "updated" will be re-attached and force-overwrite all columns, racing concurrent edits (no concurrency token exists). |

---

## 7. Priority List

### High Priority
1. **Add authentication + authorization** (JWT/Entra ID, `[Authorize]` fallback policy, `StaffRole`-based policies) — backend `Program.cs` + controllers, plus a frontend login flow.
2. **Fix the fake-success insert** in `students/page.tsx` `handleSubmit` — replace with visible error handling.
3. **Global exception handling + request validation** — `AddProblemDetails`/`UseExceptionHandler` in `CRM.API`, FluentValidation for all Create/Update DTOs, `TryParse` in `CalendarService`.
4. **`MigrateAsync()` before seeding** in `Program.cs`.
5. **Repository query support** (`ListAsync(predicate)`) and rewrite of `AttendanceService.GetSessionAsync` / `ProgramService.GetDetailAsync` to stop loading whole tables.

### Medium Priority
6. Honor `ProgramIds` in `StaffService`/`ScriptService`; expose `StaffProgramAssignments`, `OnboardingItems`, `AttendanceNotes`, `DocumentRecords` via `IUnitOfWork` so detail DTOs stop returning empty lists.
7. Wire the **dashboard** and **attendance** pages to real data (add `GET /api/dashboard` and a session-listing endpoint).
8. Delete `frontend/lib/api.ts`; route `_hub.tsx` through `lib/api/`.
9. Fix REST inconsistencies: split `TasksController`, return `201` with correct Location headers, add missing `DELETE`/`GET-by-id` endpoints, unique index on `CrmProgram.Slug`.
10. Convert `Project.Status` to an enum; compute `IsUpcoming` and `AttendancePct` instead of storing them.
11. Add `CancellationToken` support and `ILogger<T>` usage across services.

### Low Priority
12. Consolidate component folders; extract `Modal`, `EmptyState`, `ProgramChips`, `DataTable`; move inline styles into `app/styles/`.
13. Generate frontend types from Swagger; add `loading.tsx`/`error.tsx`; replace hard-coded dates.
14. Adopt Mapperly/Mapster for DTO mapping; add pagination to list endpoints; add rate limiting + HSTS.
15. Update `README.md`s with real setup instructions; remove or implement dead UI controls (pager, sorting, export buttons).

---

## 8. Final Recommendations

The project has a genuinely solid skeleton: a correctly layered .NET solution, disciplined DTOs, EF configurations and migrations in place, and a frontend with a clean typed API layer and a coherent design system. The gap is between the **scaffold** and a **trustworthy application**: no security, services that simulate queries in memory, several DTO fields and UI controls that look functional but do nothing, and key pages still running on mock data.

Suggested plan of attack:

1. **Week 1 — Safety:** authentication/authorization, ProblemDetails + validation, `MigrateAsync`, fix the fake-success bug. Nothing else matters if the data layer is open and errors are invisible.
2. **Week 2 — Data integrity:** repository predicates, rewrite the heavy service queries, honor `ProgramIds`, compute `AttendancePct`/`IsUpcoming`, unique slug index. This makes the API tell the truth.
3. **Week 3 — Connect the UI:** dashboard endpoint, sessions endpoint, wire attendance and dashboard pages, delete the legacy API client, add loading/error boundaries.
4. **Ongoing — Polish:** component extraction, generated types, pagination, accessibility, docs.

Each step is incremental and independently shippable; none requires re-architecting. The team has built the right foundation — the next phase is replacing the placeholders with the real thing before habits (mock data, ignored DTO fields, inline styles) calcify into the codebase.

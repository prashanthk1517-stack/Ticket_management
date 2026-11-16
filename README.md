# PeopleDesk and SupportDesk — Management Dashboard

A responsive employee directory and customer-support ticket dashboard built with React, TypeScript, and CSS. Both use mock data and browser storage; no backend is required.

## Run locally

```bash
npm install
npm run dev
```

Use `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` to validate the app. Employee changes are saved in `localStorage`; clear the `peopledesk.employees` key in browser storage to restore the sample data.

## Ticket dashboard: mock authentication and RBAC

The customer-support dashboard extends this same application. `/tickets` is the protected ticket dashboard; `/team` is available to administrators and support managers; `/admin` and the existing `/employees` directory are administrator-only. Unauthenticated route visits redirect to `/login`, and the requested route is restored after successful sign-in. Authenticated users visiting `/login` are sent to `/tickets`.

### Demo accounts

All demo accounts use the password `password123`.

| Role | Email |
|---|---|
| Administrator | `admin@support.test` |
| Support Manager | `manager@support.test` |
| Support Agent | `agent.alex@support.test` |
| Support Agent | `agent.sam@support.test` |

Select **Demo accounts** on the login page to populate an account. The permission matrix is centralized in `src/utils/permissions.ts`:

| Permission | Administrator | Support Manager | Support Agent |
|---|---:|---:|---:|
| View tickets | All | All | Assigned only |
| Create tickets | Yes | Yes | No |
| Assign tickets | Yes | Yes | No |
| Delete tickets | Yes | No | No |
| Manage users | Yes | No | No |
| Update ticket status | Yes | Yes | Assigned only |
| Edit details / priority | Yes | Yes | No |
| View team statistics | Yes | Yes | No |
| View administration / employees | Yes | No | No |

`/users` is an administrator-only explanation page; account CRUD is not implemented because the project has no user-management backend. Frontend permissions improve the UX but are not an authorization boundary.

### Architecture and security

- `src/app/store.ts` configures the Redux Toolkit store, initializes persisted feature data, and saves ticket and employee updates to browser storage. `src/app/hooks.ts` exports typed Redux hooks.
- `src/features/auth/state/authSlice.ts` owns the authenticated user and async login lifecycle. Login uses `createAsyncThunk`; the auth service validates credentials and persists the demo identity for page refreshes.
- `src/components/layout/ProtectedRoute.tsx` guards authenticated routes and preserves the requested location. `PermissionBasedRoute.tsx` applies the centralized permissions to restricted routes.
- `src/utils/permissions.ts` centralizes role permissions and ticket ownership checks; `src/features/auth/hooks/usePermissions.ts` exposes reusable checks to UI components.
- `src/features/tickets/services/ticketService.ts` provides typed mock ticket operations, role checks and ownership checks. `src/features/tickets/state/ticketSlice.ts` stores ticket data, while `useTickets` connects permission-checked service operations to Redux.
- `src/app/api/baseApi.ts`, `src/app/api/baseQuery.ts`, and `src/features/tickets/services/ticketApi.ts` provide the shared RTK Query lifecycle for ticket reads and mutations. The local base query uses the existing ticket store/service as its demo transport and centralizes safe status-to-message mapping; it does not make HTTP requests.
- `src/features/employees/state/employeeSlice.ts` owns employee CRUD state; `src/features/employees/services/employeeStorage.ts` handles validated local-storage hydration.
- `src/features/tickets/pages/TicketDashboard.tsx` shows role-specific tickets, statistics and permitted actions. Ticket data is scoped before rendering; create, edit, delete, assign, priority and status actions are conditionally shown.
- Ticket service operations validate required text, length/control characters, enum values, assignees and unexpected fields before changing local data. Ticket strings are rendered as React text, not HTML.
- `src/components/ui/` contains the generic DataTable, controlled form fields, compound modal, buttons, badges, cards, alerts and loader.
- `src/features/` owns auth, ticket, employee and dashboard pages, components, hooks and services. Shared UI stays outside feature-specific code.

This is deliberately a frontend-only exercise. Browser storage and frontend role checks can be changed or bypassed and are **not security controls**. In production, the backend must authenticate the session and authorize every ticket/API operation; a production system should also use an appropriately protected session/token strategy and server-side validation. The mock password and role values are public demo data, not secrets.

### API reliability demo

The repository has no ticket backend, so the RTK Query base query intentionally adapts the existing local ticket service instead of inventing an HTTP API contract. The ticket dashboard's **API failure simulation** selector exercises the shared query/mutation lifecycle:

- **Network unavailable** simulates a fetch/network failure with a connection-specific message.
- **Slow response (loading state)** holds a successful ticket query long enough to show the loading indicator.
- **Service unavailable (503)** simulates a transient server failure.
- **Expired session (401)** clears the demo identity and the existing protected route redirects to `/login`. There is no refresh-token endpoint or real access token in this project, so no refresh call is made or fabricated.
- **Forbidden (403)** displays a safe access-denied message without offering a retry.
- **Validation failure** returns a safe 422-style message for mutations; query requests continue to succeed.

Read requests retry network and 503 failures at most twice after the original request. Authentication and validation errors are never retried, and mutations are never automatically retried, avoiding duplicate creates/updates/deletes. The error view offers a manual retry for failed ticket reads. Error text is selected locally from status codes; server response details are never shown. Query arguments include the debounced search value, and RTK Query abort signals cancel superseded or unmounted requests. Existing local ticket data remains the successful demo transport and persists as before.

When a backend contract becomes available, replace the local base-query adapter with the agreed HTTP transport and authentication mechanism. A 401 should clear the session and redirect to sign-in until the backend documents a supported refresh flow; do not store production tokens in browser local storage. Backend authorization remains mandatory.

Ticket request-state screenshots are in [`screenshots/`](./screenshots/): [loading](./screenshots/tickets-loading.png), [network error](./screenshots/tickets-error.png), and [success](./screenshots/tickets-success.png).

### Security model and verification

The demo has no `.env` files, API keys, JWTs or production secrets. Its `supportdesk.auth` local-storage value is only a mock identity used to exercise routes; it is editable and must never be treated as proof of authentication. `VITE_*` values are bundled into client code, so only public configuration such as a non-secret API origin belongs there.

For production, authenticate and authorize every request on the backend. Prefer a server-managed session in a cookie such as `HttpOnly; Secure; SameSite=Lax` (use `Strict` where workflows permit). Cross-site cookies require `SameSite=None; Secure` plus deliberate CSRF defenses, strict CORS allowlists and credential settings; never combine credentialed CORS with `Access-Control-Allow-Origin: *`. Validate `Origin` and use a CSRF token strategy for state-changing requests. `HttpOnly` prevents JavaScript from reading the session cookie; `Secure` restricts it to HTTPS; `SameSite` limits cross-site cookie sending. Do not store access or refresh tokens in local storage.

React escapes rendered strings by default; keep ticket subjects/customers as text and do not use `dangerouslySetInnerHTML` or `eval`. A production Content Security Policy should be delivered as an HTTP response header and restrict scripts, connections, framing and object sources to the application's needs. Same-Origin Policy isolates origins by default; CORS is a server opt-in for specific trusted origins, not an authorization system. The application has no CSP/CORS server configuration because it has no backend or hosting configuration in this repository.

| Security check | Expected behavior | Actual verification |
|---|---|---|
| Unauthenticated visit to `/tickets` | Redirect to login and preserve destination | Covered by route tests |
| Agent opens `/users` | Show Unauthorized page | Covered by security route test |
| Agent attempts ticket deletion | Reject with 403; preserve ticket list | Covered by service test; delete control is hidden |
| Manager opens `/admin` | Show Unauthorized page | Covered by existing route test |
| API returns 401 | Clear mock session and redirect to login; do not retry | Covered by API test and browser smoke check |
| API returns 403 | Show safe access-denied message; no retry | Covered by API test |
| Invalid / unexpected ticket input | Reject with 422-style validation feedback | Covered by service tests |
| Script-like ticket text | Render as text, never create executable markup | Covered by dashboard test |

## Performance and frontend security

- Ticket search waits 250 ms before filtering and uses RTK Query arguments so superseded searches can be cancelled; role-scoped ticket counts are memoized.
- The shared `DataTable` uses TanStack Virtual for ticket result sets of 100 or more. It keeps pagination at 50 rows and mounts only the visible rows plus overscan, with stable ticket IDs as React keys. Fixed ticket-row sizing keeps the virtual scroll offsets predictable. The existing React Compiler and memoized ticket column/callback props avoid adding blanket `React.memo` wrappers.
- Login, ticket, employee, team/admin dashboard, and settings pages are loaded through route-level dynamic imports with an accessible Suspense fallback. The production build reports separate page chunks.
- The app has no image assets and no real HTTP ticket API. The RTK Query demo adapter models ticket requests locally; it makes no network requests. The remote Google Fonts import was removed in favor of system fonts, avoiding a third-party font request and font-induced layout shifts.
- No `dangerouslySetInnerHTML` is used; React renders user-entered ticket text as text. Client validation and role-gated controls are UX only, not authorization. The demo identity is stored in `localStorage` and must not be used for real credentials or tokens. Production authentication and authorization belong on the backend; HTTPS, CSRF protections for cookie sessions, and CSP response headers must be configured by the production API/hosting environment. Do not put secrets in `VITE_*` variables.

### Measured bundle comparison

The production build immediately before these optimizations emitted one JavaScript entry chunk at **361.42 kB raw / 115.67 kB gzip**. The build after route splitting emits an initial entry chunk at **224.69 kB raw / 70.64 kB gzip** (about 38% smaller in both measures), with page code in separate chunks, including TicketDashboard at **15.46 kB raw / 5.31 kB gzip**.

One Lighthouse 12.8.2 run on each production `/login` page, on the same local Chrome machine and default Lighthouse throttling, measured:

| Metric | Before | After |
|---|---:|---:|
| Performance score | 92 | 99 |
| Accessibility score | 95 | 100 |
| First Contentful Paint | 2.69 s | 1.59 s |
| Largest Contentful Paint | 2.69 s | 1.59 s |
| Total Blocking Time | 0 ms | 10 ms |
| Cumulative Layout Shift | 0 | 0 |
| Lighthouse page resource requests | 7 | 6 |

These are single-run local login-page measurements, not production user data. Lighthouse's lab run did not collect INP. The accessibility audit found a low-contrast login text issue and brand-label mismatch before the fix; both were resolved and the final login audit passed. React DevTools Profiler recordings have not been captured. The localStorage mock has no API traffic to compare.

`npm audit --omit=dev` reports no production dependency vulnerabilities. The full audit reports four moderate findings through the ESLint/minimatch development-tooling dependency chain; npm's suggested automatic fix would downgrade ESLint across a major version, so it was not applied.

### Frontend system design

- **Feature-based organization:** routes use feature entry points, with auth, ticket, employee and dashboard code grouped under `src/features/`. Shared UI remains separate from domain-specific components. The shared table demonstrates reuse across both employee and ticket data. There is no customer module or user-management CRUD service; `/users` only explains the backend limitation and is admin-only.
- **Shared vs feature components:** shared controls in `src/components/ui/` are domain-neutral and configurable. Feature pages/forms compose them with ticket- or employee-specific labels, permissions, formatting and actions.
- **Hooks vs components:** components own reusable presentation and interaction; hooks own reusable stateful behavior such as debounce, pagination, modal state, async requests and permission checks.
- **Container vs presentation:** dashboard pages coordinate auth, services, derived data and actions. `DataTable` receives rows, columns, renderers and handlers through props, while the feature page decides what each row means and which actions are allowed.
- **Context API vs Redux Toolkit:** Redux Toolkit stores shared auth, ticket, and employee state so route-level views and feature components observe the same updates. Async login is handled by `createAsyncThunk`; domain rules remain in ticket services. Typed `useAppDispatch` and `useAppSelector` hooks keep component access type-safe. Browser storage hydration and persistence are coordinated by the store, while transient form, filter, and modal state remains local to components.
- **Large applications:** keep routes and feature-owned logic within feature boundaries; let features import shared UI and platform services, but avoid imports between feature internals. Promote code to shared only when multiple features have a real common need.
- **Circular dependencies:** feature entry points are the public API, shared UI does not import feature code, and dependency direction flows from routes to features to shared/platform code.
- **Scaling modules:** add a feature folder with its own pages, components, hooks, service layer, types and tests; reuse the generic table and field components rather than duplicating CRUD UI.

The generic table is demonstrated in both the ticket dashboard and employee directory. No customer or user-management CRUD module exists in the supplied project, so neither is fabricated with unrelated sample data.

### Tests and manual demo

`npm test` runs Vitest and React Testing Library checks for successful/failed login, protected-route redirects and return navigation, logout, persisted authentication, role permissions, agent ticket isolation/deletion restrictions, manager/admin route restrictions, ticket validation and text rendering, Redux state hydration/persistence, and ticket API success/network/401/403/validation/retry states.

The starter project has no HTTP transport or MSW setup. Reliability tests exercise the deterministic RTK Query demo adapter directly; add MSW when the feature is connected to a real fetch-based API.

To demonstrate the flow: open `/tickets` in a signed-out browser; sign in using one of the accounts above; try the agent and manager accounts to compare ticket visibility/actions; open `/team` or `/admin` for their role-specific areas; use **API failure simulation** to view network, 503, validation, and 401 handling; then restore **Healthy demo API** or sign back in. Changes are saved under `supportdesk.auth` and `supportdesk.tickets` in browser storage. Clear these keys to restore demo state.

## Architecture and concepts

- `src/features/employees/pages/EmployeeDashboard.tsx` owns page-level filter and dialog state, derives visible employees and statistics, and connects actions to the employee hook.
- `src/features/employees/hooks/useEmployees.ts` exposes typed Redux selectors and CRUD dispatchers. The employee slice applies immutable updates, with the store persisting changes.
- `src/features/employees/components/` contains employee-specific statistics, search/filters, table, form, and confirmation dialog components.
- `src/features/employees/types/employee.types.ts` defines the employee interface, draft type, filter/sort types, and the `"Active" | "Inactive"` status union.
- `src/features/employees/utils/employee.utils.ts` contains typed search/filter/sort, `reduce()`-based statistics, formatting, and storage-data validation.
- `src/features/employees/data/employees.ts` provides the initial mock records. `src/styles/app.css` contains design tokens, focus, hover, and responsive layout rules.

Search matches a name or email; department and status filters are combined with it, then the matching list is sorted. Statistics always use the full employee list, not the filtered list. The form is controlled and combines browser constraints (`required`, email, date, and salary bounds) with duplicate-email validation. Editing preserves the stable ID; deleting requires confirmation. Employee data persists locally between reloads.

## Interview practice

1. **Props vs state:** Props are inputs from a parent; state belongs to a component and changes over time. `EmployeeTable` receives employees and edit/delete handlers as props, while `EmployeeDashboard` stores filter selections as state.
2. **Why not mutate React state?** React detects updates through new references; direct mutation can prevent a reliable re-render and makes prior state harder to reason about. `useEmployees` returns new arrays with `map()` and `filter()` instead.
3. **`map()` vs `forEach()`:** `map()` returns a transformed array; `forEach()` is for side effects and returns no useful array. The directory uses `map()` to render rows and `map()` to create updated employee records.
4. **How does `filter()` work?** It returns a new array containing only items that satisfy a predicate. `filterAndSortEmployees()` checks the search query, department, and status for each employee.
5. **Average salary with `reduce()`:** Sum each salary, then divide by the number of records (guarding the empty list). `calculateEmployeeStats()` also counts active and inactive records in its reducer.
6. **Type vs interface:** Both describe object shapes; interfaces are extendable/declarable multiple times, while types can express unions and compositions. `Employee` is an interface; `EmploymentStatus` and `EmployeeDraft` are types.
7. **Why React keys matter:** Stable keys help React match items between renders so it updates the correct row and preserves expected DOM state. Each employee row uses its stable employee ID.
8. **Controlled vs uncontrolled:** A controlled input gets its value from React state and reports changes through an event handler; an uncontrolled input stores its value in the DOM. `EmployeeForm` controls every field with `values` state.
9. **When to use `useEffect()`:** For synchronization with external systems, not for values that can be derived during render. The employee hook syncs state to local storage, and the delete dialog registers and removes its Escape-key listener.
10. **Optimizing thousands of employees:** Profile first, then consider list virtualization, server-side pagination/filtering, and memoization of expensive derived data. `App` memoizes the filtered/sorted list and statistics; virtualization would be the next step for a very large directory.
11. **Preventing invalid data:** Use native validation attributes and typed form data, then validate business rules before saving. The form requires valid name/email/role/department/date/salary and rejects duplicate email addresses.
12. **How to test form and filters:** Test visible behavior and user events, not implementation details. With React Testing Library, enter search text and select filters, then assert rows; submit invalid/valid form values and assert validation, CRUD results, and updated statistics. Vitest and React Testing Library are configured in this project.

## Manual checks

- Search for “Olivia” or an existing email, then search for a name that is not present.
- Combine department and status filters; try each sort option.
- Add an employee with valid details and try missing, malformed, out-of-range, and duplicate values.
- Edit an employee and verify the row and statistics; delete one and cancel/confirm the warning.
- Check total/active/inactive counts and the average salary before and after changes.
- At mobile width, confirm cards, controls, dialogs, and keyboard focus remain usable.

React Profiler recordings have not been captured. Automated Vitest and React Testing Library tests cover the application and virtualization behavior.

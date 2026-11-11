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

Select **Demo accounts** on the login page to populate an account. Agents see only tickets assigned to their own account and can update their status. Managers can view all tickets, edit ticket details, assign agents, and update status and priority, but cannot create or delete tickets. Administrators can create and delete tickets and have all manager permissions.

### Architecture and security

- `src/app/store.ts` configures the Redux Toolkit store, initializes persisted feature data, and saves ticket and employee updates to browser storage. `src/app/hooks.ts` exports typed Redux hooks.
- `src/features/auth/state/authSlice.ts` owns the authenticated user and async login lifecycle. Login uses `createAsyncThunk`; the auth service validates credentials and persists the demo identity for page refreshes.
- `src/components/layout/ProtectedRoute.tsx` guards authenticated routes and preserves the requested location. `RoleBasedRoute.tsx` gates role-specific pages.
- `src/utils/permissions.ts` centralizes role permissions and ticket ownership checks; `src/features/auth/hooks/usePermissions.ts` exposes reusable checks to UI components.
- `src/features/tickets/services/ticketService.ts` provides typed mock ticket operations, role checks and ownership checks. `src/features/tickets/state/ticketSlice.ts` stores ticket data, while `useTickets` connects permission-checked service operations to Redux.
- `src/features/employees/state/employeeSlice.ts` owns employee CRUD state; `src/features/employees/services/employeeStorage.ts` handles validated local-storage hydration.
- `src/features/tickets/pages/TicketDashboard.tsx` shows role-specific tickets, statistics and permitted actions. Ticket data is scoped before rendering; create, edit, delete, assign, priority and status actions are conditionally shown.
- `src/components/ui/` contains the generic DataTable, controlled form fields, compound modal, buttons, badges, cards, alerts and loader.
- `src/features/` owns auth, ticket, employee and dashboard pages, components, hooks and services. Shared UI stays outside feature-specific code.

This is deliberately a frontend-only exercise. Browser storage and frontend role checks can be changed or bypassed and are **not security controls**. In production, the backend must authenticate the session and authorize every ticket/API operation; a production system should also use an appropriately protected session/token strategy and server-side validation. The mock password and role values are public demo data, not secrets.

## Performance and frontend security

- Ticket search waits 250 ms before filtering and uses `useDeferredValue` so typing stays responsive. Filtering and role-scoped ticket counts are memoized; the ticket selector returns the same result when unrelated employee state changes.
- The shared `DataTable` uses TanStack Virtual for ticket result sets of 100 or more. It keeps pagination at 50 rows and mounts only the visible rows plus overscan, with stable ticket IDs as React keys. Fixed ticket-row sizing keeps the virtual scroll offsets predictable. The existing React Compiler and memoized ticket column/callback props avoid adding blanket `React.memo` wrappers.
- Login, ticket, employee, team/admin dashboard, and settings pages are loaded through route-level dynamic imports with an accessible Suspense fallback. The production build reports separate page chunks.
- The app has no image assets and no real ticket API. The remote Google Fonts import was removed in favor of system fonts, avoiding a third-party font request and font-induced layout shifts. Search, pagination, and CRUD operate on local Redux/localStorage data; server-side pagination and request cancellation are not applicable until a backend API exists. There are currently zero API requests.
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

- **Feature-based organization:** routes use feature entry points, with auth, ticket, employee and dashboard code grouped under `src/features/`. Shared UI remains separate from domain-specific components. The shared table demonstrates reuse across both employee and ticket data. Customer and standalone user-management modules do not exist in this project, so they are not represented with invented sample data.
- **Shared vs feature components:** shared controls in `src/components/ui/` are domain-neutral and configurable. Feature pages/forms compose them with ticket- or employee-specific labels, permissions, formatting and actions.
- **Hooks vs components:** components own reusable presentation and interaction; hooks own reusable stateful behavior such as debounce, pagination, modal state, async requests and permission checks.
- **Container vs presentation:** dashboard pages coordinate auth, services, derived data and actions. `DataTable` receives rows, columns, renderers and handlers through props, while the feature page decides what each row means and which actions are allowed.
- **Context API vs Redux Toolkit:** Redux Toolkit stores shared auth, ticket, and employee state so route-level views and feature components observe the same updates. Async login is handled by `createAsyncThunk`; domain rules remain in ticket services. Typed `useAppDispatch` and `useAppSelector` hooks keep component access type-safe. Browser storage hydration and persistence are coordinated by the store, while transient form, filter, and modal state remains local to components.
- **Large applications:** keep routes and feature-owned logic within feature boundaries; let features import shared UI and platform services, but avoid imports between feature internals. Promote code to shared only when multiple features have a real common need.
- **Circular dependencies:** feature entry points are the public API, shared UI does not import feature code, and dependency direction flows from routes to features to shared/platform code.
- **Scaling modules:** add a feature folder with its own pages, components, hooks, service layer, types and tests; reuse the generic table and field components rather than duplicating CRUD UI.

The generic table is demonstrated in both the ticket dashboard and employee directory. No customer/user-management modules exist in the supplied project, so they are not fabricated with unrelated sample data.

### Tests and manual demo

`npm test` runs Vitest and React Testing Library checks for successful/failed login, protected-route redirects and return navigation, logout, persisted authentication, role permissions, ticket detail edits, agent ticket isolation, unauthorized mutation attempts, and Redux state hydration/persistence.

To demonstrate the flow: open `/tickets` in a signed-out browser; sign in using one of the accounts above; try the agent and manager accounts to compare ticket visibility/actions; open `/team` or `/admin` for their role-specific areas; then log out. Changes are saved under `supportdesk.auth` and `supportdesk.tickets` in browser storage. Clear these keys to restore demo state.

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

No screenshots or React Profiler recordings are currently included. Automated Vitest and React Testing Library tests cover the application and virtualization behavior.

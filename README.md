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

Select **Demo accounts** on the login page to populate an account. Agents see only tickets assigned to their own account and can update their status. Managers can view all tickets, assign agents, and update status and priority, but cannot create or delete tickets. Administrators can create and delete tickets and have all manager permissions.

### Architecture and security

- `src/context/AuthContext.tsx` uses a reducer for the authenticated user and exposes login/logout through `src/hooks/useAuth.ts`. A small mock service validates demo credentials and persists the current demo identity for page refreshes.
- `src/components/layout/ProtectedRoute.tsx` guards authenticated routes and preserves the requested location. `RoleBasedRoute.tsx` gates role-specific pages.
- `src/utils/permissions.ts` centralizes role permissions and ticket ownership checks; `src/hooks/usePermissions.ts` exposes reusable checks to UI components.
- `src/services/ticketService.ts` provides typed mock ticket operations, local persistence, role checks and ownership checks. `src/hooks/useTickets.ts` connects those operations to React state.
- `src/pages/Dashboard/TicketDashboard.tsx` shows role-specific tickets, statistics and permitted actions. Ticket data is scoped before rendering; delete, assign, priority and status actions are conditionally shown.

This is deliberately a frontend-only exercise. Browser storage and frontend role checks can be changed or bypassed and are **not security controls**. In production, the backend must authenticate the session and authorize every ticket/API operation; a production system should also use an appropriately protected session/token strategy and server-side validation. The mock password and role values are public demo data, not secrets.

### Tests and manual demo

`npm test` runs Vitest and React Testing Library checks for successful/failed login, protected-route redirects and return navigation, logout, persisted authentication, role permissions, agent ticket isolation, and unauthorized mutation attempts.

To demonstrate the flow: open `/tickets` in a signed-out browser; sign in using one of the accounts above; try the agent and manager accounts to compare ticket visibility/actions; open `/team` or `/admin` for their role-specific areas; then log out. Changes are saved under `supportdesk.auth` and `supportdesk.tickets` in browser storage. Clear these keys to restore demo state.

## Architecture and concepts

- `src/App.tsx` owns page-level filter and dialog state, derives visible employees and statistics, and connects actions to the employee hook.
- `src/hooks/useEmployees.ts` owns employee CRUD state and persistence. Updates use immutable `map()` and `filter()` operations.
- `src/components/` contains the statistics cards, accessible search and filters, responsive employee table, employee form, and delete confirmation.
- `src/types/employee.types.ts` defines the employee interface, draft type, filter/sort types, and the `"Active" | "Inactive"` status union.
- `src/utils/employee.utils.ts` contains typed search/filter/sort, `reduce()`-based statistics, formatting, and storage-data validation.
- `src/data/employees.ts` provides the initial mock records. `src/styles/app.css` contains the spacing, color, focus, hover, and responsive layout rules.

Search matches a name or email; department and status filters are combined with it, then the matching list is sorted. Statistics always use the full employee list, not the filtered list. The form is controlled and combines browser constraints (`required`, email, date, and salary bounds) with duplicate-email validation. Editing preserves the stable ID; deleting requires confirmation. Employee data persists locally between reloads.

## Interview practice

1. **Props vs state:** Props are inputs from a parent; state belongs to a component and changes over time. `EmployeeTable` receives employees and edit/delete handlers as props, while `App` stores filter selections as state.
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
12. **How to test form and filters:** Test visible behavior and user events, not implementation details. With React Testing Library, enter search text and select filters, then assert rows; submit invalid/valid form values and assert validation, CRUD results, and updated statistics. The project currently has no automated test runner configured; the same cases are listed below for manual checks.

## Manual checks

- Search for “Olivia” or an existing email, then search for a name that is not present.
- Combine department and status filters; try each sort option.
- Add an employee with valid details and try missing, malformed, out-of-range, and duplicate values.
- Edit an employee and verify the row and statistics; delete one and cancel/confirm the warning.
- Check total/active/inactive counts and the average salary before and after changes.
- At mobile width, confirm cards, controls, dialogs, and keyboard focus remain usable.

No screenshots or automated test suite are currently included.

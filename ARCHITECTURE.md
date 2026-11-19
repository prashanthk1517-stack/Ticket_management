# Customer Support Dashboard Architecture

```text
Routes / Pages
  - TicketDashboard       - UserManagementPage       - EmployeeDashboard
          |                        |                         |
          v                        v                         v
Feature hooks/services/state  Feature components      Feature hooks/storage
          |                        |                         |
          +------------------------+-------------------------+
                                   |
                                   v
Shared UI: DataTable, Modal, InputField, SelectField,
TextAreaField, CheckboxField, FormActions, Button
                                   |
                                   v
Custom hooks: useDebounce, useToggle, useModal,
              usePagination, useOutsideClick
                                   |
                                   v
RTK Query / Redux Toolkit / mock services
  - shared API base query
  - ticket API and slice
  - auth slice
  - employee slice
```

## Component responsibilities

- Pages are containers: they coordinate auth, permissions, API state, feature
  state, and event handlers.
- Feature components own domain presentation and compose shared UI controls.
- Shared components are generic and domain-neutral. `DataTable<T>` uses
  TypeScript generics and receives columns, custom renderers, sorting,
  pagination, loading, empty-state, selection and row-action configuration.
- The compound `Modal` uses a small context provider and exposes `Trigger`,
  `Content`, `Header`, `Body`, and `Footer`. Escape and backdrop handling,
  focus trapping, body scroll locking, and configurable sizes live in the
  shared component.
- Form controls expose strongly typed native props plus `label`, `error`,
  `helperText`, `disabled`, `required`, and consistent accessibility IDs.

## Communication and state

Redux Toolkit owns auth, ticket, and employee state. Typed hooks connect React
components to that state. RTK Query owns ticket request lifecycle and cache
state. Feature hooks encapsulate scoped business behavior and reusable UI hooks
encapsulate debounce, boolean state, pagination, modal state, and outside
pointer handling.

Pages compose reusable controls and pass domain-specific render functions,
which keeps column definitions and mutation decisions out of `DataTable`.

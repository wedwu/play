<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

# <span class="material-icons" style="vertical-align:middle">electric_bolt</span> Angular Advanced App

A production-grade Angular 17 application showcasing every advanced feature of Angular + TypeScript.

## <span class="material-icons" style="vertical-align:middle">rocket_launch</span> Quick Start

```bash
npm i
npm start          # local dev → http://localhost:4200
```

## <span class="material-icons" style="vertical-align:middle">inventory_2</span> Scripts

| Script | Description |
|---|---|
| `npm start` | Serve with local environment |
| `npm run start:dev` | Serve with dev environment |
| `npm run start:stg` | Serve with staging environment |
| `npm run start:prod` | Serve with production environment |
| `npm run build` | Production build |
| `npm run build:local` | Local build |
| `npm run build:dev` | Dev build |
| `npm run build:stg` | Staging build |
| `npm run build:prod` | Production build |
| `npm test` | Run Jest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run docs` | Generate TypeDoc documentation → `docs/` |

---

## <span class="material-icons" style="vertical-align:middle">account_tree</span> Architecture Overview

```
src/
├── environments/
│   ├── environment.ts          ← local (default)
│   ├── environment.dev.ts      ← remote dev server
│   ├── environment.staging.ts  ← staging
│   └── environment.prod.ts     ← production
└── app/
    ├── core/
    │   ├── models/
    │   │   ├── base-entity.model.ts    ← Abstract base class, decorators, generics
    │   │   ├── user.model.ts           ← User extends BaseEntity; AdminUser extends User
    │   │   ├── task.model.ts           ← Task + TaskBuilder (method chaining)
    │   │   └── project.model.ts        ← Project with composition
    │   ├── services/
    │   │   ├── entity-state.service.ts ← Generic abstract service with RxJS
    │   │   ├── task.service.ts         ← Extends EntityStateService<Task>
    │   │   ├── user.service.ts         ← Extends EntityStateService<User>
    │   │   ├── project.service.ts      ← Extends EntityStateService<Project>
    │   │   └── notification.service.ts ← RxJS Subject-based toasts
    │   ├── helpers/
    │   │   └── utils.helper.ts         ← 30+ pure utility functions
    │   ├── interceptors/
    │   │   └── http.interceptor.ts     ← Auth + Error + Logging interceptors
    │   └── guards/
    │       └── auth.guard.ts           ← Functional route guards
    ├── shared/
    │   ├── pipes/pipes.ts              ← 8 custom pipes
    │   ├── directives/directives.ts    ← 6 custom directives
    │   └── components/
    │       ├── nav/
    │       │   ├── nav.component.ts
    │       │   ├── nav.component.html
    │       │   └── nav.component.scss
    │       └── toast/
    │           ├── toast.component.ts
    │           ├── toast.component.html
    │           └── toast.component.scss
    └── modules/
        ├── dashboard/
        │   ├── dashboard.component.ts
        │   ├── dashboard.component.html
        │   └── dashboard.component.scss
        ├── tasks/
        │   ├── tasks.component.ts
        │   ├── tasks.component.html
        │   └── tasks.component.scss
        └── users/
            ├── users.component.ts
            ├── user-card.component.html  ← UserCardComponent template
            ├── users.component.html      ← UsersComponent template
            └── users.component.scss      ← Shared styles for both components
```

Every component follows the standard three-file structure: `.ts` + `.html` + `.scss`.

---

## <span class="material-icons" style="vertical-align:middle">public</span> Environments

Four named build configurations are defined in `angular.json`, each swapping `environment.ts` for the appropriate override file:

| Config | `name` | `production` | `logLevel` | Mock data | API |
|---|---|---|---|---|---|
| `local` | `local` | `false` | `debug` | <span class="material-icons" style="color:#4caf50;font-size:18px;vertical-align:middle">check_circle</span> | `localhost:3000` |
| `development` | `dev` | `false` | `debug` | <span class="material-icons" style="color:#f44336;font-size:18px;vertical-align:middle">cancel</span> | `api.dev.acme.com` |
| `staging` | `staging` | `false` | `warn` | <span class="material-icons" style="color:#f44336;font-size:18px;vertical-align:middle">cancel</span> | `api.stg.acme.com` |
| `production` | `production` | `true` | `error` | <span class="material-icons" style="color:#f44336;font-size:18px;vertical-align:middle">cancel</span> | `api.acme.com` |

The `Environment` interface is declared once in `environment.ts` and imported by the three override files.

---

## <span class="material-icons" style="vertical-align:middle">code</span> TypeScript & OOP Patterns

### Abstract Class Hierarchy (3 levels)

```
BaseEntity (abstract)          ← id, status, createdAt, metadata, template methods
    └── User                   ← permissions, skills, login tracking
        └── AdminUser          ← audit log, managed departments
    └── Task                   ← state machine, subtasks, comments
    └── Project                ← milestones, sprints, stats, health
```

### Generic State Service

```typescript
abstract class EntityStateService<T extends BaseEntity> {
  // Provides filteredItems$, pagedItems$, CRUD, sort, filter, pagination
  // Subclasses only implement applyFilterAndSort()
}
```

### Builder Pattern (Task)

```typescript
const task = new TaskBuilder("Fix auth bug", "alice")
  .withPriority(TaskPriority.URGENT)
  .withDueDate(tomorrow)
  .withTag("bug", "#FF6B6B")
  .withEstimate(3)
  .build();
```

---

## <span class="material-icons" style="vertical-align:middle">sync</span> All Lifecycle Hooks Demonstrated

| Hook | Location | Purpose |
|---|---|---|
| `constructor` | All components | DI, initial setup |
| `ngOnChanges` | AppComponent, DashboardComponent | Respond to @Input changes |
| `ngOnInit` | All components | Data subscriptions, form init |
| `ngDoCheck` | AppComponent | Custom change detection |
| `ngAfterContentInit` | TasksComponent | Content projection ready |
| `ngAfterContentChecked` | AppComponent | Projected content checked |
| `ngAfterViewInit` | AppComponent, Dashboard | @ViewChild access |
| `ngAfterViewChecked` | AppComponent | View checked |
| `ngOnDestroy` | All components | Unsubscribe, cleanup |

---

## <span class="material-icons" style="vertical-align:middle">extension</span> Advanced Angular Features

### Custom Directives

- `[appAutoFocus]` — focuses element after view init
- `[appClickOutside]` — emits when clicking outside an element
- `[appRipple]` — material-style ripple effect
- `[appTooltip]` — floating tooltip via DOM manipulation
- `[appIfPermission]` — structural directive for role-based rendering
- `[appScrollSpy]` — scroll position monitoring

### Custom Pipes

- `relativeTime` — "3h ago", "in 2d" (impure)
- `truncate` — with configurable ellipsis
- `highlight` — wraps query matches in `<mark>`
- `fileSize` — bytes → KB/MB/GB
- `hours` — decimal hours → "2h 30m"
- `priorityLabel` — enum → readable string
- `initials` — "John Doe" → "JD"
- `pluralize` — "1 task" vs "3 tasks"

### RxJS Patterns

- `BehaviorSubject` for state
- `combineLatest` for derived state
- `takeUntil` + `Subject` for subscriptions
- `distinctUntilChanged`, `debounceTime` for optimization
- `interval` for periodic tasks (overdue monitor)

### HTTP Interceptors (functional API)

- `authInterceptor` — adds Bearer token
- `errorInterceptor` — maps HTTP errors to notifications
- `loggingInterceptor` — request timing logs

### Route Guards (functional API)

- `authGuard` — checks localStorage token
- `roleGuard(...roles)` — factory guard for RBAC

### Performance

- `ChangeDetectionStrategy.OnPush` on all components
- `markForCheck()` for manual triggering
- `detectChanges()` after ViewChild init
- Lazy-loaded routes for all feature modules

### Angular Animations

- `trigger('fadeInUp')` — entrance animation
- `trigger('staggerCards')` — staggered list entrance
- `trigger('cardIn')` — scale-in for task cards
- `trigger('toastAnim')` — slide-in/out for toasts
- `trigger('gridIn')` — staggered grid for users

---

## <span class="material-icons" style="vertical-align:middle">build</span> Helper Functions

The `utils.helper.ts` file provides 30+ pure utility functions:

**Array:** `groupBy`, `sortBy`, `uniqueBy`, `chunk`, `flatten`  
**Object:** `pick`, `omit`, `deepClone`, `deepMerge`  
**Date:** `formatDate`, `relativeTime`, `addDays`, `isWithinDays`  
**String:** `capitalize`, `titleCase`, `slugify`, `truncate`, `highlight`  
**Number:** `clamp`, `lerp`, `formatBytes`, `formatHours`, `percentage`  
**Async:** `sleep`, `retry`, `debounce`, `throttle`  
**Validation:** `Validators.required/email/minLen/maxLen/range/url`  
**Color:** `hexToRgb`, `contrastColor`  
**Memoization:** generic `memoize`

---

## <span class="material-icons" style="vertical-align:middle">science</span> Testing

Tests are written with **Jest** via `jest-preset-angular`. Run with `npm test`.

| Spec file | Covers |
|---|---|
| `utils.helper.spec.ts` | All 30+ pure helper functions |
| `base-entity.model.spec.ts` | ID generation, lifecycle, metadata, serialisation |
| `task.model.spec.ts` | Workflow transitions, progress, subtasks, TaskBuilder |
| `user.model.spec.ts` | Permissions, validation, skills, AdminUser |
| `project.model.spec.ts` | Members, tasks, stats, health, milestones, sprints |
| `notification.service.spec.ts` | Emit, history, read state, clear |
| `entity-state.service.spec.ts` | CRUD, pagination, sort, filter, observables |
| `project.service.spec.ts` | Seed data, streams, createProject, addTaskToProject |
| `task.service.spec.ts` | Streams, createTask, transitionTask, addComment, logTime |
| `user.service.spec.ts` | Seed data, streams, createUser, updateRole, filtering |
| `auth.guard.spec.ts` | `authGuard` + `roleGuard` with TestBed |
| `pipes.spec.ts` | All 8 pipes |

**350 tests** across 12 suites. Coverage report: `npm run test:coverage` → `coverage/`.

### TypeScript config for tests

`tsconfig.spec.json` extends the root tsconfig with `"types": ["jest", "node"]` and `"module": "CommonJS"` for Jest compatibility. Spec files are excluded from `tsconfig.json` so the IDE uses `tsconfig.spec.json` for them.

---

## <span class="material-icons" style="vertical-align:middle">menu_book</span> API Documentation

TypeDoc generates full API docs from JSDoc comments across all source files:

```bash
npm run docs   # outputs to docs/
```

Configured via `typedoc.json` using `tsconfig.docs.json` — a variant of the root tsconfig compatible with the project's installed TypeScript version. Covers all 26 source files including the four environment configs.

---

## <span class="material-icons" style="vertical-align:middle">design_services</span> Design System

**Fonts:** Syne (headings, bold) + Space Mono (code, meta)  
**Theme:** Dark industrial — near-black backgrounds, lime-green accent (`#c8f05a`)  
**Components:** Cards, badges, progress bars, kanban board, data table, modals  
**Styles:** Each component has a dedicated `.scss` file with proper SCSS nesting. Shared global styles live in `src/styles.scss`.

---

_Built with Angular 17 standalone components, TypeScript strict mode, RxJS 7, Angular Animations, and Jest._

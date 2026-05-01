<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

# <span class="material-icons" style="vertical-align:middle">electric_bolt</span> Angular Advanced App

A production-grade Angular 21 application showcasing every advanced feature of Angular + TypeScript.

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
    │       │   ├── nav.component.ts    ← exports NavItem interface; collapsible sidebar
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
        │   ├── tasks.component.ts    ← exports KanbanCol interface
        │   ├── tasks.component.html
        │   └── tasks.component.scss
        └── users/
            ├── users.component.ts    ← exports UserCardComponent + UsersComponent
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

### Dependency Injection

All services and dependencies are injected using Angular's modern `inject()` function rather than constructor parameters, keeping constructors lean and making DI tree-shakeable:

```typescript
// Modern inject() pattern used throughout
readonly taskService  = inject(TaskService);
private readonly cdr  = inject(ChangeDetectorRef);
private readonly fb   = inject(FormBuilder);
```

### Reusable Standalone Components

- **`UserCardComponent`** — self-contained user card with avatar, role, department, and selected state. Exported from `users.component.ts` and consumed inside `UsersComponent`.
- **`KanbanCol` interface** — exported type from `tasks.component.ts` describing a Kanban column (status, label, color, icon).
- **`NavItem` interface** — exported type from `nav.component.ts` describing a sidebar route entry (path, label, icon).

### Collapsible Navigation

`NavComponent` supports a two-state sidebar driven by a single boolean:

```typescript
@HostBinding('class.collapsed') collapsed = false;

toggle(): void {
  this.collapsed = !this.collapsed;
  document.documentElement.style.setProperty('--nav-width', this.collapsed ? '64px' : '260px');
}
```

- `@HostBinding('class.collapsed')` adds/removes the CSS class on the `<app-nav>` host, driving all icon-only layout rules via `:host.collapsed` SCSS selectors
- `--nav-width` CSS custom property on `:root` is the single source of truth for both sidebar width and `.app-main` margin-left, both with `transition: 0.25s ease`
- In collapsed mode, route labels are hidden with `@if (!collapsed)` and replaced by right-side `[appTooltip]` tooltips on each icon

### Toast Notifications

All four notification types are fully wired to user actions via `NotificationService`:

| Action | Type | Fired from |
|---|---|---|
| Create task | `success` | `TaskService.createTask()` |
| Task reaches DONE | `success` | `TaskService.transitionTask()` |
| Invalid status transition | `error` | `TaskService.transitionTask()` |
| Delete task | `info` | `TaskService.deleteTask()` |
| Overdue poll (60 s) | `warn` | `TaskService.startOverdueMonitor()` |

`ToastComponent` uses `detectChanges()` (not `markForCheck()`) to force immediate re-render under `OnPush` when a notification arrives. Lifecycle hooks (`ngOnInit`, `ngOnDestroy`) are declared as **prototype methods**, not arrow-function class fields, so Angular's Ivy compiler correctly registers the `OnInit` flag and calls them.

### Performance

- `ChangeDetectionStrategy.OnPush` on all components
- `detectChanges()` for immediate rendering in `ToastComponent` when notifications arrive
- `markForCheck()` for manual scheduling in other components
- Lazy-loaded routes for all feature modules

### CSS Animations (`@keyframes`)

All animations use native CSS `@keyframes` defined in each component's `.scss` file, applied via `animate.enter` / `animate.leave` template attributes. No `@angular/animations` dependency.

| Keyframe | File | Effect |
|---|---|---|
| `fade-in-up` | `dashboard.component.scss` | Stat cards fade in while translating up 20 px |
| `stat-stagger-in` | `dashboard.component.scss` | Staggered entrance for stat card grid |
| `card-in-enter` | `tasks.component.scss` | Task cards scale in from 0.95 + fade in |
| `card-in-leave` | `tasks.component.scss` | Task cards scale out to 0.95 + fade out |
| `slide-in-enter` | `tasks.component.scss` | Toolbar slides in from −12 px + fade in |
| `grid-in-enter` | `users.component.scss` | User cards scale in from 0.9 + fade in |
| `toast-enter` | `toast.component.scss` | Toast slides in from right + fade in |
| `toast-leave` | `toast.component.scss` | Toast slides out to right + fade out |
| `ripple` | `styles.scss` | Material-style ripple expands and fades |

Reduced-motion users are protected globally via `@media (prefers-reduced-motion: reduce)`.

---

## <span class="material-icons" style="vertical-align:middle">accessibility</span> Accessibility (WCAG 2.1)

The application targets **WCAG 2.1 Level AA** conformance. Changes applied across every component:

### Global (`src/index.html`, `src/styles.scss`)

- **Skip link** — `<a class="skip-link" href="#main-content">` visible on keyboard focus, bypasses the nav bar (2.4.1)
- **Focus ring** — `:focus-visible` accent-coloured outline with `:focus` fallback for older browsers (2.4.7)
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables all transitions and animations (2.3.3)
- **`--text-secondary` contrast** — updated from `#7a7f8e` to `#b5b9c5` to exceed 4.5:1 against the dark background (1.4.3)
- **`.sr-only` utility class** — visually hidden text for screen-reader-only labels

### Navigation

- `<nav aria-label="Main navigation">` landmark (1.3.1)
- `[attr.aria-current]="rla.isActive ? 'page' : null"` on active links (2.4.4)
- Decorative icons marked `aria-hidden="true"`; navigation icon text is the visible label (1.1.1)
- Toggle button has `aria-label="Collapse/Expand navigation"` and `aria-expanded` (4.1.2)
- In collapsed mode, each nav icon gets `[appTooltip]` with the route label and `tooltipPlacement="right"` so keyboard/pointer users can still identify routes (1.1.1)
- `user-badge` `aria-label` updates dynamically between full name+role and name-only in collapsed mode (1.3.1)

### Toast / Notifications

- Container: `aria-live="polite"` + `aria-atomic="true"` for automatic announcements (4.1.3)
- Error toasts use `role="alert"` (assertive); info/success/warn use `role="status"` (4.1.3)
- Icon spans `aria-hidden="true"`; close button has `aria-label="Dismiss notification"` (1.1.1)

### Dashboard

- Stat cards: `[attr.aria-label]` with spoken value; progress bars have `role="progressbar"` + `aria-valuenow/min/max` (4.1.2)
- Section landmarks with `aria-labelledby` pointing at each `<h2>` (1.3.1)
- Urgent task list uses `<ul role="list">` with per-item `Start` buttons labelled by task title (1.1.1)
- Debug panel ViewChild status uses `<span class="sr-only">` text alongside the visual icon (1.1.1)

### Tasks

- Kanban cards: `role="button"` + `[attr.aria-label]` with title, priority and overdue state (4.1.2)
- Progress bars: `role="progressbar"` + `aria-valuenow/min/max` + readable label (4.1.2)
- Transition buttons: `[attr.aria-label]="'Move ' + task.title + ' to ' + next"` (1.1.1)
- Table: `aria-label="Tasks list"` (1.3.1)
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at modal title (4.1.2)
- Priority colour strip marked `aria-hidden="true"` (1.4.1)

### Users

- User cards: `role="button"`, `[attr.aria-label]` with full name / role / dept / selected state, `[attr.aria-pressed]` (4.1.2)
- Department tabs: `role="tablist"` + `role="tab"` + `[attr.aria-selected]` (4.1.2)
- Search and filter inputs have associated `<label>` elements and `id` attributes (1.3.1)
- Detail panel: `role="region"` with `[attr.aria-label]`; close button labelled with user's name (1.3.1)
- Permissions rendered as `<dl>` with `<dd class="sr-only">Allowed/Denied</dd>` so colour isn't the only indicator (1.4.1)
- Skill remove buttons: `[attr.aria-label]="'Remove skill: ' + skill"` (1.1.1)
- Role-toggle buttons: `[attr.aria-pressed]` for current state (4.1.2)

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
**Icons:** [Google Material Icons](https://fonts.google.com/icons) loaded via CDN in `src/index.html`. All UI icons use `<span class="material-icons">icon_name</span>` — decorative instances carry `aria-hidden="true"`.  
**Components:** Cards, badges, progress bars, kanban board, data table, modals  
**Styles:** Each component has a dedicated `.scss` file with proper SCSS nesting. Shared global styles live in `src/styles.scss`.  
**Contrast:** `--text-secondary` set to `#b5b9c5` (≥ 7:1 against the dark background, exceeding WCAG AA).  
**Motion:** `@media (prefers-reduced-motion: reduce)` disables all transitions and animations globally.

---

_Built with Angular 21 standalone components, TypeScript strict mode, RxJS 7, and Jest._

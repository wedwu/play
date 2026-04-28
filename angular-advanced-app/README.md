# ⚡ Angular Advanced App

A production-grade Angular 17 application showcasing every advanced feature of Angular + TypeScript.

## 🚀 Quick Start

```bash
npm i
npm start          # → http://localhost:4200
```

## 🏗️ Architecture Overview

```
src/app/
├── core/
│   ├── models/            # Class hierarchy
│   │   ├── base-entity.model.ts    ← Abstract base class, decorators, generics
│   │   ├── user.model.ts           ← User extends BaseEntity; AdminUser extends User
│   │   ├── task.model.ts           ← Task + TaskBuilder (method chaining)
│   │   └── project.model.ts       ← Project with composition
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
│   ├── directives/directives.ts   ← 6 custom directives
│   └── components/
│       ├── nav/nav.component.ts
│       └── toast/toast.component.ts
└── modules/
    ├── dashboard/                  ← Stats + kanban preview + lifecycle debug
    ├── tasks/                      ← Full kanban board + list view + modals
    └── users/                      ← Team management + detail panel
```

---

## 🎯 TypeScript & OOP Patterns

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

## 🔄 All Lifecycle Hooks Demonstrated

| Hook                    | Location                         | Purpose                       |
| ----------------------- | -------------------------------- | ----------------------------- |
| `constructor`           | All components                   | DI, initial setup             |
| `ngOnChanges`           | AppComponent, DashboardComponent | Respond to @Input changes     |
| `ngOnInit`              | All components                   | Data subscriptions, form init |
| `ngDoCheck`             | AppComponent                     | Custom change detection       |
| `ngAfterContentInit`    | TasksComponent                   | Content projection ready      |
| `ngAfterContentChecked` | AppComponent                     | Projected content checked     |
| `ngAfterViewInit`       | AppComponent, Dashboard          | @ViewChild access             |
| `ngAfterViewChecked`    | AppComponent                     | View checked                  |
| `ngOnDestroy`           | All components                   | Unsubscribe, cleanup          |

---

## 🧩 Advanced Angular Features

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

## 🛠️ Helper Functions

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

## 📐 Design System

**Fonts:** Syne (headings, bold) + Space Mono (code, meta)  
**Theme:** Dark industrial — near-black backgrounds, lime-green accent (`#c8f05a`)  
**Components:** Cards, badges, progress bars, kanban board, data table, modals

---

_Built with Angular 17 standalone components, TypeScript strict mode, RxJS 7, and Angular Animations._

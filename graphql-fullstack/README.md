# TaskFlow — GraphQL Fullstack

A senior-level task management application demonstrating production-grade GraphQL patterns: schema design, resolver chains, DataLoader batching, cursor pagination, WebSocket subscriptions, and JWT authentication — consumed by both a React and Angular client.

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [GraphQL Server](#graphql-server)
  - [Schema](#schema)
  - [Resolvers](#resolvers)
  - [DataLoaders](#dataloaders)
  - [Authentication & Authorization](#authentication--authorization)
  - [Pagination](#pagination)
  - [Subscriptions](#subscriptions)
  - [Error Handling](#error-handling)
  - [Data Layer](#data-layer)
- [React Client](#react-client)
  - [Apollo Client Setup](#apollo-client-setup)
  - [GraphQL Operations](#graphql-operations)
  - [Components](#components)
  - [Hooks](#hooks)
- [Angular Client](#angular-client)
  - [Apollo Angular Setup](#apollo-angular-setup)
  - [Services](#services)
  - [Components](#angular-components)
  - [Routing & Guards](#routing--guards)
- [Testing](#testing)
- [Seed Data](#seed-data)

---

## Architecture

```
graphql-fullstack/
├── server/                         # Apollo Server 4 + Express + TypeScript
│   └── src/
│       ├── index.ts                # Server bootstrap (HTTP + WebSocket)
│       ├── context.ts              # Per-request context builder
│       ├── types.ts                # Shared TypeScript interfaces & enums
│       ├── schema/
│       │   └── index.ts            # Full GraphQL SDL (typeDefs)
│       ├── resolvers/
│       │   ├── index.ts            # Merged resolver map
│       │   ├── user.resolver.ts    # User queries, mutations, field resolvers
│       │   ├── project.resolver.ts # Project queries, mutations, field resolvers
│       │   └── task.resolver.ts    # Task/Comment queries, mutations, subscriptions
│       ├── datasources/
│       │   ├── db.ts               # In-memory database + seed data
│       │   ├── UserAPI.ts          # User persistence methods
│       │   ├── ProjectAPI.ts       # Project persistence methods
│       │   └── TaskAPI.ts          # Task, Comment, Tag persistence methods
│       ├── loaders/
│       │   └── index.ts            # Per-request DataLoader instances
│       └── utils/
│           ├── auth.ts             # JWT sign/verify, bcrypt, guards
│           ├── pagination.ts       # Relay cursor pagination
│           └── errors.ts           # Typed GraphQL error classes
│
├── react-client/                   # React 18 + Apollo Client 3 + Vite
│   └── src/
│       ├── apollo/client.ts        # Apollo Client with split HTTP/WS link
│       ├── gql/index.ts            # All fragments, queries, mutations, subscriptions
│       ├── hooks/useAuth.ts        # Authentication hook
│       ├── types.ts                # Shared TypeScript types + display constants
│       ├── pages/
│       │   ├── Login.tsx           # Login / Register form
│       │   ├── Dashboard.tsx       # Project grid with pagination
│       │   └── ProjectView.tsx     # Kanban board + task detail drawer
│       └── components/
│           ├── TaskBoard.tsx       # Kanban board (live subscription)
│           └── TaskCard.tsx        # Individual task card + optimistic move
│
└── angular-client/                 # Angular 17 + apollo-angular
    └── src/app/
        ├── app.component.ts        # Root shell component
        ├── app.config.ts           # Apollo provider + router bootstrap
        ├── app.routes.ts           # Lazy routes with functional auth guards
        ├── graphql/
        │   ├── queries.ts          # GQL fragments, queries, subscriptions
        │   └── mutations.ts        # GQL mutations
        ├── services/
        │   ├── auth.service.ts     # Auth state (Signals) + login/logout
        │   └── task.service.ts     # Task CRUD + subscription helpers
        └── pages/
            ├── login/              # Login/Register component
            ├── dashboard/          # Project grid component
            └── project/            # Kanban board + live updates
```

**Data flow:**

```
Browser → Apollo Client (HTTP Link) → Express → Apollo Server → Resolvers → DataSources
Browser ← Apollo Cache              ← Express ← Apollo Server ← Resolvers ← DataSources

Browser → Apollo Client (WS Link) → graphql-ws → useServer → Resolvers → PubSub
Browser ← Apollo Cache             ← graphql-ws ← PubSub.publish()
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Start the server

```bash
cd server
npm install
npm run dev
```

The server starts on **http://localhost:4000/graphql** (HTTP) and **ws://localhost:4000/graphql** (WebSocket).

Open the built-in Apollo Sandbox at that URL to explore the schema interactively.

### 2. Start the React client

```bash
cd react-client
npm install
npm run dev
```

Opens at **http://localhost:5173**. The Vite dev server proxies `/graphql` to port 4000.

### 3. Start the Angular client

```bash
cd angular-client
npm install
npm start
```

Opens at **http://localhost:4200**. Points directly to `http://localhost:4000/graphql`.

### Demo credentials

| Email | Password | Role |
|---|---|---|
| `admin@taskflow.dev` | `admin123` | ADMIN |
| `bob@taskflow.dev` | `member123` | MEMBER |
| `carol@taskflow.dev` | `member123` | MEMBER |

---

## GraphQL Server

### Schema

**File:** [server/src/schema/index.ts](server/src/schema/index.ts)

The schema is defined SDL-first using a single `gql` tagged template. This keeps the contract human-readable and decoupled from resolver implementation.

#### Custom Scalars

| Scalar | Behaviour |
|---|---|
| `DateTime` | Serializes as ISO 8601 string; parses from string or `Date` object. Provided by `graphql-scalars`. |
| `JSON` | Accepts and returns arbitrary JSON values. Used for extension points. |

#### Enums

```graphql
enum Role        { ADMIN MEMBER VIEWER }
enum TaskStatus  { BACKLOG TODO IN_PROGRESS IN_REVIEW DONE CANCELLED }
enum TaskPriority{ URGENT HIGH MEDIUM LOW }
enum ProjectStatus { ACTIVE PAUSED COMPLETED ARCHIVED }
```

#### Core Types

```graphql
type User {
  id, email, name, role, avatarUrl
  projects: [Project!]!         # resolved via ProjectAPI.findByMember
  assignedTasks: [Task!]!       # resolved via TaskAPI.findByAssignee
  createdAt, updatedAt: DateTime!
}

type Project {
  id, name, description, status
  owner: User!                  # resolved via DataLoader (batched)
  members: [User!]!             # resolved via DataLoader (batched)
  tasks(filter, first, after): TaskConnection!   # paginated + filterable
  taskCount: Int!               # resolved via DataLoader (no extra query)
  createdAt, updatedAt: DateTime!
}

type Task {
  id, title, description, status, priority
  project: Project!             # resolved via ProjectAPI
  assignee: User                # nullable — resolved via DataLoader
  reporter: User!               # resolved via DataLoader
  comments: [Comment!]!         # resolved via DataLoader (batched)
  tags: [Tag!]!                 # resolved via TagAPI
  dueDate: DateTime
  estimatedHours: Float
  createdAt, updatedAt: DateTime!
}
```

#### Relay-style Connections

Paginated fields return `Connection` types following the [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm):

```graphql
type TaskConnection {
  edges: [TaskEdge!]!      # each edge carries a cursor + the node
  pageInfo: PageInfo!      # hasNextPage, hasPreviousPage, startCursor, endCursor
  totalCount: Int!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

Consumers pass `first: Int` and `after: String` (cursor) for forward pagination, or `last` / `before` for backward.

---

### Resolvers

**Files:** [server/src/resolvers/](server/src/resolvers/)

Resolvers are split by domain and merged in [resolvers/index.ts](server/src/resolvers/index.ts).

#### Resolver Map Structure

```
Query.*    — top-level read operations
Mutation.* — top-level write operations
Subscription.* — WebSocket event streams

User.*     — field resolvers: projects, assignedTasks
Project.*  — field resolvers: owner, members, tasks, taskCount
Task.*     — field resolvers: project, assignee, reporter, comments, tags
Comment.*  — field resolvers: author, task
```

#### Field Resolver Pattern

Field resolvers receive the parent object as their first argument. They resolve related entities lazily — only when the client actually requests that field:

```typescript
// Task.assignee is only resolved if the query includes `assignee { ... }`
Task: {
  assignee: async (task: Task, _, ctx: Context) => {
    if (!task.assigneeId) return null;
    return ctx.loaders.userLoader.load(task.assigneeId); // batched
  },
}
```

#### Why Split Resolvers?

Each resolver file owns one domain (users, projects, tasks). The index merges `Query`, `Mutation`, `Subscription`, and type resolvers into a single map. This makes it easy to add a domain (e.g. `notification.resolver.ts`) without touching existing files.

---

### DataLoaders

**File:** [server/src/loaders/index.ts](server/src/loaders/index.ts)

DataLoaders solve the **N+1 query problem** — the most common GraphQL performance trap.

Without DataLoader, resolving 10 projects would trigger 10 separate `findById` calls for each project's `owner`. With DataLoader, those 10 calls are batched into one:

```
Without DataLoader:             With DataLoader:
GET user WHERE id = 'a'         GET user WHERE id IN ('a','b','c',...) ← 1 query
GET user WHERE id = 'b'         results distributed back to callers
GET user WHERE id = 'c'
...
```

#### Loaders Created Per Request

| Loader | Batches | Cache |
|---|---|---|
| `userLoader` | IDs → `User[]` | Per-request (keyed by user ID) |
| `tasksByProjectLoader` | Project IDs → `Task[][]` | Per-request |
| `commentsByTaskLoader` | Task IDs → `Comment[][]` | Per-request |
| `tagsByIdsLoader` | Tag ID sets → `Tag[][]` | Per-request |

**Important:** A new `createLoaders()` call happens inside `buildContext` for every request. DataLoaders are never shared between requests — the cache is intentionally short-lived to prevent stale reads.

---

### Authentication & Authorization

**File:** [server/src/utils/auth.ts](server/src/utils/auth.ts)  
**File:** [server/src/context.ts](server/src/context.ts)

#### How it works

1. The client sends `Authorization: Bearer <token>` in the HTTP header (or `connectionParams` for WebSocket).
2. `buildContext` runs for every request, extracts the token, verifies it with `verifyToken`, and attaches `userId` and `userRole` to the context object.
3. Resolvers call `requireAuth(ctx.userId)` to assert the user is logged in, or `requireRole(ctx.userRole, Role.ADMIN)` for role checks.

```typescript
// context.ts — runs for every request
export function buildContext({ req }: { req: Request }): Context {
  const token = extractTokenFromHeader(req.headers.authorization);
  let userId, userRole;
  if (token) {
    try {
      ({ userId, userRole } = verifyToken(token));
    } catch { /* invalid token = unauthenticated */ }
  }
  return { userId, userRole, dataSources: ..., loaders: createLoaders(), pubsub };
}
```

#### Role Hierarchy

```
ADMIN (3) > MEMBER (2) > VIEWER (1)
```

`requireRole` compares numeric weights, so `requireRole(role, Role.MEMBER)` passes for both MEMBER and ADMIN.

#### Passwords

Stored as bcrypt hashes (cost factor 12). Plain-text passwords are never stored or logged.

#### Token Lifetime

Controlled by the `JWT_EXPIRES_IN` environment variable (default `7d`). On expiry, the client's error link catches the `UNAUTHENTICATED` code and redirects to login.

---

### Pagination

**File:** [server/src/utils/pagination.ts](server/src/utils/pagination.ts)

`paginate<T>(items, args)` implements the Relay Connection spec over any array of objects with an `id` field.

#### Cursor Encoding

Cursors are base64-encoded item IDs prefixed with `cursor:`:

```
encode: Buffer.from(`cursor:${id}`).toString('base64')
decode: Buffer.from(cursor, 'base64').toString().replace('cursor:', '')
```

This is opaque to clients — they must not construct or interpret cursors, only pass them back.

#### Usage in Resolvers

```typescript
// project.resolver.ts
projects: async (_, args, ctx) => {
  const projects = await ctx.dataSources.projects.findByMember(ctx.userId!);
  return paginate(projects, args); // args: { first?, after?, last?, before? }
},
```

The returned `Connection` object is then resolved by field resolvers in the schema automatically.

---

### Subscriptions

**File:** [server/src/resolvers/task.resolver.ts](server/src/resolvers/task.resolver.ts)

Real-time events are implemented with `graphql-subscriptions` (`PubSub`) over WebSockets via `graphql-ws`.

#### Events

| Event constant | Published when | Scoped to |
|---|---|---|
| `TASK_UPDATED.<projectId>` | `updateTask` mutation completes | Project |
| `TASK_CREATED.<projectId>` | `createTask` mutation completes | Project |
| `COMMENT_ADDED.<taskId>` | `addComment` mutation completes | Task |

Scoping the channel name by ID means a subscriber on project A never receives events from project B.

#### Publishing

```typescript
// After a successful updateTask:
pubsub.publish(`TASK_UPDATED.${task.projectId}`, {
  taskUpdated: { task, updatedBy: resolvedUser }
});
```

#### Subscribing (Schema)

```graphql
type Subscription {
  taskUpdated(projectId: ID!): TaskUpdatedPayload!
  taskCreated(projectId: ID!): Task!
  commentAdded(taskId: ID!): CommentAddedPayload!
}
```

#### Production Note

`PubSub` from `graphql-subscriptions` uses an in-process event emitter. For multi-instance deployments, swap it for `graphql-redis-subscriptions` or a similar adapter backed by Redis Pub/Sub.

---

### Error Handling

**File:** [server/src/utils/errors.ts](server/src/utils/errors.ts)

All custom errors extend `GraphQLError` with a typed `extensions.code` field that clients can match on:

| Class | Code | When to throw |
|---|---|---|
| `NotFoundError` | `NOT_FOUND` | Entity doesn't exist in the DB |
| `ValidationError` | `BAD_USER_INPUT` | Invalid input (duplicate email, bad format) |
| `ForbiddenError` | `FORBIDDEN` | Authenticated but not authorized |
| (built-in) `GraphQLError` | `UNAUTHENTICATED` | No valid token |

In production mode (`NODE_ENV=production`), the server's `formatError` hook strips stack traces and replaces unhandled errors with a generic message. Errors with an explicit `code` extension are always forwarded as-is.

---

### Data Layer

**Files:** [server/src/datasources/](server/src/datasources/)

The data layer uses in-memory `Map` stores that mirror how a real ORM/repository layer would be structured. Each API class has a single responsibility:

| Class | Responsibility |
|---|---|
| `UserAPI` | Register, authenticate, find users, update roles |
| `ProjectAPI` | Create/update/delete projects, manage membership |
| `TaskAPI` | CRUD tasks, filter by status/priority/assignee |
| `CommentAPI` | Create/delete comments scoped to a task |
| `TagAPI` | Read-only tag lookup |

To swap in a real database (e.g. Postgres via Prisma), replace the `Map` operations in each method body — the resolver code and tests don't change.

**Seed data** ([server/src/datasources/db.ts](server/src/datasources/db.ts)) creates 3 users, 2 projects, 9 tasks, 4 comments, and 5 tags on startup.

---

## React Client

### Apollo Client Setup

**File:** [react-client/src/apollo/client.ts](react-client/src/apollo/client.ts)

The Apollo Client uses a **split link** to route operations to the right transport:

```
Subscription operations  →  GraphQLWsLink (WebSocket)
Query / Mutation         →  authLink → errorLink → HttpLink
```

#### Link Chain (HTTP path)

1. **`errorLink`** — catches `UNAUTHENTICATED` errors, clears the token, and redirects to `/login`.
2. **`authLink`** — reads the JWT from `localStorage` and injects `Authorization: Bearer <token>`.
3. **`HttpLink`** — sends the request to `/graphql` (proxied to port 4000 by Vite).

#### Cache Policies

The `InMemoryCache` is configured with **merge functions** for paginated fields so that "load more" appends edges rather than replacing them:

```typescript
tasks: {
  keyArgs: ['filter'],   // separate cache entries per filter combination
  merge(existing, incoming) {
    return { ...incoming, edges: [...existing.edges, ...incoming.edges] };
  },
},
```

---

### GraphQL Operations

**File:** [react-client/src/gql/index.ts](react-client/src/gql/index.ts)

All GQL documents are co-located in a single file. They are composed using **fragments** to avoid field duplication:

```
USER_FIELDS fragment      ← used by TASK_FIELDS, PROJECT_FIELDS, and auth mutations
TASK_FIELDS fragment      ← used by task queries, mutations, and subscriptions
PROJECT_FIELDS fragment   ← used by project queries and mutations
```

Fragments are spread into documents at definition time (before the Apollo Client sees them), so there's no runtime overhead.

#### Operations Reference

| Export | Type | Purpose |
|---|---|---|
| `ME_QUERY` | Query | Fetch authenticated user |
| `PROJECTS_QUERY` | Query | Paginated project list for current user |
| `PROJECT_QUERY` | Query | Single project with paginated, filterable tasks |
| `TASK_QUERY` | Query | Single task with comments |
| `TAGS_QUERY` | Query | All available tags |
| `LOGIN_MUTATION` | Mutation | Authenticate and receive JWT |
| `REGISTER_MUTATION` | Mutation | Create account and receive JWT |
| `CREATE_PROJECT_MUTATION` | Mutation | New project (owner = current user) |
| `CREATE_TASK_MUTATION` | Mutation | New task in a project |
| `UPDATE_TASK_MUTATION` | Mutation | Partial task update |
| `DELETE_TASK_MUTATION` | Mutation | Remove task |
| `ADD_COMMENT_MUTATION` | Mutation | Add comment to task |
| `TASK_UPDATED_SUBSCRIPTION` | Subscription | Live task updates for a project |
| `TASK_CREATED_SUBSCRIPTION` | Subscription | New tasks for a project |
| `COMMENT_ADDED_SUBSCRIPTION` | Subscription | New comments for a task |

---

### Components

#### `TaskBoard`

**File:** [react-client/src/components/TaskBoard.tsx](react-client/src/components/TaskBoard.tsx)

Renders a five-column Kanban board (Backlog → Todo → In Progress → In Review → Done).

- Subscribes to `TASK_UPDATED` and `TASK_CREATED` via `useSubscription`. Apollo automatically updates the cache when subscription data arrives, and the board re-renders without any manual state management.
- Columns are derived from the `tasks` prop by filtering on `task.status` — no client-side state for column assignment.

#### `TaskCard`

**File:** [react-client/src/components/TaskCard.tsx](react-client/src/components/TaskCard.tsx)

Displays a single task with priority badge, tags, assignee avatar, and a "Move →" button.

- Clicking "Move →" calls `UPDATE_TASK_MUTATION` with the next status in the order array.
- Uses an **optimistic response** so the card visually moves before the server responds:
  ```typescript
  optimisticResponse: {
    updateTask: { ...task, status: nextStatus, __typename: 'Task' },
  }
  ```
  If the mutation fails, Apollo automatically rolls back the optimistic update.

---

### Hooks

#### `useAuth`

**File:** [react-client/src/hooks/useAuth.ts](react-client/src/hooks/useAuth.ts)

Centralises all authentication logic:

- `user` — the currently authenticated user (from `ME_QUERY` cache)
- `isAuthenticated` — derived from whether `me` is non-null
- `login(email, password)` — calls `LOGIN_MUTATION`, stores token, resets Apollo store
- `register(email, password, name)` — calls `REGISTER_MUTATION`, same post-steps
- `logout()` — removes token, clears Apollo store, redirects to `/login`

`client.resetStore()` after login re-executes all active queries so the UI reflects the new user's data without a page reload.

---

## Angular Client

### Apollo Angular Setup

**File:** [angular-client/src/app/app.config.ts](angular-client/src/app/app.config.ts)

Apollo is configured as an Angular provider using the `APOLLO_OPTIONS` injection token. The link chain is identical to the React client (split → error → auth → HTTP/WS) but built with Angular's `HttpLink` for compatibility with Angular's `HttpClient` interceptors.

The `ApolloModule` is imported via `importProvidersFrom` to make `Apollo` injectable throughout the application.

---

### Services

#### `AuthService`

**File:** [angular-client/src/app/services/auth.service.ts](angular-client/src/app/services/auth.service.ts)

Uses Angular 17 **Signals** for reactive auth state:

```typescript
private _user = signal<User | null>(null);
readonly user = this._user.asReadonly();          // expose read-only
readonly isAuthenticated = computed(() => !!this._user());  // derived signal
```

Signals integrate directly with Angular's change detection — any component reading `user()` or `isAuthenticated()` re-renders automatically when they change, without needing `async` pipes or `Observable` subscriptions for the state itself.

#### `TaskService`

**File:** [angular-client/src/app/services/task.service.ts](angular-client/src/app/services/task.service.ts)

Wraps all task-related Apollo operations and returns `Observable` streams. Consumers `subscribe()` in components and clean up in `ngOnDestroy`.

Key methods:

| Method | Returns | Notes |
|---|---|---|
| `getProject(id)` | `Observable<Project>` | `watchQuery` — emits on every cache update |
| `createTask(input)` | `Observable<Task>` | Refetches project query after creation |
| `updateTask(id, input)` | `Observable<Task>` | Sends optimistic response |
| `deleteTask(id)` | `Observable<boolean>` | |
| `addComment(taskId, content)` | `Observable<Comment>` | |
| `subscribeToTaskUpdates(projectId)` | `Observable<TaskUpdatedPayload>` | Maps over WS subscription |

---

### Angular Components

All components are **standalone** (no `NgModule` required) and use the modern Angular control flow syntax where applicable.

#### `LoginComponent`

**File:** [angular-client/src/app/pages/login/login.component.ts](angular-client/src/app/pages/login/login.component.ts)

- `mode` is a `signal<'login' | 'register'>` — toggling it shows/hides the Name field and changes the submit button label.
- Calls `AuthService.login()` or `AuthService.register()` and navigates to `/` on success.
- Error messages are surfaced via a `signal<string | null>`.

#### `DashboardComponent`

**File:** [angular-client/src/app/pages/dashboard/dashboard.component.ts](angular-client/src/app/pages/dashboard/dashboard.component.ts)

- Uses `apollo.watchQuery` with `PROJECTS_QUERY` and maps the result stream into `projects` and `totalCount` signals.
- `CREATE_PROJECT_MUTATION` uses `refetchQueries: ['Projects']` to invalidate and reload the list after creation.

#### `ProjectComponent`

**File:** [angular-client/src/app/pages/project/project.component.ts](angular-client/src/app/pages/project/project.component.ts)

- Loads project + tasks via `TaskService.getProject()`.
- Subscribes to `TASK_UPDATED_SUBSCRIPTION` via `TaskService.subscribeToTaskUpdates()` — shows a live banner when another user updates a task.
- Both subscriptions are stored in a `subs: Subscription[]` array and unsubscribed in `ngOnDestroy` to prevent memory leaks.
- `advanceTask(task)` moves the task to the next status in the ordered array, calling `TaskService.updateTask()`.

---

### Routing & Guards

**File:** [angular-client/src/app/app.routes.ts](angular-client/src/app/app.routes.ts)

Routes are lazy-loaded using `loadComponent` — each page is a separate bundle, downloaded only when navigated to.

Guards are **functional** (Angular 15+ style) — plain functions using `inject()` rather than classes implementing `CanActivate`:

```typescript
function authGuard() {
  const apollo = inject(Apollo);
  const router = inject(Router);
  return apollo.watchQuery({ query: ME_QUERY }).valueChanges.pipe(
    map((r) => r.data?.me),
    map((user) => user ? true : router.parseUrl('/login'))
  );
}
```

| Route | Guard | Behaviour |
|---|---|---|
| `/login` | `publicGuard` | Redirects authenticated users to `/` |
| `/` | `authGuard` | Redirects unauthenticated users to `/login` |
| `/projects/:id` | `authGuard` | Same |

---

## Testing

**File:** [server/src/__tests__/resolvers.test.ts](server/src/__tests__/resolvers.test.ts)

The server has Jest integration tests. They run against the actual in-memory data layer — no mocking — which means they catch real data-access bugs that unit tests with mocks would miss.

### Run tests

```bash
cd server
npm test
```

### Test coverage

| Suite | What it tests |
|---|---|
| `JWT utilities` | `signToken` → `verifyToken` round-trip; invalid token rejection |
| `Password utilities` | bcrypt hash + verify; wrong password returns false |
| `UserAPI` | Find all users; authenticate success; wrong password; duplicate email; new user role |
| `ProjectAPI` | Member-scoped project lookup |
| `TaskAPI` | Status filter; create task in project |
| `paginate()` | First N; cursor-based page 2; no-arg returns all |

### Test philosophy

- `beforeAll` seeds the database once; `afterAll` clears it.
- No HTTP server is started — tests import datasource and utility functions directly.
- Each test that writes data cleans up after itself (`db.tasks.delete(task.id)`) to keep tests independent.

---

## Seed Data

**File:** [server/src/datasources/db.ts](server/src/datasources/db.ts)

`seedDatabase()` is called on server startup and populates:

- **5 tags:** Frontend, Backend, Bug, Feature, Docs (each with a hex color)
- **3 users:** admin (ADMIN), bob (MEMBER), carol (MEMBER)
- **2 projects:** "TaskFlow Platform" (all 3 members), "Mobile App" (bob + carol)
- **9 tasks** spread across both projects, covering all status values
- **4 comments** on the first few tasks

The seed is deterministic in structure but uses `uuid()` for IDs, so IDs differ between restarts. Clients should not hardcode IDs.

---

## Environment Variables

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `JWT_SECRET` | `dev-secret-change-in-prod` | HMAC secret for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime (any `ms`-compatible string) |
| `NODE_ENV` | — | Set to `production` to suppress error details |

Create a `server/.env` file for local overrides. **Never commit real secrets.**

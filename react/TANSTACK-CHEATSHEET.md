# TanStack Cheatsheet

Quick reference for the TanStack libraries (React). Versions assume TanStack Query v5, Router v1, Table v8, Form v1.

| Library | Install | Solves |
| --- | --- | --- |
| Query | `@tanstack/react-query` | Server state: fetching, caching, sync, mutations |
| Router | `@tanstack/react-router` | Type-safe routing, search params, loaders |
| Table | `@tanstack/react-table` | Headless table logic (sort/filter/paginate) |
| Form | `@tanstack/react-form` | Headless, type-safe form state + validation |
| Virtual | `@tanstack/react-virtual` | Virtualize long lists/grids |
| Store | `@tanstack/react-store` | Framework-agnostic reactive store |

---

## TanStack Query

```bash
npm i @tanstack/react-query
npm i -D @tanstack/react-query-devtools
```

### Provider setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### useQuery

```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isPending, isError, error, refetch, isFetching } = useQuery({
  queryKey: ['todos', { status, page }], // serializable, used as cache id
  queryFn: ({ signal }) => fetch(`/api/todos?page=${page}`, { signal }).then(r => r.json()),
  enabled: !!status,        // gate the request
  staleTime: 30_000,        // how long data is "fresh" (no refetch)
  gcTime: 5 * 60_000,       // cache retained after unused (was cacheTime in v4)
  select: (d) => d.items,   // transform/derive without re-fetch
  placeholderData: (prev) => prev, // keep prior data while key changes (replaces keepPreviousData)
});
```

State flags: `isPending` (no data yet) · `isFetching` (any in-flight, incl. background) · `isSuccess` · `isError`.

### useMutation + cache updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const qc = useQueryClient();
const addTodo = useMutation({
  mutationFn: (todo: NewTodo) => api.post('/todos', todo),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});

addTodo.mutate(newTodo);
// or: await addTodo.mutateAsync(newTodo);
```

### Optimistic update pattern

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (next) => {
    await qc.cancelQueries({ queryKey: ['todos'] });
    const prev = qc.getQueryData(['todos']);
    qc.setQueryData(['todos'], (old) => applyEdit(old, next));
    return { prev };
  },
  onError: (_err, _next, ctx) => qc.setQueryData(['todos'], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});
```

### Other hooks

```tsx
useQueries({ queries: ids.map(id => ({ queryKey: ['todo', id], queryFn: () => get(id) })) });
useInfiniteQuery({ queryKey, queryFn, initialPageParam: 0, getNextPageParam: (last) => last.nextCursor });
const isFetching = useIsFetching();          // global loading indicator
qc.prefetchQuery({ queryKey, queryFn });     // warm cache before navigation
```

### Common gotchas

- `queryKey` must include every variable the `queryFn` reads, or you'll serve stale cache.
- `staleTime: 0` (default) refetches aggressively; bump it to cut requests.
- Don't put `queryClient` inside a component — create it once at module/root scope.

---

## TanStack Router

```bash
npm i @tanstack/react-router
npm i -D @tanstack/router-plugin   # file-based routing + codegen
```

### Code-based route tree

```tsx
import { createRouter, createRootRoute, createRoute, RouterProvider, Outlet, Link } from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: () => (<><nav><Link to="/">Home</Link></nav><Outlet /></>),
});

const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos/$todoId',
  loader: ({ params }) => fetchTodo(params.todoId),
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) ?? 'info' }),
  component: TodoPage,
});

const routeTree = rootRoute.addChildren([todoRoute]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export const App = () => <RouterProvider router={router} />;
```

### Reading params / search / navigating

```tsx
const { todoId } = todoRoute.useParams();
const { tab } = todoRoute.useSearch();
const data = todoRoute.useLoaderData();
const navigate = useNavigate();

navigate({ to: '/todos/$todoId', params: { todoId: '7' }, search: { tab: 'edit' } });
<Link to="/todos/$todoId" params={{ todoId: '7' }} search={{ tab: 'info' }}>Open</Link>
```

Pairs well with Query: call `queryClient.ensureQueryData(...)` inside a route `loader` for type-safe prefetch.

---

## TanStack Table (headless)

```bash
npm i @tanstack/react-table
```

```tsx
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  createColumnHelper, type SortingState,
} from '@tanstack/react-table';

const col = createColumnHelper<Person>();
const columns = [
  col.accessor('name', { header: 'Name', cell: (i) => i.getValue() }),
  col.accessor('age', { header: 'Age' }),
  col.display({ id: 'actions', cell: ({ row }) => <button onClick={() => edit(row.original)}>Edit</button> }),
];

function Table({ data }: { data: Person[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>{hg.headers.map(h => (
            <th key={h.id} onClick={h.column.getToggleSortingHandler()}>
              {flexRender(h.column.columnDef.header, h.getContext())}
              {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
            </th>
          ))}</tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>{row.getVisibleCells().map(c => (
            <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
          ))}</tr>
        ))}
      </tbody>
    </table>
  );
}
```

Headless = you render the markup; the table only computes models. Pagination: `table.nextPage()`, `table.getCanNextPage()`, `table.setPageSize(n)`.

---

## TanStack Form

```bash
npm i @tanstack/react-form
```

```tsx
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { email: '', age: 0 },
  onSubmit: async ({ value }) => { await save(value); },
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
  <form.Field
    name="email"
    validators={{ onChange: ({ value }) => (!value.includes('@') ? 'Invalid email' : undefined) }}
  >
    {(field) => (
      <>
        <input
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        {field.state.meta.errors.length > 0 && <em>{field.state.meta.errors.join(', ')}</em>}
      </>
    )}
  </form.Field>

  <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
    {([canSubmit, isSubmitting]) => (
      <button type="submit" disabled={!canSubmit}>{isSubmitting ? '...' : 'Submit'}</button>
    )}
  </form.Subscribe>
</form>
```

Async validation: `validators={{ onChangeAsync: async ({ value }) => ..., onChangeAsyncDebounceMs: 300 }}`. Standard-schema validators (Zod/Valibot) can be passed directly to `validators`.

---

## TanStack Virtual

```bash
npm i @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  overscan: 5,
});

<div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
  <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
    {rowVirtualizer.getVirtualItems().map(v => (
      <div key={v.key} style={{ position: 'absolute', top: 0, transform: `translateY(${v.start}px)`, height: v.size }}>
        {items[v.index].label}
      </div>
    ))}
  </div>
</div>
```

---

## Migration notes (v4 → v5 Query)

- `cacheTime` → `gcTime`
- `keepPreviousData: true` → `placeholderData: (prev) => prev`
- `isLoading` → `isPending` (for "no data yet"); `isLoading === isPending && isFetching`
- Single object signature only: `useQuery({ queryKey, queryFn })` (no positional args)
- Callbacks `onSuccess`/`onError`/`onSettled` removed from `useQuery` (still on `useMutation`)

## Links

- Query: https://tanstack.com/query/latest
- Router: https://tanstack.com/router/latest
- Table: https://tanstack.com/table/latest
- Form: https://tanstack.com/form/latest
- Virtual: https://tanstack.com/virtual/latest

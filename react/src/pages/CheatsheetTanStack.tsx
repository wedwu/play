import "./Cheatsheet.css";

interface Section {
  title: string;
  summary: string;
  items: { label: string; code: string }[];
}

const sections: Section[] = [
  {
    title: "Query — Setup",
    summary:
      "Server-state library for fetching, caching & syncing async data. Create one QueryClient and wrap the app in its provider so any component can run queries.",
    items: [
      {
        label: "Install",
        code: `npm i @tanstack/react-query
npm i -D @tanstack/react-query-devtools`,
      },
      {
        label: "Provider",
        code: `const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>`,
      },
    ],
  },
  {
    title: "Query — useQuery",
    summary:
      "Declaratively read async data, identified by a serializable queryKey. Returns the data plus loading/error flags and refetches automatically when the key changes or data goes stale.",
    items: [
      {
        label: "Basic fetch",
        code: `const { data, isPending, isError, error } = useQuery({
  queryKey: ['todos', { status, page }],
  queryFn: ({ signal }) =>
    fetch(\`/api/todos?page=\${page}\`, { signal })
      .then(r => r.json()),
});`,
      },
      {
        label: "Common options",
        code: `useQuery({
  queryKey: ['todo', id],
  queryFn: () => getTodo(id),
  enabled: !!id,            // gate the request
  staleTime: 30_000,        // how long data is "fresh"
  gcTime: 5 * 60_000,       // cache kept after unused
  select: (d) => d.items,   // derive without re-fetch
  placeholderData: (prev) => prev, // keep old data
});`,
      },
      {
        label: "State flags",
        code: `isPending   // no data yet
isFetching  // any request in-flight (incl. background)
isSuccess   // data is available
isError     // query failed -> read \`error\``,
      },
    ],
  },
  {
    title: "Query — Mutations",
    summary:
      "Write data (create/update/delete) with useMutation. After it succeeds you invalidate or directly patch the cache so queries reflect the change — optionally updating the UI optimistically and rolling back on error.",
    items: [
      {
        label: "useMutation",
        code: `const qc = useQueryClient();
const addTodo = useMutation({
  mutationFn: (todo: NewTodo) => api.post('/todos', todo),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});

addTodo.mutate(newTodo);
// or: await addTodo.mutateAsync(newTodo);`,
      },
      {
        label: "Optimistic update",
        code: `useMutation({
  mutationFn: updateTodo,
  onMutate: async (next) => {
    await qc.cancelQueries({ queryKey: ['todos'] });
    const prev = qc.getQueryData(['todos']);
    qc.setQueryData(['todos'], (old) => applyEdit(old, next));
    return { prev };
  },
  onError: (_e, _next, ctx) => qc.setQueryData(['todos'], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});`,
      },
    ],
  },
  {
    title: "Query — More hooks",
    summary:
      "Beyond the basics: run a dynamic list of queries in parallel, paginate endlessly with cursor-based loading, or prefetch data into the cache before the user navigates to it.",
    items: [
      {
        label: "Parallel / infinite / prefetch",
        code: `useQueries({
  queries: ids.map(id => ({ queryKey: ['todo', id], queryFn: () => get(id) })),
});

useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => getFeed(pageParam),
  initialPageParam: 0,
  getNextPageParam: (last) => last.nextCursor,
});

qc.prefetchQuery({ queryKey, queryFn }); // warm cache`,
      },
    ],
  },
  {
    title: "Router",
    summary:
      "Fully type-safe client-side router: route paths, params, search params and loader data are all inferred end-to-end, so navigation and data-loading are checked at compile time.",
    items: [
      {
        label: "Install",
        code: `npm i @tanstack/react-router
npm i -D @tanstack/router-plugin`,
      },
      {
        label: "Route tree",
        code: `const rootRoute = createRootRoute({
  component: () => <><nav>...</nav><Outlet /></>,
});

const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos/$todoId',
  loader: ({ params }) => fetchTodo(params.todoId),
  component: TodoPage,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([todoRoute]),
});

<RouterProvider router={router} />;`,
      },
      {
        label: "Params, search & navigate",
        code: `const { todoId } = todoRoute.useParams();
const { tab } = todoRoute.useSearch();
const data = todoRoute.useLoaderData();

const navigate = useNavigate();
navigate({ to: '/todos/$todoId', params: { todoId: '7' } });

<Link to="/todos/$todoId" params={{ todoId: '7' }}>Open</Link>`,
      },
    ],
  },
  {
    title: "Table (headless)",
    summary:
      "Provides all the table logic — sorting, filtering, pagination, selection, grouping — without rendering any markup or styles itself. You own the HTML (table/tr/td); the library computes the rows & cells and hands them to you via flexRender.",
    items: [
      {
        label: "Columns",
        code: `const col = createColumnHelper<Person>();
const columns = [
  col.accessor('name', { header: 'Name' }),
  col.accessor('age', { header: 'Age' }),
  col.display({
    id: 'actions',
    cell: ({ row }) => <button onClick={() => edit(row.original)}>Edit</button>,
  }),
];`,
      },
      {
        label: "useReactTable",
        code: `const [sorting, setSorting] = useState<SortingState>([]);
const table = useReactTable({
  data, columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});`,
      },
      {
        label: "Render with flexRender",
        code: `{table.getRowModel().rows.map(row => (
  <tr key={row.id}>
    {row.getVisibleCells().map(c => (
      <td key={c.id}>
        {flexRender(c.column.columnDef.cell, c.getContext())}
      </td>
    ))}
  </tr>
))}`,
      },
    ],
  },
  {
    title: "Form",
    summary:
      "Headless, fully type-safe form state with per-field validation (sync or async, including Zod/Valibot schemas). Subscribes granularly so only the fields that change re-render.",
    items: [
      {
        label: "useForm",
        code: `const form = useForm({
  defaultValues: { email: '', age: 0 },
  onSubmit: async ({ value }) => { await save(value); },
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
  ...
</form>`,
      },
      {
        label: "Field + validation",
        code: `<form.Field
  name="email"
  validators={{
    onChange: ({ value }) =>
      !value.includes('@') ? 'Invalid email' : undefined,
  }}
>
  {(field) => (
    <input
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>`,
      },
    ],
  },
  {
    title: "Virtual",
    summary:
      "Renders only the rows/items currently visible in the scroll viewport, so a list of 100,000 items mounts ~20 DOM nodes. You give it the total count, scroll element and an estimateSize; it returns the visible virtual items with positions to absolutely-place inside a full-height spacer — keeping scrolling smooth and memory low.",
    items: [
      {
        label: "useVirtualizer",
        code: `const parentRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  overscan: 5,
});

rowVirtualizer.getVirtualItems().map(v => (
  <div key={v.key} style={{
    position: 'absolute',
    transform: \`translateY(\${v.start}px)\`,
    height: v.size,
  }}>
    {items[v.index].label}
  </div>
));`,
      },
    ],
  },
  {
    title: "Migration (v4 → v5 Query)",
    summary:
      "The breaking renames and removals to watch for when upgrading React Query from v4 to v5.",
    items: [
      {
        label: "Renames & removals",
        code: `cacheTime              -> gcTime
keepPreviousData: true -> placeholderData: (prev) => prev
isLoading              -> isPending  (no data yet)

// Object signature only:
useQuery({ queryKey, queryFn })

// onSuccess/onError/onSettled removed from useQuery
// (still available on useMutation)`,
      },
    ],
  },
];

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CheatsheetTanStack = () => {
  return (
    <div className="cheatsheet">
      <h1 id="top">TanStack Cheatsheet</h1>
      <p className="subtitle">
        Quick reference for TanStack Query, Router, Table, Form & Virtual.
      </p>

      <nav className="cs-toc">
        {sections.map((section) => (
          <a key={section.title} href={`#${slug(section.title)}`}>
            {section.title}
          </a>
        ))}
      </nav>

      <div className="cs-grid">
        {sections.map((section) => (
          <div key={section.title} id={slug(section.title)} className="cs-card">
            <h2>{section.title}</h2>
            <p className="cs-summary">{section.summary}</p>
            {section.items.map((item) => (
              <div key={item.label} className="cs-item">
                <p className="cs-label">{item.label}</p>
                <pre>
                  <code>{item.code}</code>
                </pre>
              </div>
            ))}
            <a className="cs-top" href="#top" title="Return to top" aria-label="Return to top">
              <span className="material-icons">arrow_upward</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheatsheetTanStack;

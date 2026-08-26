export type QA = { q: string; a: string };
export type Topic = { topic: string; items: QA[] };

/**
 * Model answers to the most common React / TS / tooling interview questions —
 * the verbal counterpart to the live-coding tabs on this page. Answers are
 * written to avoid restating the question's key terms, so they double as quiz
 * options without giving themselves away. In comparison questions, "the first"
 * and "the second" map to the order the items appear in the question.
 */
export const QA: Topic[] = [
  {
    topic: "React fundamentals",
    items: [
      {
        q: "What problem do hooks solve that class components didn't?",
        a: "They let function components hold state and run lifecycle-style logic, and — crucially — let you extract and reuse stateful behavior without HOCs or render props. Code is grouped by concern instead of scattered across componentDidMount/Update/Unmount.",
      },
      {
        q: "Why does every list item need a stable key, and why is the array index a bad key?",
        a: "React matches elements across renders by identity to reuse DOM instead of recreating it. Using position breaks on reorder/insert/delete — the wrong DOM and state stay tied to the wrong row (inputs visibly jump). Use a stable id from the data instead.",
      },
      {
        q: "useMemo vs useCallback — when is each worth it?",
        a: "The first caches a computed value; the second caches a function reference (it's the same primitive wrapping a function). Worth it only when the computation is genuinely expensive, or when a stable identity keeps a memoized child or effect from re-running — otherwise it's pure overhead.",
      },
      {
        q: "useEffect dependency array — omit it, empty it, or lie about it?",
        a: "Omit it → runs after every render. Empty [] → runs once on mount (with cleanup on unmount). List values → re-runs whenever any of them change. Leaving out a value the callback reads gives stale closures: it captures old values and silently misbehaves.",
      },
      {
        q: "What's a stale-closure bug and how do you fix it?",
        a: "A callback or effect captures state from the render that created it; if it runs later it still sees that old value. Fix by listing the value as a dependency, using the functional updater setX(prev => …), or holding the latest value in a ref.",
      },
      {
        q: "What is reconciliation and the virtual DOM?",
        a: "On each render React builds a lightweight in-memory tree, diffs it against the previous one, and applies the minimal set of real DOM mutations. Element type and keys drive how nodes are matched between renders.",
      },
      {
        q: "Controlled vs uncontrolled components?",
        a: "In the first, the input's value lives in React state and is driven by onChange (single source of truth, easy live validation). In the second, the DOM keeps the value and you read it via a ref or defaultValue — simpler for basic forms but harder to validate as you type.",
      },
      {
        q: "Why can Context hurt performance, and how do you mitigate it?",
        a: "Every consumer re-renders whenever the provider's value changes, even unrelated ones. Mitigate by splitting into focused providers, memoizing the value you pass, or using a selector-based store (Zustand, Redux, TanStack Store) for high-frequency updates.",
      },
      {
        q: "What do useTransition and useDeferredValue do?",
        a: "They mark work as non-urgent so the UI stays responsive. The first wraps a state update React can interrupt or defer (exposing an isPending flag); the second lets an expensive derived value lag behind a fast-changing input. Both rely on concurrent rendering.",
      },
      {
        q: "useEffect vs useLayoutEffect?",
        a: "The first runs asynchronously after the browser paints; the second runs synchronously after DOM mutations but before paint — use that one to measure or mutate layout without a visible flicker. The synchronous variant blocks painting, so prefer the async one by default.",
      },
      {
        q: "What is an error boundary?",
        a: "A (still class-based) component using getDerivedStateFromError / componentDidCatch that catches render-time failures in its subtree and shows a fallback instead of crashing the whole app. It does not catch failures in event handlers, async code, or SSR.",
      },
      {
        q: "What's new in React 19 an interviewer might probe?",
        a: "Actions + useActionState for form submissions, useOptimistic for optimistic UI, the use() primitive to read promises/context, ref passed as a normal prop (no forwardRef), and the compiler that auto-memoizes — cutting manual useMemo/useCallback.",
      },
    ],
  },
  {
    topic: "Custom hooks",
    items: [
      {
        q: "Walk through useDebounce — why debounce a search input?",
        a: "Hold the value in state, start a timeout to copy it after a delay, and clear that timeout on every change via the effect cleanup. The returned value only settles once the user stops typing — so you fire one API call instead of one per keystroke.",
      },
      {
        q: "In useFetch, why abort the in-flight request on URL change or unmount?",
        a: "To kill a race condition: a slow earlier request can resolve after a newer one and overwrite fresh data (or set state on a gone component). An AbortController cancels the stale request so only the latest result wins.",
      },
      {
        q: "Why must hooks be called unconditionally, in the same order every render?",
        a: "React tracks their state by call position, not by name. Putting one inside a condition or loop shifts that position, so React associates the wrong state with the wrong call — which is exactly what the rules-of-hooks lint rule prevents.",
      },
    ],
  },
  {
    topic: "TanStack Query / data fetching",
    items: [
      {
        q: "What is 'server state' and why is it different from client state?",
        a: "It's data you don't own — it lives remotely, can go stale, is shared, and changes without you, so it needs caching, background refetching, and invalidation. That's unlike the local, synchronous, fully-owned kind (form inputs, toggles).",
      },
      {
        q: "What does a queryKey do, and what breaks if you leave a variable out of it?",
        a: "It's the cache identity — the same one means the same cached entry. If a value the fetcher reads isn't included, different inputs share one cache slot, so you serve stale/wrong data and never refetch when that value changes.",
      },
      {
        q: "isPending vs isFetching?",
        a: "The first means there's no cached data yet (the very first load). The second means a request is in flight at all, including background refetches when data already exists — so the second can be true without the first.",
      },
      {
        q: "How does an optimistic update work, and how do you roll it back?",
        a: "In onMutate: cancel in-flight queries, snapshot the current cache, then write the expected result immediately so the UI updates instantly. On error, restore the snapshot; in onSettled, invalidate to resync with the server's truth.",
      },
      {
        q: "staleTime vs gcTime?",
        a: "The first is how long fetched data is treated as fresh (no refetch during that window). The second is how long an unused/inactive query stays cached before it's garbage-collected.",
      },
      {
        q: "invalidateQueries vs refetch?",
        a: "The first is key-based and broad: it marks matching queries stale so they refetch when next observed (active ones immediately). The second re-runs a single query you hold a handle to. Use the first after mutations, the second for a manual 'reload this'.",
      },
      {
        q: "When do you use useInfiniteQuery?",
        a: "For paginated / 'load more' / endless-scroll data. It keeps all pages in one cache entry; you supply getNextPageParam to derive the next cursor, fetchNextPage appends a page, and hasNextPage tells you when to stop.",
      },
      {
        q: "TanStack Router vs React Router — why pick Router?",
        a: "It's built for end-to-end type safety: path params, search params, and loader data are all inferred and typed, with first-class search-param state and built-in data loading. The more established alternative is lighter on types.",
      },
      {
        q: "What does TanStack Form give you over plain useState?",
        a: "Headless, fully typed form state with granular field subscriptions (only changed fields re-render), sync and async validation, and standard-schema validators like Zod — all without dictating any markup.",
      },
      {
        q: "What do the React Query Devtools show?",
        a: "Every query and mutation with its key, status, last-updated time, cached data, and observer count — so you can watch fetching, caching, staleness, and invalidation happen live while debugging.",
      },
    ],
  },
  {
    topic: "TypeScript",
    items: [
      {
        q: "interface vs type — when do you reach for each?",
        a: "Reach for the first for object/class shapes you may extend or merge; the second for unions, intersections, primitives, tuples, and mapped/conditional shapes. They overlap for plain objects — favor the extensible one for public APIs, the flexible one for everything else.",
      },
      {
        q: "What's a generic, and why is useFetchQuery<T> better than returning any?",
        a: "A type parameter that links inputs to outputs. With <T>, the returned data is typed as T, so you keep full checking and autocomplete; the escape-hatch alternative throws all of that away and lets bugs through silently.",
      },
      {
        q: "unknown vs any?",
        a: "Both can hold any value, but the first forces you to narrow or check before using it (safe), while the second disables type checking entirely (unsafe). Prefer the safe one at the boundaries of your app.",
      },
      {
        q: "What is a discriminated union and why model async state with one?",
        a: "A set of object types sharing a literal tag field (e.g. status) that TS narrows on. Modeling async as idle | loading | success | error means each state carries only its valid data — no data while loading, no stale error on success — so impossible UI states can't be rendered.",
      },
      {
        q: "What do 'as const' and 'satisfies' do?",
        a: "The first freezes a literal to its narrowest readonly type ('dark' instead of string). The second checks a value against a type without widening it — you validate the shape but keep the precise inferred type (great for config objects and route maps).",
      },
      {
        q: "Name some built-in utility types and when you'd use them.",
        a: "Partial<T> for patch objects, Pick<T,K> / Omit<T,K> to derive a subset, Record<K,V> for dictionaries, Required / Readonly, and ReturnType / Parameters / Awaited to extract from functions and promises. They keep derived types in sync with their source.",
      },
      {
        q: "What does <T extends …> mean?",
        a: "It constrains a type parameter so it must be assignable to the given shape, letting you safely access its members while preserving the specific type passed in — e.g. requiring { id: number } guarantees every value has an id.",
      },
      {
        q: "How do you narrow a union type at runtime?",
        a: "With typeof / instanceof / 'in' checks, comparing a discriminant field, or a user-defined guard (fn(x): x is T). Inside the resulting branch TS treats the value as the specific member.",
      },
    ],
  },
  {
    topic: "Material UI (MUI)",
    items: [
      {
        q: "What is Material UI?",
        a: "A React component library implementing Google's Material Design — prebuilt, accessible components (Button, Dialog, DataGrid…) with a powerful theming system, built on the Emotion CSS-in-JS engine.",
      },
      {
        q: "sx prop vs styled() vs the old makeStyles?",
        a: "The first is for one-off styling with theme access and shorthand props — great for quick tweaks. The second builds a reusable pre-styled component. The third (v4/JSS) is legacy; v5+ runs on Emotion, so prefer the first two.",
      },
      {
        q: "How does MUI theming work?",
        a: "You define palette, typography, spacing, breakpoints, and component defaults in one object and wrap the app in a provider. Components read it automatically; you reach it in sx callbacks or via useTheme() — giving centralized design tokens and easy dark mode.",
      },
      {
        q: "What styling engine does MUI v5+ use?",
        a: "Emotion (CSS-in-JS) by default — styles are generated at runtime and scoped per component. You can swap in styled-components, and for SSR you set up a cache to avoid a style-flash on first paint.",
      },
      {
        q: "How do you keep MUI from bloating the bundle?",
        a: "Use named imports (v5 is tree-shakeable), pull in icons individually instead of the whole pack, lean on the theme rather than duplicating styles, and lazy-load heavy packages like the X DataGrid / DatePickers.",
      },
      {
        q: "How does material-react-table relate to TanStack Table?",
        a: "It's a batteries-included table built on top of TanStack Table's headless logic, wrapping it in Material components — so you get the sorting/filtering/pagination engine with finished styling out of the box.",
      },
      {
        q: "How does MUI handle responsive layout?",
        a: "Through theme breakpoints (xs/sm/md/lg/xl). Grid and Stack plus the sx prop accept per-breakpoint objects like { xs: 12, md: 6 }, and useMediaQuery lets you branch logic on a breakpoint.",
      },
    ],
  },
  {
    topic: "Tooling & general",
    items: [
      {
        q: "Why Vite over CRA / Webpack?",
        a: "It serves native ES modules in dev for near-instant startup and HMR (no upfront bundle), then ships an optimized Rollup build for production. The older tools bundle everything first, which gets slower as the app grows.",
      },
      {
        q: "What is a 'headless' library (e.g. TanStack Table)?",
        a: "One that provides the behavior, logic, and state but no markup or styling — it computes things like sorting/filtering/pagination and you render the HTML. You get full design control while the hard logic is handled for you.",
      },
      {
        q: "How does code-splitting with lazy + Suspense improve load time?",
        a: "It splits a component into its own chunk loaded on demand, with a fallback shown while that chunk arrives. The initial bundle shrinks so first paint is faster, and rarely-used routes only download when a user actually visits them.",
      },
      {
        q: "What does Vite use under the hood for dev vs production?",
        a: "Dev relies on esbuild to pre-bundle dependencies and serves your app source as native ESM (no app bundling). Production runs a Rollup build with tree-shaking, code-splitting, and minification.",
      },
      {
        q: "How do environment variables work in Vite?",
        a: "Vars prefixed VITE_ are exposed on import.meta.env (e.g. import.meta.env.VITE_API_URL), loaded from .env files per mode. The required prefix prevents you from accidentally shipping server-only secrets to the client bundle.",
      },
      {
        q: "How do you set up an import alias like @/ in Vite?",
        a: "Add resolve.alias in the config ('@' → /src) for the bundler, and a matching paths entry (plus baseUrl) in tsconfig for TypeScript. Both are needed — one resolves modules at build/runtime, the other powers type-checking and editor support.",
      },
      {
        q: "What are Vite plugins — name one you've used?",
        a: "They hook into the Rollup/Vite pipeline to transform code, following the Rollup plugin API plus extra build-tool-specific hooks. The everyday one is @vitejs/plugin-react, which wires up JSX and Fast Refresh (HMR).",
      },
    ],
  },
];

import { useQuery } from "@tanstack/react-query";

/**
 * Same job as `useFetch`, but powered by TanStack Query instead of a hand-rolled
 * reducer + useEffect. You get caching, request de-duplication, background
 * refetching, and automatic retry/stale handling for free.
 *
 * Requires a `<QueryClientProvider>` somewhere above the component (see main.tsx).
 *
 * The fetch itself still aborts on unmount/key-change via the `signal` Query
 * hands the queryFn — so the same race-condition guarantee as `useFetch` holds.
 * Pass `url = null` to stay idle (the query is simply disabled).
 */
export function useFetchQuery<T>(url: string | null) {
  return useQuery<T>({
    // The URL is the cache key: identical URLs share one cached result.
    queryKey: ["fetch", url],
    queryFn: async ({ signal }) => {
      const res = await fetch(url as string, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    },
    enabled: !!url, // null url -> query stays idle (pending, not fetching)
  });
}

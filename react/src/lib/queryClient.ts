import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient. Kept at module scope (not created in a component)
 * so the cache persists across renders and there's exactly one instance no
 * matter which entry point or page mounts the app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

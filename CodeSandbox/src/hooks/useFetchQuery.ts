import { useQuery } from "@tanstack/react-query";

export function useFetchQuery<T>(url: string | null) {
  return useQuery<T>({
    queryKey: ["fetch", url],
    queryFn: async ({ signal }) => {
      const res = await fetch(url as string, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    },
    enabled: !!url,
  });
}

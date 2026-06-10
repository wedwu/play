import { useEffect, useReducer } from "react";

/**
 * Discriminated-union state — the interview-favorite way to model async.
 * Each variant carries exactly the data valid in that state (no `data` while
 * loading, no stale `error` on success), so the UI can't render impossible
 * combinations.
 */
export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string };

function reducer<T>(_state: FetchState<T>, action: Action<T>): FetchState<T> {
  switch (action.type) {
    case "start":
      return { status: "loading" };
    case "success":
      return { status: "success", data: action.data };
    case "error":
      return { status: "error", error: action.error };
  }
}

/**
 * Generic data fetcher. Aborts the in-flight request on URL change/unmount so
 * a slow response can't overwrite a newer one (the classic race-condition bug).
 * Pass `url = null` to stay idle (e.g. empty search box).
 */
export function useFetch<T>(url: string | null): FetchState<T> {
  const [state, dispatch] = useReducer(reducer<T>, { status: "idle" });

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    dispatch({ type: "start" });

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => dispatch({ type: "success", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        dispatch({ type: "error", error: err instanceof Error ? err.message : "Unknown error" });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

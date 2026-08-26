import { useEffect, useReducer } from "react";

export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string };

const reducer = <T>(
  _state: FetchState<T>,
  action: Action<T>
): FetchState<T> => {
  switch (action.type) {
    case "start":
      return { status: "loading" };
    case "success":
      return { status: "success", data: action.data };
    case "error":
      return { status: "error", error: action.error };
  }
};

export const useFetch = <T>(url: string | null): FetchState<T> => {
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
        dispatch({
          type: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });

    return () => controller.abort();
  }, [url]);

  return state;
};

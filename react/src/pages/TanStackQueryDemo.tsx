import { useState } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useFetchQuery } from "@/hooks/useFetchQuery";
import { queryClient } from "@/lib/queryClient";
import "./TanStackQueryDemo.css";

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

const IDS = [1, 2, 3, 4, 5];
const urlFor = (id: number) => `https://jsonplaceholder.typicode.com/todos/${id}`;

/**
 * Live demo of useFetchQuery. Surfaces the same cache state the TanStack
 * Devtools show — status flags, last-updated time, which IDs are cached — so
 * you can watch caching/refetching happen right in the page.
 */
const TanStackQueryDemoInner = () => {
  const [id, setId] = useState(1);
  const qc = useQueryClient();
  const url = urlFor(id);
  const { data, isPending, isFetching, isError, error, isSuccess, dataUpdatedAt, refetch } =
    useFetchQuery<Todo>(url);

  // A query already in the cache resolves instantly on revisit (no spinner).
  const isCached = (n: number) => qc.getQueryData<Todo>(["fetch", urlFor(n)]) !== undefined;

  // What's actually happening, in one label.
  const phase = isPending
    ? { label: "Loading (first fetch)", className: "loading" }
    : isError
      ? { label: "Error", className: "error" }
      : isFetching
        ? { label: "Refetching (background)", className: "fetching" }
        : { label: "Success — served from cache", className: "success" };

  return (
    <div className="tsq-demo">
      <h1>useFetchQuery — Live</h1>
      <p className="tsq-sub">
        Backed by TanStack Query. Switch IDs: the first visit fetches (watch the badge flash),
        revisiting is instant from cache. The same state is mirrored in the floating TanStack
        Devtools (bottom-left).
      </p>

      <div className="tsq-ids">
        {IDS.map((n) => (
          <button
            key={n}
            className={`tsq-id ${n === id ? "active" : ""} ${isCached(n) ? "cached" : ""}`}
            onClick={() => setId(n)}
            title={isCached(n) ? "Cached — instant" : "Not yet fetched"}
          >
            Todo #{n}
            {isCached(n) && <span className="material-icons">bolt</span>}
          </button>
        ))}
      </div>

      <div className={`tsq-badge ${phase.className}`}>
        <span className="tsq-dot" />
        {phase.label}
      </div>

      <div className="tsq-flags">
        <Flag on={isPending} label="isPending" />
        <Flag on={isFetching} label="isFetching" />
        <Flag on={isSuccess} label="isSuccess" />
        <Flag on={isError} label="isError" />
      </div>

      <div className="tsq-panel">
        {isError ? (
          <p className="tsq-err">{(error as Error)?.message ?? "Request failed"}</p>
        ) : data ? (
          <dl className="tsq-data">
            <dt>id</dt>
            <dd>{data.id}</dd>
            <dt>title</dt>
            <dd>{data.title}</dd>
            <dt>completed</dt>
            <dd>{String(data.completed)}</dd>
            <dt>userId</dt>
            <dd>{data.userId}</dd>
          </dl>
        ) : (
          <p className="tsq-skeleton">Fetching…</p>
        )}
      </div>

      <div className="tsq-meta">
        <span>
          Last updated:{" "}
          {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
        </span>
        <div className="tsq-actions">
          <button onClick={() => refetch()}>
            <span className="material-icons">refresh</span> Refetch
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["fetch", url] })}
            title="Mark stale so the next read refetches"
          >
            <span className="material-icons">delete_sweep</span> Invalidate
          </button>
        </div>
      </div>
    </div>
  );
};

const Flag = ({ on, label }: { on: boolean; label: string }) => (
  <span className={`tsq-flag ${on ? "on" : ""}`}>
    <span className="material-icons">{on ? "check_circle" : "radio_button_unchecked"}</span>
    {label}
  </span>
);

// Self-provide the client so the page works under any entry point.
const TanStackQueryDemo = () => (
  <QueryClientProvider client={queryClient}>
    <TanStackQueryDemoInner />
  </QueryClientProvider>
);

export default TanStackQueryDemo;

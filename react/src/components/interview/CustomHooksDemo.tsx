import { useCallback, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetch, type FetchState } from "@/hooks/useFetch";
import { useFetchQuery } from "@/hooks/useFetchQuery";
import { queryClient } from "@/lib/queryClient";
import { ui } from "./styles";

/**
 * CHALLENGE: "Write a custom hook." The three most-asked are useDebounce,
 * useFetch, and useLocalStorage. This page wires all three together so you can
 * see them working. useLocalStorage is defined inline below as a reference.
 */

/** Persist state to localStorage, typed and lazily initialised. */
const useLocalStorage = <T,>(key: string, initial: T): [T, (value: T) => void] => {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStored(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota / private mode — ignore */
      }
    },
    [key]
  );

  return [stored, setValue];
};

type GitHubUser = { login: string; name: string | null; avatar_url: string; followers: number };

const CustomHooksDemoInner = () => {
  // --- useLocalStorage: survives reloads ---
  const [name, setName] = useLocalStorage("interview:name", "");

  // --- useDebounce + useFetch / useFetchQuery: live GitHub user lookup ---
  const [handle, setHandle] = useState("");
  const [useQueryHook, setUseQueryHook] = useState(false);
  const debouncedHandle = useDebounce(handle, 500);
  const url = debouncedHandle.trim() ? `https://api.github.com/users/${debouncedHandle}` : null;

  // Both hooks must be called every render, but only the active one is given the
  // URL — the other gets `null` and stays idle, so we never double-fetch.
  const plainState = useFetch<GitHubUser>(useQueryHook ? null : url);
  const query = useFetchQuery<GitHubUser>(useQueryHook ? url : null);

  // Normalise the TanStack result back into the same FetchState union so the
  // render below stays identical regardless of which hook is driving it.
  const queryState: FetchState<GitHubUser> = !url
    ? { status: "idle" }
    : query.isError
      ? { status: "error", error: (query.error as Error)?.message ?? "Unknown error" }
      : query.data
        ? { status: "success", data: query.data }
        : { status: "loading" };

  const state = useQueryHook ? queryState : plainState;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={ui.panel}>
        <p style={ui.label}>useLocalStorage — refresh the page, this persists</p>
        <input
          value={name}
          placeholder="Type your name…"
          style={{ ...ui.input, marginTop: 8 }}
          onChange={(e) => setName(e.target.value)}
        />
        {name && (
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#4ade80",
              fontFamily: "monospace",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            Hello, {name}
            <span className="material-icons" style={{ fontSize: 16 }}>
              waving_hand
            </span>
            (stored under "interview:name")
          </p>
        )}
      </div>

      <div style={ui.panel}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p style={ui.label}>
            useDebounce + {useQueryHook ? "useFetchQuery" : "useFetch"} — live GitHub lookup (try
            "watsonink" or "wedwu")
          </p>
          <div
            role="group"
            aria-label="Data-fetching hook"
            style={{
              display: "inline-flex",
              borderRadius: 8,
              border: "1px solid #30363d",
              overflow: "hidden",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {[
              { on: false, text: "useFetch" },
              { on: true, text: "useFetchQuery" },
            ].map(({ on, text }) => (
              <button
                key={text}
                onClick={() => setUseQueryHook(on)}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  cursor: "pointer",
                  background: useQueryHook === on ? "#1f6feb" : "transparent",
                  color: useQueryHook === on ? "#fff" : "#8b949e",
                }}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <input
          value={handle}
          placeholder="GitHub username…"
          style={{ ...ui.input, marginTop: 8 }}
          onChange={(e) => setHandle(e.target.value)}
        />
        <div style={{ marginTop: 14, minHeight: 64 }}>
          {state.status === "idle" && <p style={ui.muted}>Start typing to search…</p>}
          {state.status === "loading" && <p style={ui.muted}>Loading…</p>}
          {state.status === "error" && (
            <p style={{ ...ui.muted, color: "#f87171" }}>Error: {state.error}</p>
          )}
          {state.status === "success" && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={state.data.avatar_url}
                alt={state.data.login}
                width={48}
                height={48}
                style={{ borderRadius: "50%", border: "1px solid #30363d" }}
              />
              <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                <div style={{ color: "#e6edf3", fontWeight: 600 }}>
                  {state.data.name ?? state.data.login}
                </div>
                <div style={{ color: "#8b949e" }}>@{state.data.login}</div>
                <div style={{ color: "#6b7280" }}>{state.data.followers} followers</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Provide the QueryClient here so the demo works even when mounted by an entry
// point that doesn't set up a root provider (e.g. a CodeSandbox index.tsx).
// Nesting under an existing provider is harmless — the nearest one wins.
const CustomHooksDemo = () => (
  <QueryClientProvider client={queryClient}>
    <CustomHooksDemoInner />
  </QueryClientProvider>
);

export default CustomHooksDemo;

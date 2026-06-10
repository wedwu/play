import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetch } from "@/hooks/useFetch";
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

const CustomHooksDemo = () => {
  // --- useLocalStorage: survives reloads ---
  const [name, setName] = useLocalStorage("interview:name", "");

  // --- useDebounce + useFetch: live GitHub user lookup ---
  const [handle, setHandle] = useState("");
  const debouncedHandle = useDebounce(handle, 500);
  const url = debouncedHandle.trim() ? `https://api.github.com/users/${debouncedHandle}` : null;
  const state = useFetch<GitHubUser>(url);

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
          <p style={{ marginTop: 10, fontSize: 13, color: "#4ade80", fontFamily: "monospace" }}>
            Hello, {name} 👋 (stored under "interview:name")
          </p>
        )}
      </div>

      <div style={ui.panel}>
        <p style={ui.label}>useDebounce + useFetch — live GitHub lookup (try "torvalds")</p>
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

export default CustomHooksDemo;

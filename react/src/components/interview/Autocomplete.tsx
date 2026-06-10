import { useEffect, useId, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { ui } from "./styles";

/**
 * CHALLENGE: Build an accessible autocomplete / typeahead.
 * Requirements interviewers look for:
 *   - debounce the input so you don't query on every keystroke
 *   - async results with loading + empty states
 *   - keyboard nav: ArrowUp/Down to move, Enter to select, Escape to close
 *   - cancel stale async work so an old response can't win a race
 *   - ARIA combobox roles for accessibility
 */

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile",
  "China", "Colombia", "Croatia", "Denmark", "Egypt", "Finland", "France",
  "Germany", "Greece", "India", "Indonesia", "Ireland", "Italy", "Japan",
  "Kenya", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Peru", "Poland", "Portugal", "Spain", "Sweden", "Switzerland",
  "Thailand", "Turkey", "Ukraine", "United Kingdom", "United States", "Vietnam",
];

/** Fake async API so the demo runs with no network. Resolves after ~350ms. */
const searchCountries = (query: string, signal: AbortSignal): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      const q = query.toLowerCase();
      resolve(COUNTRIES.filter((c) => c.toLowerCase().includes(q)));
    }, 350);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

const Autocomplete = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);

  const debounced = useDebounce(query, 300);
  const listId = useId();

  // Fetch on debounced query; abort stale requests to avoid races.
  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    searchCountries(debounced, controller.signal)
      .then((res) => {
        setResults(res);
        setActive(res.length ? 0 : -1);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoading(false);
      });
    return () => controller.abort();
  }, [debounced]);

  const choose = (value: string) => {
    setSelected(value);
    setQuery(value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div style={ui.panel}>
      <p style={ui.label}>Type a country (try "an", "land", "united")</p>
      <div style={{ position: "relative", marginTop: 8 }}>
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder="Search countries..."
          style={ui.input}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />

        {open && query.trim() !== "" && (
          <ul
            id={listId}
            role="listbox"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              margin: 0,
              padding: 4,
              listStyle: "none",
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              maxHeight: 240,
              overflowY: "auto",
              zIndex: 5,
            }}
          >
            {loading && <li style={{ ...ui.muted, padding: "8px 10px" }}>Searching…</li>}
            {!loading && results.length === 0 && (
              <li style={{ ...ui.muted, padding: "8px 10px" }}>No matches</li>
            )}
            {!loading &&
              results.map((r, i) => (
                <li
                  key={r}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep input focus; fire before blur
                    choose(r);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "monospace",
                    background: i === active ? "#1f6feb" : "transparent",
                    color: i === active ? "#fff" : "#e6edf3",
                  }}
                >
                  {r}
                </li>
              ))}
          </ul>
        )}
      </div>

      {selected && (
        <p style={{ marginTop: 14, fontSize: 13, color: "#4ade80", fontFamily: "monospace" }}>
          ✓ Selected: {selected}
        </p>
      )}
    </div>
  );
}
export default Autocomplete

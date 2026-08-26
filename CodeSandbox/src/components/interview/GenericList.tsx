import { useState, type ReactNode } from "react";
import { ui, ul } from "./styles";

type ListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
};

const List = <T,>({ items, getKey, renderItem, empty }: ListProps<T>) => {
  if (items.length === 0) {
    return <p style={ui.muted}>{empty ?? "Nothing to show"}</p>;
  }
  return (
    <ul style={ul}>
      {items.map((item, i) => (
        <li
          key={getKey(item)}
          style={{
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {renderItem(item, i)}
        </li>
      ))}
    </ul>
  );
};

type User = { id: number; name: string; role: "admin" | "member" };
type Product = { sku: string; title: string; price: number };

const USERS: User[] = [
  { id: 1, name: "Ada Lovelace", role: "admin" },
  { id: 2, name: "Grace Hopper", role: "member" },
  { id: 3, name: "Alan Turing", role: "member" },
];

const PRODUCTS: Product[] = [
  { sku: "KB-01", title: "Mechanical Keyboard", price: 129 },
  { sku: "MS-02", title: "Wireless Mouse", price: 49 },
];

const GenericList = () => {
  const [tab, setTab] = useState<"users" | "products">("users");

  return (
    <div style={ui.panel}>
      <p style={ui.label}>
        One generic &lt;List&lt;T&gt;&gt; renders both shapes, fully typed
      </p>

      <div style={{ display: "flex", gap: 8, margin: "12px 0 16px" }}>
        {(["users", "products"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t ? ui.button : ui.ghostButton}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <List
          items={USERS}
          getKey={(u) => u.id}
          renderItem={(u) => (
            <span>
              {u.name}{" "}
              <span
                style={{ color: u.role === "admin" ? "#facc15" : "#6b7280" }}
              >
                ({u.role})
              </span>
            </span>
          )}
        />
      ) : (
        <List
          items={PRODUCTS}
          getKey={(p) => p.sku}
          renderItem={(p) => (
            <span>
              {p.title} — <span style={{ color: "#4ade80" }}>${p.price}</span>
            </span>
          )}
        />
      )}
    </div>
  );
};

export default GenericList;

import "./Cheatsheet.css";

interface Section {
  title: string;
  items: { label: string; code: string }[];
}

const sections: Section[] = [
  {
    title: "Component",
    items: [
      {
        label: "Function component",
        code: `const Hello = () => {
  return <h1>Hello World</h1>;
};

export default Hello;`,
      },
      {
        label: "With props",
        code: `interface Props {
  name: string;
  age?: number;
}

const User = ({ name, age = 18 }: Props) => (
  <p>{name} is {age} years old</p>
);`,
      },
    ],
  },
  {
    title: "Hooks — State",
    items: [
      {
        label: "useState",
        code: `const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// Update
setCount(n => n + 1);
setUser({ name: 'Alice' });`,
      },
      {
        label: "useReducer",
        code: `type Action = { type: 'inc' } | { type: 'reset' };

const reducer = (state: number, action: Action): number => {
  switch (action.type) {
    case 'inc': return state + 1;
    case 'reset': return 0;
  }
};

const [state, dispatch] = useReducer(reducer, 0);
dispatch({ type: 'inc' });`,
      },
    ],
  },
  {
    title: "Hooks — Side Effects",
    items: [
      {
        label: "useEffect",
        code: `// On mount
useEffect(() => {
  fetchData();
}, []);

// On dependency change
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);

// With cleanup
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);`,
      },
      {
        label: "useMemo / useCallback",
        code: `// Memoize expensive value
const sorted = useMemo(
  () => [...items].sort(),
  [items]
);

// Stable function reference
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);`,
      },
    ],
  },
  {
    title: "Hooks — Refs & Context",
    items: [
      {
        label: "useRef",
        code: `const inputRef = useRef<HTMLInputElement>(null);

// Access DOM node
inputRef.current?.focus();

// Mutable value (no re-render)
const countRef = useRef(0);
countRef.current += 1;`,
      },
      {
        label: "useContext",
        code: `const ThemeContext = createContext<'light' | 'dark'>('light');

// Provider
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// Consumer
const theme = useContext(ThemeContext);`,
      },
    ],
  },
  {
    title: "Custom Hooks",
    items: [
      {
        label: "Pattern",
        code: `const useLocalStorage = <T,>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');`,
      },
    ],
  },
  {
    title: "JSX",
    items: [
      {
        label: "Conditionals",
        code: `// Short-circuit
{isLoggedIn && <Dashboard />}

// Ternary
{isLoggedIn ? <Dashboard /> : <Login />}`,
      },
      {
        label: "Lists",
        code: `{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}`,
      },
      {
        label: "Fragments",
        code: `// Avoid extra DOM node
<>
  <h1>Title</h1>
  <p>Body</p>
</>`,
      },
      {
        label: "Spread props",
        code: `const props = { id: 'btn', disabled: false };
<button {...props}>Click</button>`,
      },
    ],
  },
  {
    title: "Events",
    items: [
      {
        label: "Common event handlers",
        code: `<button onClick={(e) => console.log(e)}>Click</button>
<input onChange={(e) => setValue(e.target.value)} />
<form onSubmit={(e) => { e.preventDefault(); save(); }}>
<div onKeyDown={(e) => e.key === 'Escape' && close()}>`,
      },
      {
        label: "Event types",
        code: `(e: React.MouseEvent<HTMLButtonElement>) => {}
(e: React.ChangeEvent<HTMLInputElement>) => {}
(e: React.FormEvent<HTMLFormElement>) => {}
(e: React.KeyboardEvent<HTMLInputElement>) => {}`,
      },
    ],
  },
  {
    title: "Routing (react-router-dom v7)",
    items: [
      {
        label: "Setup",
        code: `<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>`,
      },
      {
        label: "Navigation & params",
        code: `import { Link, useNavigate, useParams } from 'react-router-dom';

// Link
<Link to="/about">About</Link>

// Programmatic
const navigate = useNavigate();
navigate('/home');

// Params
const { id } = useParams();`,
      },
    ],
  },
  {
    title: "Performance",
    items: [
      {
        label: "React.memo",
        code: `const Card = memo(({ title }: { title: string }) => (
  <div>{title}</div>
));

// With custom comparison
const Card = memo(({ user }) => (
  <div>{user.name}</div>
), (prev, next) => prev.user.id === next.user.id);`,
      },
      {
        label: "Lazy loading",
        code: `import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));

<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>`,
      },
    ],
  },
  {
    title: "TypeScript Patterns",
    items: [
      {
        label: "Component with children",
        code: `interface Props {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: Props) => (
  <div className={className}>{children}</div>
);`,
      },
      {
        label: "forwardRef",
        code: `const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, ...props }, ref) => (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  )
);`,
      },
      {
        label: "Generic component",
        code: `interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

const List = <T,>({ items, renderItem }: ListProps<T>) => (
  <ul>{items.map(renderItem)}</ul>
);`,
      },
    ],
  },
];

const Cheatsheet = () => {
  return (
    <div className="cheatsheet">
      <h1>React Cheatsheet</h1>
      <p className="subtitle">Quick reference for React concepts and patterns.</p>

      <div className="cs-grid">
        {sections.map((section) => (
          <div key={section.title} className="cs-card">
            <h2>{section.title}</h2>
            {section.items.map((item) => (
              <div key={item.label} className="cs-item">
                <p className="cs-label">{item.label}</p>
                <pre>
                  <code>{item.code}</code>
                </pre>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cheatsheet;

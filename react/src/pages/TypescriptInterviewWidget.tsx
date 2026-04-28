import { useState } from "react";

type Difficulty = "basic" | "intermediate" | "advanced";

type ActiveDiff = "all" | Difficulty;

type Question = {
  id: number;
  category: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
  code?: string;
};

type TokenType = "keyword" | "string" | "comment" | "ident" | "plain";

type DiffColors = Record<Difficulty, { bg: string; text: string; border: string }>;

type TokenColors = Record<TokenType, string>;

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Core Types",
    difficulty: "basic",
    question: "What is the difference between 'any' and 'unknown'?",
    answer:
      "'any' disables all type checking — you can perform any operation on it with no safety. 'unknown' is the type-safe alternative: you must narrow the type via typeof, instanceof, or a type guard before you can use it. Prefer 'unknown' over 'any' when the type is genuinely not known upfront.",
    code: `let a: any = "hello";
a.toFixed(); // ✅ No error — but crashes at runtime!

let u: unknown = "hello";
u.toUpperCase(); // ❌ Error: Object is of type 'unknown'

if (typeof u === "string") {
  u.toUpperCase(); // ✅ Safe after narrowing
}`,
  },
  {
    id: 2,
    category: "Core Types",
    difficulty: "basic",
    question: "What is the difference between 'interface' and 'type'?",
    answer:
      "Both define object shapes, but they have key differences: interfaces support declaration merging (re-declaring them extends them), while type aliases can represent primitives, unions, intersections, and tuples. Interfaces are best for object shapes that may be extended; type aliases are better for complex type expressions.",
    code: `// Interface — supports declaration merging
interface User { name: string }
interface User { age: number } // ✅ merged!

// Type — union & intersection not possible with interface
type ID = string | number;
type Admin = User & { role: "admin" };
type Pair = [string, number]; // tuple`,
  },
  {
    id: 3,
    category: "Core Types",
    difficulty: "basic",
    question: "Explain union types vs intersection types.",
    answer:
      "Union types (|) mean a value can be ONE of several types. Intersection types (&) mean a value must satisfy ALL combined types simultaneously — every property from every member must be present.",
    code: `// Union: one OR the other
type StringOrNum = string | number;
let val: StringOrNum = "hello"; // or 42

// Intersection: ALL combined
type HasName = { name: string };
type HasAge  = { age: number };
type Person  = HasName & HasAge;

const p: Person = { name: "Alice", age: 30 }; // both required`,
  },
  {
    id: 4,
    category: "Generics",
    difficulty: "intermediate",
    question: "How do generics work and when should you use them?",
    answer:
      "Generics let you write functions, classes, and interfaces that work with multiple types while preserving type safety. Use them when you want to abstract over types without losing type information — e.g., a function that returns the same type it receives, or a data structure that works with any element type.",
    code: `// Without generics: loses type info
function first(arr: any[]): any { return arr[0]; }

// With generics: type-safe
function first<T>(arr: T[]): T { return arr[0]; }

const num = first([1, 2, 3]);     // inferred: number
const str = first(["a", "b"]);    // inferred: string

// Generic interface
interface Repository<T> {
  findById(id: number): T;
  save(entity: T): void;
}`,
  },
  {
    id: 5,
    category: "Generics",
    difficulty: "intermediate",
    question: "What are generic constraints and why are they useful?",
    answer:
      "Generic constraints (extends) restrict what types can be used as a type argument. They're useful when your generic code needs to access a specific property or method — you guarantee the type has that capability without hardcoding the concrete type.",
    code: `// Unconstrained: TS doesn't know T has .length
function logLength<T>(val: T) {
  console.log(val.length); // ❌ Error
}

// Constrained: T must have .length
function logLength<T extends { length: number }>(val: T) {
  console.log(val.length); // ✅ Safe
}

logLength("hello");    // ✅ string has .length
logLength([1, 2, 3]);  // ✅ array has .length
logLength(42);         // ❌ number has no .length`,
  },
  {
    id: 6,
    category: "Utility Types",
    difficulty: "intermediate",
    question: "What utility types does TypeScript provide?",
    answer:
      "TypeScript ships with built-in generic types that transform other types. The most common are Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, NonNullable, ReturnType, and Parameters.",
    code: `interface User { id: number; name: string; email?: string }

type P  = Partial<User>           // all optional
type R  = Required<User>          // all required
type RO = Readonly<User>          // all readonly
type Pi = Pick<User, "id"|"name"> // subset of keys
type O  = Omit<User, "email">     // exclude keys
type Rc = Record<string, number>  // key-value map

type Fn = (x: number) => string;
type Ret = ReturnType<Fn>;        // string
type Par = Parameters<Fn>;        // [number]`,
  },
  {
    id: 7,
    category: "Utility Types",
    difficulty: "intermediate",
    question: "What is the difference between Pick, Omit, and Record?",
    answer:
      "Pick creates a type with only specified keys from T. Omit creates a type with all keys except specified ones. Record creates a type with a given key type mapped to a value type — useful for dictionaries and lookup tables.",
    code: `interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Pick: keep only these keys
type Summary = Pick<Product, "id" | "name">;

// Omit: exclude these keys
type PublicProduct = Omit<Product, "stock">;

// Record: key → value map
type PriceMap = Record<string, number>;
const prices: PriceMap = { apple: 1.2, banana: 0.5 };`,
  },
  {
    id: 8,
    category: "Advanced Types",
    difficulty: "advanced",
    question: "What are conditional types and how do you use them?",
    answer:
      "Conditional types (T extends U ? X : Y) select a type based on a condition, enabling type-level branching. When T is a union, TypeScript distributes the condition over each member. They're the foundation of many built-in utility types.",
    code: `type IsArray<T> = T extends any[] ? true : false;

type A = IsArray<number[]>;  // true
type B = IsArray<string>;    // false

// Distributive over unions
type Flatten<T> = T extends Array<infer U> ? U : T;

type C = Flatten<string[]>;         // string
type D = Flatten<number | string[]>; // number | string

// Built on conditional types:
type NonNullable<T> = T extends null | undefined ? never : T;`,
  },
  {
    id: 9,
    category: "Advanced Types",
    difficulty: "advanced",
    question: "What is the 'infer' keyword and how does it work?",
    answer:
      "'infer' declares a type variable within a conditional type's extends clause, letting you capture and name part of the matched type. It's how you extract inner types like return values, promise resolutions, or array element types.",
    code: `// Extract return type of any function
type ReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : never;

// Unwrap a Promise
type Awaited<T> = T extends Promise<infer V> ? V : T;

// Extract first element of a tuple
type Head<T extends any[]> = T extends [infer H, ...any[]]
  ? H
  : never;

type A = ReturnType<() => number>;   // number
type B = Awaited<Promise<string>>;   // string
type C = Head<[boolean, string]>;    // boolean`,
  },
  {
    id: 10,
    category: "Advanced Types",
    difficulty: "advanced",
    question: "What are mapped types and how do they work?",
    answer:
      "Mapped types iterate over a union of keys to construct a new type, transforming each property in some way. They're the building blocks for Partial, Readonly, and other utility types. You can also remap keys using the 'as' clause and template literal types.",
    code: `// Rebuild Partial manually
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Make all values nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Remap keys with template literals
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }`,
  },
  {
    id: 11,
    category: "Advanced Types",
    difficulty: "advanced",
    question: "What is 'keyof', 'typeof', and indexed access types?",
    answer:
      "'keyof T' gives a union of all keys of T. 'typeof x' infers the TypeScript type of a variable. Indexed access types (T[K]) let you look up a property type using a key. Combined, they enable powerful type-safe abstractions.",
    code: `const config = { host: "localhost", port: 3000 };

type ConfigKeys = keyof typeof config; // "host" | "port"

// Indexed access type
type PortType = typeof config["port"]; // number

// Practical: type-safe property getter
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const port = get(config, "port"); // inferred: number
get(config, "url"); // ❌ Error: not a key of config`,
  },
  {
    id: 12,
    category: "Classes",
    difficulty: "intermediate",
    question: "What is the difference between 'abstract class' and 'interface'?",
    answer:
      "Abstract classes can have concrete method implementations, constructors, and state. Interfaces only define shapes with no implementation. A class can implement multiple interfaces but only extend one abstract class. Use abstract classes for shared behavior, interfaces for structural contracts.",
    code: `interface Serializable {
  toJSON(): string; // no implementation
}

abstract class Animal {
  abstract speak(): string;   // must implement
  move() { return "moving"; } // shared impl
}

class Dog extends Animal implements Serializable {
  speak() { return "Woof"; }  // required
  toJSON() { return JSON.stringify({ type: "dog" }); }
}

const d = new Dog();
new Animal(); // ❌ Cannot instantiate abstract class`,
  },
  {
    id: 13,
    category: "Classes",
    difficulty: "advanced",
    question: "How do TypeScript decorators work?",
    answer:
      "Decorators are special syntax (@expression) applied to classes, methods, accessors, properties, or parameters. They run at class definition time and receive metadata about what they decorate. Require 'experimentalDecorators: true' in tsconfig. Commonly used in frameworks like Angular, NestJS, and TypeORM.",
    code: `// Method decorator
function log(target: any, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  desc.value = function(...args: any[]) {
    console.log(\`Calling \${key}(\${args})\`);
    return original.apply(this, args);
  };
  return desc;
}

class UserService {
  @log
  findById(id: number) {
    return { id, name: "Alice" };
  }
}

// tsconfig.json
// { "compilerOptions": { "experimentalDecorators": true } }`,
  },
  {
    id: 14,
    category: "Patterns",
    difficulty: "advanced",
    question: "What are discriminated unions and why are they useful?",
    answer:
      "A discriminated union is a union type where each member has a common literal property (the discriminant) that TypeScript can use to narrow the type in a switch/if. They're ideal for modeling state machines, action types, or API responses where you need exhaustive handling.",
    code: `type Shape =
  | { kind: "circle";    radius: number }
  | { kind: "square";    side: number   }
  | { kind: "rectangle"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "square":    return s.side ** 2;
    case "rectangle": return s.w * s.h;
    default:
      const _: never = s; // exhaustiveness check
      return 0;
  }
}`,
  },
  {
    id: 15,
    category: "Patterns",
    difficulty: "intermediate",
    question: "What is type narrowing and what techniques does TypeScript use?",
    answer:
      "Type narrowing is TypeScript's ability to refine a type to something more specific within a conditional block, based on control flow analysis. Techniques include typeof, instanceof, in operator, equality checks, truthiness checks, and custom type guard functions.",
    code: `type Input = string | number | null;

function process(val: Input) {
  if (val === null) return;           // null narrowed out
  if (typeof val === "string") {
    return val.toUpperCase();         // val: string
  }
  return val.toFixed(2);             // val: number
}

// Custom type guard
function isUser(obj: any): obj is User {
  return typeof obj?.name === "string";
}

if (isUser(data)) {
  console.log(data.name); // ✅ data narrowed to User
}`,
  },
  {
    id: 16,
    category: "Patterns",
    difficulty: "advanced",
    question: "What is the 'satisfies' operator (TypeScript 4.9+)?",
    answer:
      "The 'satisfies' operator validates that an expression matches a type without widening it to that type. Unlike a type annotation, it preserves the most specific inferred type, so you get both type safety AND access to literal types.",
    code: `type Colors = "red" | "green" | "blue";
type Palette = Record<Colors, string | [number, number, number]>;

// With annotation: loses literal types
const p1: Palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};
p1.green.toUpperCase(); // ❌ Error: string | number[]

// With satisfies: keeps literal types
const p2 = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Palette;
p2.green.toUpperCase(); // ✅ TypeScript knows it's string`,
  },
];

const CATEGORIES = ["All", ...new Set(QUESTIONS.map((q) => q.category))];
const DIFFICULTIES: ActiveDiff[] = ["all", "basic", "intermediate", "advanced"];
const DIFF_COLORS: DiffColors = {
  basic: { bg: "#1a3a2a", text: "#4ade80", border: "#2d6b4a" },
  intermediate: { bg: "#2a2a0a", text: "#facc15", border: "#6b5e0a" },
  advanced: { bg: "#2a0a0a", text: "#f87171", border: "#6b1a1a" },
};

const KEYWORDS = new Set([
  "type",
  "interface",
  "function",
  "class",
  "abstract",
  "const",
  "let",
  "var",
  "return",
  "extends",
  "implements",
  "infer",
  "keyof",
  "typeof",
  "never",
  "any",
  "unknown",
  "string",
  "number",
  "boolean",
  "true",
  "false",
  "null",
  "undefined",
  "import",
  "export",
  "default",
  "new",
  "this",
  "as",
  "in",
  "of",
  "switch",
  "case",
  "if",
  "else",
]);

function tokenize(code: string) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const text = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: "comment", text });
      i += text.length;
      continue;
    }
    // Template literal
    if (code[i] === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== "`") {
        if (code[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", text: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Double-quoted string
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"') {
        if (code[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", text: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      tokens.push({ type: KEYWORDS.has(word) ? "keyword" : "ident", text: word });
      i = j;
      continue;
    }
    // Everything else: accumulate plain chars
    let j = i;
    while (j < code.length && !/[a-zA-Z_$"`/]/.test(code[j])) j++;
    if (j === i) j = i + 1;
    tokens.push({ type: "plain", text: code.slice(i, j) });
    i = j;
  }
  return tokens;
}

const TOKEN_COLORS: TokenColors = {
  keyword: "#7dd3fc",
  string: "#86efac",
  comment: "#6b7280",
  ident: "#e6edf3",
  plain: "#e6edf3",
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const tokens = tokenize(code);

  return (
    <div style={{ position: "relative", marginTop: 14 }}>
      <button
        onClick={copy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: copied ? "#1a3a2a" : "#1e1e1e",
          color: copied ? "#4ade80" : "#6b7280",
          border: `1px solid ${copied ? "#2d6b4a" : "#333"}`,
          borderRadius: 5,
          padding: "3px 10px",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "monospace",
          transition: "all .2s",
          zIndex: 1,
        }}
      >
        {copied ? "copied!" : "copy"}
      </button>
      <pre
        style={{
          background: "#0d1117",
          border: "1px solid #21262d",
          borderRadius: 8,
          padding: "16px 14px",
          fontSize: 12.5,
          lineHeight: 1.65,
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          color: "#e6edf3",
          overflow: "auto",
          margin: 0,
          whiteSpace: "pre",
          textAlign: "left",
        }}
      >
        {tokens.map((tok, idx) => (
          <span key={idx} style={{ color: TOKEN_COLORS[tok.type as TokenType] }}>
            {tok.text}
          </span>
        ))}
      </pre>
    </div>
  );
}

function DiffBadge({ level }: { level: Difficulty }) {
  const c = DIFF_COLORS[level];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontFamily: "monospace",
      }}
    >
      {level}
    </span>
  );
}

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState("read"); // "read" | "flashcard"

  return (
    <div
      style={{
        background: "#0d1117",
        border: `1px solid ${open ? "#30363d" : "#21262d"}`,
        borderRadius: 10,
        marginBottom: 8,
        overflow: "hidden",
        transition: "border-color .2s",
      }}
    >
      {/* Header */}
      <div
        onClick={() => {
          setOpen((o) => !o);
          setFlipped(false);
        }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          cursor: "pointer",
          userSelect: "none",
          background: open ? "#161b22" : "transparent",
          transition: "background .15s",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "#3b82f6",
            minWidth: 28,
            paddingTop: 2,
            fontWeight: 700,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            color: "#e6edf3",
            lineHeight: 1.5,
            textAlign: "left",
          }}
        >
          {q.question}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <span
            style={{
              background: "#161b22",
              color: "#8b949e",
              border: "1px solid #21262d",
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 11,
              fontFamily: "monospace",
            }}
          >
            {q.category}
          </span>
          <DiffBadge level={q.difficulty} />
          <span
            style={{
              color: "#8b949e",
              fontSize: 12,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .2s",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ borderTop: "1px solid #21262d", padding: "16px 16px 18px" }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["read", "flashcard"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setFlipped(false);
                }}
                style={{
                  background: mode === m ? "#1f6feb" : "#161b22",
                  color: mode === m ? "#fff" : "#8b949e",
                  border: `1px solid ${mode === m ? "#1f6feb" : "#30363d"}`,
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  transition: "all .15s",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "read" ? (
            <>
              <p
                style={{
                  fontSize: 14,
                  textAlign: "left",
                  color: "#b1bac4",
                  lineHeight: 1.75,
                  marginBottom: q.code ? 0 : 0,
                }}
              >
                {q.answer}
              </p>
              {q.code && <CodeBlock code={q.code} />}
            </>
          ) : (
            /* Flashcard mode */
            <div
              onClick={() => setFlipped((f) => !f)}
              style={{
                minHeight: 160,
                background: flipped ? "#0d2818" : "#0f1923",
                border: `1px solid ${flipped ? "#2d6b4a" : "#1f6feb33"}`,
                borderRadius: 8,
                padding: 24,
                cursor: "pointer",
                transition: "all .25s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                gap: 10,
              }}
            >
              {!flipped ? (
                <>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#3b82f6",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                    }}
                  >
                    QUESTION
                  </span>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#e6edf3",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      maxWidth: 480,
                    }}
                  >
                    {q.question}
                  </p>
                  <span style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                    click to reveal answer
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#4ade80",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ANSWER
                  </span>
                  <p style={{ fontSize: 13, color: "#b1bac4", lineHeight: 1.7, maxWidth: 520 }}>
                    {q.answer}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TypescriptInterviewWidget = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiff, setActiveDiff] = useState<ActiveDiff>("all");
  const [search, setSearch] = useState("");

  const filtered = QUESTIONS.filter((q) => {
    const catMatch = activeCategory === "All" || q.category === activeCategory;
    const diffMatch = activeDiff === "all" || q.difficulty === activeDiff;
    const searchMatch =
      !search ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.category.toLowerCase().includes(search.toLowerCase());
    return catMatch && diffMatch && searchMatch;
  });

  const stats = {
    basic: QUESTIONS.filter((q) => q.difficulty === "basic").length,
    intermediate: QUESTIONS.filter((q) => q.difficulty === "intermediate").length,
    advanced: QUESTIONS.filter((q) => q.difficulty === "advanced").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#e6edf3",
        fontFamily: "'IBM Plex Sans', 'SF Pro Text', system-ui, sans-serif",
        padding: "0 0 60px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #21262d",
          padding: "20px 24px 0",
          background: "#0d1117",
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#3b82f6" }}>$</span>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "-0.02em",
              }}
            >
              TypeScript Interview Prep
            </h1>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4ade80" }}>
              v{QUESTIONS.length}.0
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, fontFamily: "monospace" }}>
            {QUESTIONS.length} questions across {CATEGORIES.length - 1} categories — basic through
            advanced
          </p>

          {/* Stats bar */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {Object.entries(stats).map(([level, count]) => {
              const c = DIFF_COLORS[level as Difficulty];
              return (
                <div
                  key={level}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                >
                  <span style={{ color: c.text }}>{count}</span>
                  <span style={{ color: "#6b7280" }}>{level}</span>
                </div>
              );
            })}
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 0 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: "transparent",
                  color: activeCategory === cat ? "#e6edf3" : "#6b7280",
                  border: "none",
                  borderBottom:
                    activeCategory === cat ? "2px solid #3b82f6" : "2px solid transparent",
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  transition: "all .15s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search questions..."
          style={{
            flex: "1 1 200px",
            background: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: "7px 12px",
            color: "#e6edf3",
            fontSize: 13,
            fontFamily: "monospace",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDiff(d)}
              style={{
                background:
                  activeDiff === d ? DIFF_COLORS[d as Difficulty]?.bg || "#1f6feb22" : "#0d1117",
                color:
                  activeDiff === d ? DIFF_COLORS[d as Difficulty]?.text || "#3b82f6" : "#6b7280",
                border: `1px solid ${activeDiff === d ? DIFF_COLORS[d as Difficulty]?.border || "#1f6feb" : "#21262d"}`,
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "monospace",
                transition: "all .15s",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <span
          style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", marginLeft: "auto" }}
        >
          {filtered.length}/{QUESTIONS.length}
        </span>
      </div>

      {/* Question list */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#6b7280",
              fontFamily: "monospace",
              fontSize: 14,
            }}
          >
            no questions match your filters
          </div>
        ) : (
          filtered.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)
        )}
      </div>
    </div>
  );
};
export default TypescriptInterviewWidget;

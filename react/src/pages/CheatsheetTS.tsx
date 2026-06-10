import "./Cheatsheet.css";

interface Section {
  title: string;
  summary: string;
  items: { label: string; code: string }[];
}

const sections: Section[] = [
  {
    title: "Type Annotations",
    summary:
      "Attach explicit types to variables, arrays, and tuples. Prefer unknown over any when a type is uncertain, since unknown forces a check before use.",
    items: [
      {
        label: "Primitives & arrays",
        code: `let name: string = 'Alice';let name: string = 'Alice';let name: string = 'Alice';let name: string = 'Alice';
let age: number = 30;
let active: boolean = true;
let nothing: null = null;
let missing: undefined = undefined;
let anything: unknown = 42;   // safer than any
let wild: any = 'no checks';

// Arrays
let nums: number[] = [1, 2, 3];
let strs: Array<string> = ['a', 'b'];`,
      },
      {
        label: "Tuples",
        code: `// Fixed-length, typed by position
const pair: [string, number] = ['Alice', 30];
const [name, age] = pair;

// Named tuple (TS 4.0+)
type Range = [start: number, end: number];
const r: Range = [0, 100];

// Rest in tuples
type StringThenNumbers = [string, ...number[]];`,
      },
    ],
  },
  {
    title: "Interfaces",
    summary:
      "Describe the shape of objects. Interfaces can extend others, merge declarations, and include call signatures and index signatures.",
    items: [
      {
        label: "Defining & extending",
        code: `interface User {
  readonly id: number;
  name: string;
  email?: string;          // optional
}

interface Admin extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}

// Extending multiple
interface SuperAdmin extends Admin, Auditable {
  auditLog: string[];
}`,
      },
      {
        label: "Function & index signatures",
        code: `interface Formatter {
  (value: string): string;        // call signature
}

interface StringMap {
  [key: string]: string;          // index signature
}

interface Api {
  get(url: string): Promise<unknown>;
  post(url: string, body: unknown): Promise<unknown>;
}`,
      },
    ],
  },
  {
    title: "Type Aliases",
    summary:
      "Give a name to any type — object shapes, unions, intersections, primitives. Use type for unions/intersections; reach for interface when modeling extensible object APIs.",
    items: [
      {
        label: "Types vs interfaces",
        code: `// Type alias — can represent any shape
type Point = { x: number; y: number };
type ID = string | number;
type Callback = (err: Error | null, data?: unknown) => void;

// Interface — extensible, better for objects/classes
interface Point { x: number; y: number }

// Prefer interface for public API shapes
// Use type for unions, intersections, primitives`,
      },
      {
        label: "Union & intersection",
        code: `// Union — one of these shapes
type Result<T> =
  | { status: 'ok';    data: T }
  | { status: 'error'; message: string };

// Intersection — all of these shapes merged
type AdminUser = User & Admin;

// Discriminated union — status field narrows the type
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect';   width: number; height: number };`,
      },
    ],
  },
  {
    title: "Generics",
    summary:
      "Parameterize functions, interfaces, and classes over types so they stay reusable and type-safe, with constraints (extends) and default type parameters.",
    items: [
      {
        label: "Functions & constraints",
        code: `// Generic function
const identity = <T>(value: T): T => value;

// Constraint — T must have .length
const longest = <T extends { length: number }>(a: T, b: T): T =>
  a.length >= b.length ? a : b;

// Multiple type params
const pair = <K, V>(key: K, val: V): [K, V] => [key, val];

// Default type param
const wrap = <T = string>(val: T) => ({ val });`,
      },
      {
        label: "Generic interfaces & classes",
        code: `interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}

class Stack<T> {
  #items: T[] = [];
  push = (item: T) => this.#items.push(item);
  pop  = (): T | undefined => this.#items.pop();
  peek = (): T | undefined => this.#items.at(-1);
}

const stack = new Stack<number>();
stack.push(1);`,
      },
    ],
  },
  {
    title: "Utility Types",
    summary:
      "Built-in transforms that derive new types from existing ones — Partial/Required/Readonly, Pick/Omit/Record, and ReturnType/Parameters/Awaited.",
    items: [
      {
        label: "Partial, Required, Readonly",
        code: `interface User {
  id: number;
  name: string;
  email: string;
}

// All properties optional
type UserDraft = Partial<User>;

// All properties required
type FullUser = Required<UserDraft>;

// All properties readonly
type FrozenUser = Readonly<User>;

// Update function pattern
const update = (user: User, patch: Partial<User>): User =>
  ({ ...user, ...patch });`,
      },
      {
        label: "Pick, Omit, Record",
        code: `// Keep only listed keys
type UserPreview = Pick<User, 'id' | 'name'>;

// Remove listed keys
type PublicUser = Omit<User, 'email'>;

// Build object type from key union
type Roles = 'admin' | 'editor' | 'viewer';
type Permissions = Record<Roles, string[]>;

// Map over keys
const perms: Permissions = {
  admin:  ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};`,
      },
      {
        label: "ReturnType, Parameters, Awaited",
        code: `const fetchUser = async (id: number) => ({ id, name: 'Alice' });

// Extract return type
type FetchResult = ReturnType<typeof fetchUser>;
// Promise<{ id: number; name: string }>

// Unwrap the promise
type User = Awaited<FetchResult>;
// { id: number; name: string }

// Extract parameter types
type FetchParams = Parameters<typeof fetchUser>;
// [id: number]

// Extract instance type of a class
type Instance = InstanceType<typeof MyClass>;`,
      },
    ],
  },
  {
    title: "Type Narrowing",
    summary:
      "Refine a broad type to a more specific one within a branch using typeof/instanceof/in checks, discriminated unions, and user-defined type predicates (val is T).",
    items: [
      {
        label: "typeof, instanceof, in",
        code: `function format(val: string | number): string {
  if (typeof val === 'string') return val.toUpperCase();
  return val.toFixed(2);
}

function logError(err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);  // Error methods available
  }
}

type Cat = { meow(): void };
type Dog = { bark(): void };

function makeNoise(pet: Cat | Dog) {
  if ('meow' in pet) pet.meow();
  else pet.bark();
}`,
      },
      {
        label: "Discriminated union & assertion",
        code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect';   w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2;
    case 'rect':   return s.w * s.h;
  }
}

// Type predicate — user-defined guard
function isUser(val: unknown): val is User {
  return typeof val === 'object' && val !== null && 'id' in val;
}`,
      },
    ],
  },
  {
    title: "keyof & typeof",
    summary:
      "keyof produces the union of an object type's property keys; typeof (in type position) lifts a runtime value into its inferred type. Together they enable type-safe key access.",
    items: [
      {
        label: "keyof operator",
        code: `interface Config {
  host: string;
  port: number;
  debug: boolean;
}

type ConfigKey = keyof Config;   // 'host' | 'port' | 'debug'

// Type-safe property lookup
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const cfg: Config = { host: 'localhost', port: 3000, debug: false };
const host = get(cfg, 'host');   // typed as string`,
      },
      {
        label: "typeof operator (type position)",
        code: `const defaults = {
  theme: 'dark' as const,
  lang:  'en'  as const,
  size:  16,
};

// Infer type from value
type Defaults = typeof defaults;
// { theme: 'dark'; lang: 'en'; size: number }

type DefaultKey = keyof typeof defaults;
// 'theme' | 'lang' | 'size'

// Infer return type from function
const createUser = () => ({ id: 1, name: 'Alice' });
type CreatedUser = ReturnType<typeof createUser>;`,
      },
    ],
  },
  {
    title: "Mapped Types",
    summary:
      "Generate new types by iterating over the keys of another ([K in keyof T]), adding or stripping ?/readonly modifiers and remapping keys with an 'as' clause.",
    items: [
      {
        label: "Building mapped types",
        code: `// Make all props optional (like Partial)
type Optional<T> = { [K in keyof T]?: T[K] };

// Make all props nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Remove readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Remove optional
type Required<T> = { [K in keyof T]-?: T[K] };`,
      },
      {
        label: "Remapping keys (as clause)",
        code: `// Prefix all keys
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Filter keys by value type
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};`,
      },
    ],
  },
  {
    title: "Template Literal Types",
    summary:
      "Build string literal types from other types using ${} in type position, and parse them apart with infer — great for typed event names, CSS props, and route params.",
    items: [
      {
        label: "Type-level string operations",
        code: `type Direction = 'top' | 'right' | 'bottom' | 'left';
type Padding = \`padding-\${Direction}\`;
// 'padding-top' | 'padding-right' | ...

type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickEvent = EventName<'click'>;  // 'onClick'

// Parsing strings with infer
type ExtractParam<T extends string> =
  T extends \`/users/\${infer Param}\` ? Param : never;

type UserId = ExtractParam<'/users/123'>; // '123'`,
      },
    ],
  },
  {
    title: "Conditional Types",
    summary:
      "Type-level if/else (T extends U ? X : Y), with infer to pull a type out from inside another. They distribute over unions, applying member-by-member.",
    items: [
      {
        label: "Conditional & infer",
        code: `// Basic conditional
type IsString<T> = T extends string ? true : false;
type A = IsString<'hi'>;   // true
type B = IsString<42>;     // false

// infer — extract a type from within another type
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type Unwrapped = UnpackPromise<Promise<string>>;  // string

// Distributive over unions
type NonNullable<T> = T extends null | undefined ? never : T;
type Clean = NonNullable<string | null | undefined>;
// string`,
      },
    ],
  },
  {
    title: "Enums",
    summary:
      "Named sets of constants — numeric (auto-incrementing) or string (more readable). const enums inline at compile time; many teams prefer an 'as const' object instead.",
    items: [
      {
        label: "Numeric & string enums",
        code: `// Numeric enum — auto-increments
enum Direction {
  Up    = 0,
  Down  = 1,
  Left  = 2,
  Right = 3,
}

// String enum — explicit values, more readable
enum Status {
  Pending  = 'PENDING',
  Active   = 'ACTIVE',
  Inactive = 'INACTIVE',
}

const s: Status = Status.Active;  // 'ACTIVE'`,
      },
      {
        label: "Const enums & alternatives",
        code: `// const enum — inlined at compile time (no runtime object)
const enum Size { Small = 1, Medium = 2, Large = 3 }
const s = Size.Medium;  // compiled to: const s = 2;

// Preferred alternative — as const object
const STATUS = {
  Pending:  'PENDING',
  Active:   'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
// 'PENDING' | 'ACTIVE' | 'INACTIVE'`,
      },
    ],
  },
  {
    title: "Classes",
    summary:
      "TypeScript layers types onto JS classes: access modifiers (public/private/protected), readonly, constructor parameter properties, abstract classes, and implements.",
    items: [
      {
        label: "Access modifiers & readonly",
        code: `class User {
  readonly id: number;
  public  name: string;
  private email: string;
  protected role: string;

  constructor(id: number, name: string, email: string) {
    this.id    = id;
    this.name  = name;
    this.email = email;
    this.role  = 'user';
  }
}

// Shorthand — declare & assign in one step
class Product {
  constructor(
    public  readonly id: number,
    public  name: string,
    private price: number,
  ) {}
}`,
      },
      {
        label: "Abstract classes & implements",
        code: `abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  toString() {
    return \`area=\${this.area()}, perimeter=\${this.perimeter()}\`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area      = () => Math.PI * this.radius ** 2;
  perimeter = () => 2 * Math.PI * this.radius;
}

// Implement an interface
class ApiClient implements Repository<User> {
  async findById(id: number) { /* ... */ return null; }
  async save(user: User)     { /* ... */ return user; }
  async delete(id: number)   { /* ... */ }
}`,
      },
    ],
  },
  {
    title: "Type Assertions & Declarations",
    summary:
      "Override or tighten inferred types with as, satisfies, and the non-null ! operator, and extend existing types through declaration merging and module augmentation.",
    items: [
      {
        label: "as, satisfies, !",
        code: `// as — tell TS what type this is (no runtime effect)
const input = document.getElementById('name') as HTMLInputElement;
input.value;   // accessible now

// Const assertion — infer literal types
const config = { env: 'prod', debug: false } as const;
// { readonly env: 'prod'; readonly debug: false }

// satisfies — validate without widening
const palette = {
  red:   [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, string | number[]>;

// Non-null assertion — tell TS value is not null/undefined
const el = document.getElementById('app')!;`,
      },
      {
        label: "Declaration merging & module augmentation",
        code: `// Extend an existing interface
interface Window {
  myApp: { version: string };
}

// Augment a module
declare module 'express' {
  interface Request {
    user?: User;
  }
}

// Ambient declaration for untyped JS
declare module '*.svg' {
  const content: string;
  export default content;
}`,
      },
    ],
  },
];

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CheatsheetTS = () => (
  <div className="cheatsheet">
    <h1 id="top">TypeScript Cheatsheet</h1>
    <p className="subtitle">Types, generics, utility types, and type-level programming patterns.</p>

    <nav className="cs-toc">
      {sections.map((section) => (
        <a key={section.title} href={`#${slug(section.title)}`}>
          {section.title}
        </a>
      ))}
    </nav>

    <div className="cs-grid">
      {sections.map((section) => (
        <div key={section.title} id={slug(section.title)} className="cs-card">
          <h2>{section.title}</h2>
          <p className="cs-summary">{section.summary}</p>
          {section.items.map((item) => (
            <div key={item.label} className="cs-item">
              <p className="cs-label">{item.label}</p>
              <pre>
                <code>{item.code}</code>
              </pre>
            </div>
          ))}
          <a className="cs-top" href="#top" title="Return to top" aria-label="Return to top">
            <span className="material-icons">arrow_upward</span>
          </a>
        </div>
      ))}
    </div>
  </div>
);

export default CheatsheetTS;

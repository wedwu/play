import { Component } from '@angular/core';

interface Section {
  title: string;
  items: { label: string; code: string }[];
}

@Component({
  selector: 'app-cheatsheet-es6',
  templateUrl: './cheatsheet-es6.html',
  styleUrl: './cheatsheet-es6.scss',
})
export class CheatsheetEs6 {
  sections: Section[] = [
    {
      title: 'Variables',
      items: [
        {
          label: 'let / const',
          code: `// const — immutable binding (preferred)
const name = 'Alice';
const PI = 3.14159;

// let — block-scoped, reassignable
let count = 0;
count += 1;

// var — function-scoped, avoid in ES6+
// var x = 1; ❌`,
        },
      ],
    },
    {
      title: 'Arrow Functions',
      items: [
        {
          label: 'Syntax forms',
          code: `// Single expression — implicit return
const double = (n) => n * 2;

// Multiple statements
const greet = (name) => {
  const msg = \`Hello, \${name}\`;
  return msg;
};

// No params
const now = () => Date.now();

// Returning an object literal — wrap in parens
const makeUser = (name) => ({ name, active: true });`,
        },
        {
          label: "vs function — no own 'this'",
          code: `class Timer {
  seconds = 0;

  start() {
    // Arrow captures 'this' — correct ✅
    setInterval(() => { this.seconds++; }, 1000);

    // Regular function loses 'this' — broken ❌
    // setInterval(function() { this.seconds++; }, 1000);
  }
}`,
        },
      ],
    },
    {
      title: 'Template Literals',
      items: [
        {
          label: 'Interpolation & multiline',
          code: `const name = 'World';
const greeting = \`Hello, \${name}!\`;

const html = \`
  <div>
    <h1>\${greeting}</h1>
    <p>2 + 2 = \${2 + 2}</p>
  </div>
\`;`,
        },
        {
          label: 'Tagged templates',
          code: `const highlight = (strings, ...values) =>
  strings.reduce((acc, str, i) =>
    acc + str + (values[i] !== undefined
      ? \`<b>\${values[i]}</b>\` : ''), '');

const result = highlight\`Hello \${'Alice'}, you have \${3} messages.\`;
// Hello <b>Alice</b>, you have <b>3</b> messages.`,
        },
      ],
    },
    {
      title: 'Destructuring',
      items: [
        {
          label: 'Object destructuring',
          code: `const user = { name: 'Alice', age: 30, role: 'admin' };

// Basic
const { name, age } = user;

// Rename
const { name: userName, age: userAge } = user;

// Default value
const { role = 'guest' } = user;

// Nested
const { address: { city } = {} } = user;`,
        },
        {
          label: 'Array destructuring',
          code: `const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first = 1, second = 2, rest = [3, 4, 5]

// Skip elements
const [,, third] = [1, 2, 3];

// Swap variables
let a = 1, b = 2;
[a, b] = [b, a];`,
        },
        {
          label: 'In function params',
          code: `const greet = ({ name, age = 18 }) =>
  \`\${name} is \${age}\`;

const sum = ([a, b, c]) => a + b + c;`,
        },
      ],
    },
    {
      title: 'Spread & Rest',
      items: [
        {
          label: 'Spread operator',
          code: `// Arrays
const a = [1, 2, 3];
const b = [...a, 4, 5];           // [1, 2, 3, 4, 5]
const copy = [...a];              // shallow clone

// Objects
const base = { x: 1, y: 2 };
const extended = { ...base, z: 3 };   // { x:1, y:2, z:3 }
const updated  = { ...base, x: 99 };  // { x:99, y:2 }

// Spread into function args
Math.max(...a);`,
        },
        {
          label: 'Rest parameters',
          code: `const sum = (...nums) =>
  nums.reduce((acc, n) => acc + n, 0);

sum(1, 2, 3, 4); // 10

// Rest in destructuring
const { a, b, ...remaining } = { a: 1, b: 2, c: 3, d: 4 };
// remaining = { c: 3, d: 4 }`,
        },
      ],
    },
    {
      title: 'Default Parameters',
      items: [
        {
          label: 'Syntax',
          code: `const greet = (name = 'stranger', greeting = 'Hello') =>
  \`\${greeting}, \${name}!\`;

greet();               // "Hello, stranger!"
greet('Alice');        // "Hello, Alice!"
greet('Bob', 'Hi');    // "Hi, Bob!"

// Default can reference earlier params
const range = (start = 0, end = start + 10) => [start, end];`,
        },
      ],
    },
    {
      title: 'Classes',
      items: [
        {
          label: 'Class syntax',
          code: `class Animal {
  #sound;       // private field

  constructor(name, sound) {
    this.name = name;
    this.#sound = sound;
  }

  speak = () => \`\${this.name} says \${this.#sound}\`;

  static create = (name) => new Animal(name, '...');
}

const dog = new Animal('Rex', 'woof');
dog.speak(); // "Rex says woof"`,
        },
        {
          label: 'Inheritance',
          code: `class Dog extends Animal {
  constructor(name, breed) {
    super(name, 'woof');
    this.breed = breed;
  }

  info = () => \`\${this.name} (\${this.breed})\`;
}`,
        },
      ],
    },
    {
      title: 'Modules',
      items: [
        {
          label: 'Named exports',
          code: `// math.js
export const PI = 3.14159;
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;

// consumer.js
import { PI, add } from './math.js';
import { add as sum } from './math.js';  // alias
import * as math from './math.js';       // namespace`,
        },
        {
          label: 'Default export',
          code: `// logger.js
const logger = {
  log:  (msg) => console.log(\`[LOG] \${msg}\`),
  warn: (msg) => console.warn(\`[WARN] \${msg}\`),
};
export default logger;

// consumer.js — any name works
import logger from './logger.js';`,
        },
        {
          label: 'Re-exports',
          code: `// index.js — barrel file
export { add, multiply } from './math.js';
export { default as logger } from './logger.js';
export * from './utils.js';`,
        },
      ],
    },
    {
      title: 'Promises',
      items: [
        {
          label: 'Creating & chaining',
          code: `const fetchUser = (id) =>
  new Promise((resolve, reject) => {
    if (id > 0) resolve({ id, name: 'Alice' });
    else reject(new Error('Invalid ID'));
  });

fetchUser(1)
  .then(user => user.name)
  .then(name => console.log(name))
  .catch(err => console.error(err))
  .finally(() => console.log('done'));`,
        },
        {
          label: 'Promise combinators',
          code: `// All must resolve
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// First to settle wins
const fastest = await Promise.race([fetchA(), fetchB()]);

// All settle (never rejects)
const results = await Promise.allSettled([fetchA(), fetchB()]);
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.error(r.reason);
});

// First to resolve without rejecting
const first = await Promise.any([fetchA(), fetchB()]);`,
        },
      ],
    },
    {
      title: 'Async / Await',
      items: [
        {
          label: 'Basic pattern',
          code: `const getUser = async (id) => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
};`,
        },
        {
          label: 'Error handling & parallel',
          code: `// try/catch
const loadData = async () => {
  try {
    const user = await getUser(1);
    return await getPosts(user.id);
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Parallel execution
const loadAll = async () => {
  const [user, settings] = await Promise.all([
    getUser(1),
    getSettings(),
  ]);
  return { user, settings };
};`,
        },
      ],
    },
    {
      title: 'Optional Chaining & Nullish',
      items: [
        {
          label: 'Optional chaining (?.)',
          code: `const user = getUser();  // might be null/undefined

// Property access
const city = user?.address?.city;

// Method call
user?.greet();

// Array index
const first = arr?.[0];`,
        },
        {
          label: 'Nullish coalescing (??)',
          code: `// ?? — only falls back on null / undefined (not 0 or '')
const name = user?.name ?? 'Anonymous';
const port = config.port ?? 3000;

// vs || which falls back on any falsy value
const count = input || 10;   // 0 becomes 10 ❌
const count = input ?? 10;   // 0 stays 0  ✅

// Nullish assignment
user.name ??= 'Anonymous';  // only assigns if null/undefined`,
        },
      ],
    },
    {
      title: 'Array Methods',
      items: [
        {
          label: 'Transforming',
          code: `const nums = [1, 2, 3, 4, 5];

nums.map(n => n * 2);               // [2, 4, 6, 8, 10]
nums.filter(n => n % 2 === 0);      // [2, 4]
nums.reduce((acc, n) => acc + n, 0);// 15
nums.flatMap(n => [n, n * 2]);      // [1,2, 2,4, 3,6 ...]`,
        },
        {
          label: 'Finding & testing',
          code: `const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

users.find(u => u.id === 1);        // { id:1, name:'Alice' }
users.findIndex(u => u.id === 2);   // 1
users.some(u => u.name === 'Bob');  // true
users.every(u => u.id > 0);        // true`,
        },
        {
          label: 'Sorting & slicing',
          code: `const arr = [3, 1, 4, 1, 5];

// Always provide comparator for numbers
[...arr].sort((a, b) => a - b);  // [1, 1, 3, 4, 5]

arr.slice(1, 3);   // [1, 4] — non-mutating
arr.at(-1);        // 5 — last element
arr.flat(2);       // flattens 2 levels deep`,
        },
      ],
    },
    {
      title: 'Object Methods',
      items: [
        {
          label: 'Shorthand & computed keys',
          code: `const name = 'Alice', age = 30;

// Shorthand property
const user = { name, age };         // { name:'Alice', age:30 }

// Computed key
const key = 'role';
const config = { [key]: 'admin' }; // { role: 'admin' }`,
        },
        {
          label: 'Object utilities',
          code: `const obj = { a: 1, b: 2, c: 3 };

Object.keys(obj);     // ['a', 'b', 'c']
Object.values(obj);   // [1, 2, 3]
Object.entries(obj);  // [['a',1], ['b',2], ['c',3]]

// Build object from entries
const doubled = Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, v * 2])
); // { a:2, b:4, c:6 }`,
        },
      ],
    },
    {
      title: 'Map & Set',
      items: [
        {
          label: 'Map',
          code: `const map = new Map();
map.set('a', 1);
map.set('b', 2);
map.get('a');      // 1
map.has('c');      // false
map.size;          // 2

for (const [key, val] of map) {
  console.log(key, val);
}`,
        },
        {
          label: 'Set',
          code: `const set = new Set([1, 2, 3, 2, 1]);
// Set { 1, 2, 3 } — deduplicates

// Deduplicate an array
const unique = [...new Set([1, 2, 2, 3])]; // [1, 2, 3]

// Set operations
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const union = new Set([...a, ...b]);
const intersection = new Set([...a].filter(x => b.has(x)));`,
        },
      ],
    },
    {
      title: 'Iterators & for...of',
      items: [
        {
          label: 'for...of',
          code: `// Arrays
for (const item of ['a', 'b', 'c']) console.log(item);

// With index
for (const [i, item] of ['a', 'b', 'c'].entries()) {
  console.log(i, item);
}

// Map, Set, String all work the same way
for (const [key, val] of map) console.log(key, val);
for (const char of 'hello') console.log(char);`,
        },
        {
          label: 'Generator functions',
          code: `function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}

const nums = [...range(0, 10, 2)]; // [0, 2, 4, 6, 8]

// Infinite sequence
function* ids() {
  let id = 1;
  while (true) yield id++;
}
const gen = ids();
gen.next().value; // 1
gen.next().value; // 2`,
        },
      ],
    },
  ];
}

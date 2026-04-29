// ============================================================
// HELPERS — All pure arrow functions (ES6)
// ============================================================

// ── Generic Array Helpers ─────────────────────────────────

/**
 * Groups an array into a record keyed by the value returned from `keyFn`.
 * @param arr - The source array.
 * @param keyFn - Function that derives the group key from each item.
 */
export const groupBy = <T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> =>
  arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      return { ...acc, [key]: [...(acc[key] ?? []), item] };
    },
    {} as Record<K, T[]>,
  );

/**
 * Returns a sorted copy of `arr` without mutating the original.
 * @param arr - The source array.
 * @param keyFn - Function that derives the sort key from each item.
 * @param dir - Sort direction. Defaults to `'asc'`.
 */
export const sortBy = <T>(
  arr: T[],
  keyFn: (item: T) => string | number,
  dir: "asc" | "desc" = "asc",
): T[] =>
  [...arr].sort((a, b) => {
    const ka = keyFn(a),
      kb = keyFn(b);
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });

/**
 * Filters an array to unique items based on the value returned by `keyFn`.
 * The first occurrence of each key is kept; subsequent duplicates are dropped.
 * @param arr - The source array.
 * @param keyFn - Function that derives the uniqueness key from each item.
 */
export const uniqueBy = <T>(arr: T[], keyFn: (item: T) => unknown): T[] => {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Splits `arr` into consecutive sub-arrays of at most `size` items.
 * @param arr - The source array.
 * @param size - Maximum number of items per chunk.
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size));
  return result;
};

/** Flattens one level of nesting from a two-dimensional array. */
export const flatten = <T>(arr: T[][]): T[] =>
  arr.reduce((acc, cur) => [...acc, ...cur], []);

// ── Generic Object Helpers ────────────────────────────────

/**
 * Returns a new object containing only the specified `keys` from `obj`.
 * @param obj - The source object.
 * @param keys - Keys to include in the result.
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> =>
  keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>);

/**
 * Returns a shallow copy of `obj` with the specified `keys` removed.
 * @param obj - The source object.
 * @param keys - Keys to exclude from the result.
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result as Omit<T, K>;
};

/**
 * Returns a deep clone of `obj` via JSON serialisation.
 * Non-serialisable values (functions, `undefined`, `Date` objects, etc.)
 * are silently dropped or converted.
 */
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Recursively merges `source` into a copy of `target`.
 * Plain objects are merged deeply; arrays and primitives in `source`
 * overwrite the corresponding `target` value.
 * @param target - Base object.
 * @param source - Partial overrides to apply.
 */
export const deepMerge = <T extends object>(
  target: T,
  source: Partial<T>,
): T => {
  const result = { ...target };
  for (const key in source) {
    const val = source[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = deepMerge(
        result[key] as object,
        val as object,
      ) as T[typeof key];
    } else {
      result[key] = val as T[typeof key];
    }
  }
  return result;
};

// ── Date Helpers ──────────────────────────────────────────

/**
 * Returns a human-readable relative time string such as `"3h ago"` or `"in 2d"`.
 * Falls back to a short formatted date for differences beyond 30 days.
 * @param date - The reference date to compare against now.
 */
export const relativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const prefix = future ? "in " : "";
  const suffix = future ? "" : " ago";

  if (abs < 60_000) return "just now";
  if (abs < 3_600_000) return `${prefix}${Math.floor(abs / 60_000)}m${suffix}`;
  if (abs < 86_400_000)
    return `${prefix}${Math.floor(abs / 3_600_000)}h${suffix}`;
  if (abs < 2_592_000_000)
    return `${prefix}${Math.floor(abs / 86_400_000)}d${suffix}`;
  return formatDate(date, "short");
};

/**
 * Formats a `Date` as a localised string.
 * @param date - The date to format.
 * @param format - `'short'` (e.g. "Jan 1, 2025"), `'long'` (full month name),
 *   or `'relative'` (delegates to {@link relativeTime}).
 */
export const formatDate = (
  date: Date,
  format: "short" | "long" | "relative" = "short",
): string => {
  if (format === "relative") return relativeTime(date);
  return date.toLocaleDateString("en-US", {
    month: format === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Returns a new `Date` that is `days` days after `date`.
 * @param date - The starting date (not mutated).
 * @param days - Number of days to add (negative values subtract).
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Returns `true` when `date` is within `days` calendar days of now
 * (in either direction).
 */
export const isWithinDays = (date: Date, days: number): boolean =>
  Math.abs(Date.now() - date.getTime()) < days * 86_400_000;

// ── String Helpers ────────────────────────────────────────

/** Uppercases the first character and lowercases the rest. */
export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Converts a string to Title Case by capitalising each whitespace-delimited word. */
export const titleCase = (s: string): string =>
  s.split(/\s+/).map(capitalize).join(" ");

/** Converts a string to a URL-safe slug (lowercase, hyphens, no special characters). */
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

/**
 * Truncates `s` to `max` characters, appending `ellipsis` when truncation occurs.
 * @param s - The string to truncate.
 * @param max - Maximum total output length including the ellipsis.
 * @param ellipsis - Suffix appended on truncation. Defaults to `'…'`.
 */
export const truncate = (s: string, max: number, ellipsis = "…"): string =>
  s.length > max ? s.slice(0, max - ellipsis.length) + ellipsis : s;

/**
 * Wraps all case-insensitive occurrences of `query` in `<mark>` tags.
 * Returns `text` unchanged when `query` is blank.
 * @param text - The source string to search within.
 * @param query - The substring to highlight.
 */
export const highlight = (text: string, query: string): string => {
  if (!query.trim()) return text;
  const re = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(re, "<mark>$1</mark>");
};

// ── Number Helpers ────────────────────────────────────────

/**
 * Clamps `value` so it never falls below `min` or above `max`.
 * @param value - The number to clamp.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Linearly interpolates between `a` and `b` by factor `t`.
 * `t = 0` returns `a`, `t = 1` returns `b`, `t = 0.5` returns the midpoint.
 * `t` is clamped to `[0, 1]` so the result never overshoots.
 * @param a - Start value.
 * @param b - End value.
 * @param t - Interpolation factor (0–1).
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * clamp(t, 0, 1);

/**
 * Formats a byte count as a human-readable string (`B`, `KB`, `MB`, or `GB`).
 * @param bytes - Raw byte count.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
};

/**
 * Formats a decimal hour value as `"Xh Ym"` (e.g. `1.5` → `"1h 30m"`).
 * Omits the minutes segment when there are no remaining minutes.
 * @param h - Hours as a decimal number.
 */
export const formatHours = (h: number): string => {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculates `part` as a percentage of `total`, rounded to `decimals` places.
 * Returns `0` when `total` is zero to avoid division by zero.
 * @param part - The numerator.
 * @param total - The denominator.
 * @param decimals - Decimal places in the result. Defaults to `0`.
 */
export const percentage = (
  part: number,
  total: number,
  decimals = 0,
): number =>
  total === 0 ? 0 : parseFloat(((part / total) * 100).toFixed(decimals));

// ── Async Helpers ─────────────────────────────────────────

/**
 * Returns a `Promise` that resolves after `ms` milliseconds.
 * Useful for adding deliberate delays in async flows.
 * @param ms - Duration in milliseconds.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls `fn` and retries on failure with exponential backoff.
 * Each retry doubles the delay. Throws the last error when all attempts fail.
 * @param fn - Async function to attempt.
 * @param times - Maximum number of attempts. Defaults to `3`.
 * @param delay - Initial delay between retries in milliseconds. Defaults to `500`.
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  times = 3,
  delay = 500,
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (times <= 1) throw err;
    await sleep(delay);
    return retry(fn, times - 1, delay * 2);
  }
};

/**
 * Returns a debounced version of `fn` that only fires after `wait` ms of
 * inactivity. Repeated calls within the wait window reset the timer.
 * @param fn - The function to debounce.
 * @param wait - Quiet period in milliseconds before `fn` is invoked.
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

/**
 * Returns a throttled version of `fn` that fires at most once per `limit` ms,
 * regardless of how frequently the returned function is called.
 * @param fn - The function to throttle.
 * @param limit - Minimum interval in milliseconds between invocations.
 */
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= limit) {
      last = now;
      fn(...args);
    }
  };
};

// ── Validation Helpers ────────────────────────────────────

/** Collection of reusable field validator predicates. */
export const Validators = {
  /** `true` when `v` is not `null`, `undefined`, or an empty string. */
  required: (v: unknown): boolean => v !== null && v !== undefined && v !== "",
  /** `true` when `v` matches a basic email pattern. */
  email: (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  /** Returns a validator that passes when `v.length >= min`. */
  minLen: (min: number) => (v: string) => v.length >= min,
  /** Returns a validator that passes when `v.length <= max`. */
  maxLen: (max: number) => (v: string) => v.length <= max,
  /** Returns a validator that passes when `min <= v <= max`. */
  range: (min: number, max: number) => (v: number) => v >= min && v <= max,
  /** `true` when `v` is a parseable URL. */
  url: (v: string): boolean => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },
};

// ── Color Helpers ─────────────────────────────────────────

/**
 * Parses a CSS hex colour string into its `{ r, g, b }` components.
 * Returns `null` when `hex` is not a valid 6-digit hex colour.
 * @param hex - Hex colour string with or without a leading `#`.
 */
export const hexToRgb = (
  hex: string,
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Returns `'#000000'` or `'#ffffff'` — whichever provides better contrast
 * against `hex` — based on the ITU-R BT.601 luminance formula.
 * @param hex - Background colour as a hex string.
 */
export const contrastColor = (hex: string): "#000000" | "#ffffff" => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// ── Memoization ───────────────────────────────────────────

/**
 * Returns a memoized version of `fn` that caches results by stringified
 * arguments. Subsequent calls with identical arguments return the cached
 * value instead of re-executing `fn`.
 *
 * Only suitable for pure functions with serialisable arguments.
 * @param fn - The pure function to memoize.
 */
export const memoize = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): ((...args: TArgs) => TReturn) => {
  const cache = new Map<string, TReturn>();
  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

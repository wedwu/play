import {
  groupBy, sortBy, uniqueBy, chunk, flatten,
  pick, omit, deepClone, deepMerge,
  clamp, lerp, formatBytes, formatHours, percentage,
  truncate, slugify, capitalize, titleCase, highlight,
  sleep, retry, debounce, memoize,
  Validators, hexToRgb, contrastColor,
  addDays, isWithinDays,
} from './utils.helper';

// ── Array ─────────────────────────────────────

describe('groupBy', () => {
  it('groups items by key', () => {
    const result = groupBy([1, 2, 3, 4], n => (n % 2 === 0 ? 'even' : 'odd'));
    expect(result['even']).toEqual([2, 4]);
    expect(result['odd']).toEqual([1, 3]);
  });

  it('returns empty object for empty array', () => {
    expect(groupBy([], x => x)).toEqual({});
  });
});

describe('sortBy', () => {
  const items = [{ n: 3 }, { n: 1 }, { n: 2 }];

  it('sorts ascending by default', () => {
    expect(sortBy(items, i => i.n).map(i => i.n)).toEqual([1, 2, 3]);
  });

  it('sorts descending', () => {
    expect(sortBy(items, i => i.n, 'desc').map(i => i.n)).toEqual([3, 2, 1]);
  });

  it('does not mutate original', () => {
    const original = [{ n: 3 }, { n: 1 }];
    sortBy(original, i => i.n);
    expect(original[0].n).toBe(3);
  });
});

describe('uniqueBy', () => {
  it('keeps first occurrence of duplicate keys', () => {
    const items = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }];
    expect(uniqueBy(items, i => i.id).map(i => i.v)).toEqual(['a', 'b']);
  });
});

describe('chunk', () => {
  it('splits into equal chunks', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('last chunk may be smaller', () => {
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 2)).toEqual([]);
  });
});

describe('flatten', () => {
  it('flattens one level of nesting', () => {
    expect(flatten([[1, 2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
  });
});

// ── Object ────────────────────────────────────

describe('pick', () => {
  it('returns only the specified keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
});

describe('omit', () => {
  it('excludes the specified keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });
});

describe('deepClone', () => {
  it('produces an independent copy', () => {
    const original = { a: { b: 1 } };
    const clone = deepClone(original);
    clone.a.b = 99;
    expect(original.a.b).toBe(1);
  });
});

describe('deepMerge', () => {
  it('merges nested objects recursively', () => {
    const base   = { config: { debug: false, port: 3000 }, name: 'app' };
    const result = deepMerge(base, { config: { debug: true, port: 3000 } });
    expect(result).toEqual({ config: { debug: true, port: 3000 }, name: 'app' });
  });

  it('source primitive overwrites target', () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 99 })).toEqual({ a: 1, b: 99 });
  });

  it('does not modify the original target', () => {
    const target = { x: 1 };
    deepMerge(target, { x: 2 });
    expect(target.x).toBe(1);
  });
});

// ── Number ────────────────────────────────────

describe('clamp', () => {
  it('returns value when within range', () => expect(clamp(5, 0, 10)).toBe(5));
  it('clamps to min',                  () => expect(clamp(-5, 0, 10)).toBe(0));
  it('clamps to max',                  () => expect(clamp(15, 0, 10)).toBe(10));
});

describe('lerp', () => {
  it('returns a at t=0',        () => expect(lerp(0, 100, 0)).toBe(0));
  it('returns b at t=1',        () => expect(lerp(0, 100, 1)).toBe(100));
  it('returns midpoint at t=0.5', () => expect(lerp(0, 100, 0.5)).toBe(50));
  it('clamps t below 0',        () => expect(lerp(0, 100, -1)).toBe(0));
  it('clamps t above 1',        () => expect(lerp(0, 100, 2)).toBe(100));
});

describe('formatBytes', () => {
  it('formats bytes',     () => expect(formatBytes(512)).toBe('512 B'));
  it('formats kilobytes', () => expect(formatBytes(1536)).toBe('1.5 KB'));
  it('formats megabytes', () => expect(formatBytes(2 * 1_048_576)).toBe('2.0 MB'));
  it('formats gigabytes', () => expect(formatBytes(1_073_741_824)).toBe('1.0 GB'));
});

describe('formatHours', () => {
  it('formats whole hours',         () => expect(formatHours(3)).toBe('3h'));
  it('formats hours with minutes',  () => expect(formatHours(1.5)).toBe('1h 30m'));
  it('rounds minutes',              () => expect(formatHours(0.25)).toBe('0h 15m'));
});

describe('percentage', () => {
  it('calculates percentage',     () => expect(percentage(1, 4)).toBe(25));
  it('returns 0 when total is 0', () => expect(percentage(5, 0)).toBe(0));
  it('respects decimal places',   () => expect(percentage(1, 3, 2)).toBe(33.33));
});

// ── String ────────────────────────────────────

describe('truncate', () => {
  it('leaves short strings unchanged', () => expect(truncate('hello', 10)).toBe('hello'));
  it('truncates and appends ellipsis', () => expect(truncate('hello world', 8)).toBe('hello w…'));
  it('respects custom ellipsis',       () => expect(truncate('hello world', 8, '...')).toBe('hello...'));
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => expect(slugify('Hello World')).toBe('hello-world'));
  it('strips special characters',                   () => expect(slugify('Héllo! @World#')).toBe('hllo-world'));
});

describe('capitalize', () => {
  it('uppercases first letter and lowercases rest', () => expect(capitalize('hELLO')).toBe('Hello'));
});

describe('titleCase', () => {
  it('capitalises every word', () => expect(titleCase('hello world')).toBe('Hello World'));
});

describe('highlight', () => {
  it('wraps matches in <mark>', () =>
    expect(highlight('hello world', 'world')).toBe('hello <mark>world</mark>'));
  it('is case-insensitive', () =>
    expect(highlight('Hello World', 'hello')).toBe('<mark>Hello</mark> World'));
  it('returns original when query is blank', () =>
    expect(highlight('hello', '')).toBe('hello'));
});

// ── Async ─────────────────────────────────────

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('retry', () => {
  it('resolves on first success', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    await expect(retry(fn, 3)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually resolves', async () => {
    let calls = 0;
    const fn = jest.fn().mockImplementation(async () => {
      if (++calls < 3) throw new Error('fail');
      return 'ok';
    });
    await expect(retry(fn, 3, 0)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after all attempts fail', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, 2, 0)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only calls fn once after wait period', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced(); debounced(); debounced();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on each call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('memoize', () => {
  it('returns cached result for identical arguments', () => {
    const fn = jest.fn((n: number) => n * 2);
    const memoized = memoize(fn);
    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('recomputes for different arguments', () => {
    const fn = jest.fn((n: number) => n * 2);
    const memoized = memoize(fn);
    memoized(1); memoized(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ── Validation ────────────────────────────────

describe('Validators', () => {
  it('required: false for null',            () => expect(Validators.required(null)).toBe(false));
  it('required: false for empty string',    () => expect(Validators.required('')).toBe(false));
  it('required: true for non-empty string', () => expect(Validators.required('x')).toBe(true));
  it('email: valid address passes',         () => expect(Validators.email('a@b.com')).toBe(true));
  it('email: invalid address fails',        () => expect(Validators.email('not-an-email')).toBe(false));
  it('minLen: passes at boundary',          () => expect(Validators.minLen(3)('abc')).toBe(true));
  it('minLen: fails below boundary',        () => expect(Validators.minLen(3)('ab')).toBe(false));
  it('range: passes within range',          () => expect(Validators.range(1, 10)(5)).toBe(true));
  it('range: fails outside range',          () => expect(Validators.range(1, 10)(11)).toBe(false));
  it('url: valid URL passes',               () => expect(Validators.url('https://example.com')).toBe(true));
  it('url: invalid URL fails',              () => expect(Validators.url('not a url')).toBe(false));
});

// ── Color ─────────────────────────────────────

describe('hexToRgb', () => {
  it('parses a 6-digit hex colour', () =>
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 }));
  it('parses without leading #', () =>
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 }));
  it('returns null for invalid input', () =>
    expect(hexToRgb('nope')).toBeNull());
});

describe('contrastColor', () => {
  it('returns black on a light background', () =>
    expect(contrastColor('#ffffff')).toBe('#000000'));
  it('returns white on a dark background', () =>
    expect(contrastColor('#000000')).toBe('#ffffff'));
});

// ── Date ──────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    const base = new Date(2024, 0, 1); // 1 Jan 2024 local time
    expect(addDays(base, 5).getDate()).toBe(6);
  });

  it('does not mutate the original date', () => {
    const base = new Date(2024, 0, 1);
    addDays(base, 10);
    expect(base.getDate()).toBe(1);
  });
});

describe('isWithinDays', () => {
  it('returns true when date is within range', () => {
    expect(isWithinDays(new Date(), 1)).toBe(true);
  });

  it('returns false when date is outside range', () => {
    const old = new Date(Date.now() - 10 * 86_400_000);
    expect(isWithinDays(old, 1)).toBe(false);
  });
});

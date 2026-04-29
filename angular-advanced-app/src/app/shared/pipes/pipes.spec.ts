import {
  RelativeTimePipe,
  TruncatePipe,
  HighlightPipe,
  FileSizePipe,
  HoursPipe,
  PriorityLabelPipe,
  InitialsPipe,
  PluralizePipe,
} from "./pipes";
import { TaskPriority } from "../../../app/core/models/task.model";

// ── RelativeTimePipe ──────────────────────────

describe("RelativeTimePipe", () => {
  const pipe = new RelativeTimePipe();

  it('returns "" for null input', () => expect(pipe.transform(null)).toBe(""));

  it('returns "just now" for very recent date', () => {
    expect(pipe.transform(new Date())).toBe("just now");
  });

  it("returns a relative string for older dates", () => {
    const anHourAgo = new Date(Date.now() - 3_700_000);
    expect(pipe.transform(anHourAgo)).toMatch(/h ago/);
  });

  it("accepts an ISO string", () => {
    expect(pipe.transform(new Date().toISOString())).toBe("just now");
  });
});

// ── TruncatePipe ──────────────────────────────

describe("TruncatePipe", () => {
  const pipe = new TruncatePipe();

  it("leaves short strings unchanged", () =>
    expect(pipe.transform("hello", 10)).toBe("hello"));

  it("truncates long strings with default ellipsis", () =>
    expect(pipe.transform("hello world", 8)).toBe("hello w…"));

  it("uses a custom ellipsis", () =>
    expect(pipe.transform("hello world", 8, "...")).toBe("hello..."));
});

// ── HighlightPipe ─────────────────────────────

describe("HighlightPipe", () => {
  const pipe = new HighlightPipe();

  it("wraps matches in <mark>", () =>
    expect(pipe.transform("hello world", "world")).toBe(
      "hello <mark>world</mark>",
    ));

  it("is case-insensitive", () =>
    expect(pipe.transform("Hello World", "hello")).toBe(
      "<mark>Hello</mark> World",
    ));

  it("returns original when query is blank", () =>
    expect(pipe.transform("hello", "")).toBe("hello"));
});

// ── FileSizePipe ──────────────────────────────

describe("FileSizePipe", () => {
  const pipe = new FileSizePipe();

  it("formats bytes", () => expect(pipe.transform(512)).toBe("512 B"));
  it("formats kilobytes", () => expect(pipe.transform(2048)).toBe("2.0 KB"));
  it("formats megabytes", () =>
    expect(pipe.transform(2 * 1_048_576)).toBe("2.0 MB"));
  it("formats gigabytes", () =>
    expect(pipe.transform(1_073_741_824)).toBe("1.0 GB"));
});

// ── HoursPipe ─────────────────────────────────

describe("HoursPipe", () => {
  const pipe = new HoursPipe();

  it("formats whole hours", () => expect(pipe.transform(3)).toBe("3h"));
  it("formats hours and minutes", () =>
    expect(pipe.transform(1.5)).toBe("1h 30m"));
  it("formats minutes only", () => expect(pipe.transform(0.25)).toBe("0h 15m"));
});

// ── PriorityLabelPipe ─────────────────────────

describe("PriorityLabelPipe", () => {
  const pipe = new PriorityLabelPipe();

  it('maps LOW to "Low"', () =>
    expect(pipe.transform(TaskPriority.LOW)).toBe("Low"));
  it('maps MEDIUM to "Medium"', () =>
    expect(pipe.transform(TaskPriority.MEDIUM)).toBe("Medium"));
  it('maps HIGH to "High"', () =>
    expect(pipe.transform(TaskPriority.HIGH)).toBe("High"));
  it('maps URGENT to "Urgent"', () =>
    expect(pipe.transform(TaskPriority.URGENT)).toBe("Urgent"));
  it('returns "Unknown" for unrecognised value', () =>
    expect(pipe.transform(99 as TaskPriority)).toBe("Unknown"));
});

// ── InitialsPipe ──────────────────────────────

describe("InitialsPipe", () => {
  const pipe = new InitialsPipe();

  it("extracts two initials from a full name", () =>
    expect(pipe.transform("Alice Zhang")).toBe("AZ"));
  it("handles a single-word name", () =>
    expect(pipe.transform("Alice")).toBe("A"));
  it("uppercases all initials", () =>
    expect(pipe.transform("alice zhang")).toBe("AZ"));
  it("caps output at two characters", () =>
    expect(pipe.transform("A B C D").length).toBeLessThanOrEqual(2));
});

// ── PluralizePipe ─────────────────────────────

describe("PluralizePipe", () => {
  const pipe = new PluralizePipe();

  it("uses singular for count 1", () =>
    expect(pipe.transform(1, "task")).toBe("1 task"));
  it('auto-appends "s" for count > 1', () =>
    expect(pipe.transform(3, "task")).toBe("3 tasks"));
  it("uses custom plural when provided", () =>
    expect(pipe.transform(2, "person", "people")).toBe("2 people"));
  it("uses singular plural for count 0", () =>
    expect(pipe.transform(0, "task")).toBe("0 tasks"));
});

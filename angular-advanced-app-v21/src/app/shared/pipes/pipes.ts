// ============================================================
// CUSTOM PIPES — ES6 Arrow transform methods
// ============================================================

import { Pipe, PipeTransform } from '@angular/core';
import { relativeTime, truncate, highlight, formatBytes, formatHours } from '../../core/helpers/utils.helper';
import { TaskPriority } from '../../core/models/task.model';

/**
 * Converts a `Date` (or ISO string) to a human-readable relative time string
 * such as `"3h ago"` or `"in 2d"`.
 *
 * Marked **impure** so it updates automatically as time passes.
 * @see {@link relativeTime}
 */
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  transform = (value: Date | string | null): string =>
    value ? relativeTime(new Date(value)) : '';
}

/**
 * Shortens a string to `limit` characters, appending `ellipsis` when truncation occurs.
 * @see {@link truncate}
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform = (value: string, limit = 80, ellipsis = '…'): string =>
    truncate(value, limit, ellipsis);
}

/**
 * Wraps all case-insensitive occurrences of `query` in `<mark>` tags.
 * Returns the original string when `query` is blank.
 * @see {@link highlight}
 */
@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  transform = (value: string, query: string): string => highlight(value, query);
}

/**
 * Formats a raw byte count as a human-readable string (`B`, `KB`, `MB`, or `GB`).
 * @see {@link formatBytes}
 */
@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  transform = (bytes: number): string => formatBytes(bytes);
}

/**
 * Formats a decimal hour value as `"Xh Ym"` (e.g. `1.5` → `"1h 30m"`).
 * Omits the minutes segment when there are none.
 * @see {@link formatHours}
 */
@Pipe({ name: 'hours', standalone: true })
export class HoursPipe implements PipeTransform {
  transform = (hours: number): string => formatHours(hours);
}

/**
 * Maps a {@link TaskPriority} numeric value to its display label
 * (`'Low'`, `'Medium'`, `'High'`, or `'Urgent'`).
 * Returns `'Unknown'` for unrecognised values.
 */
@Pipe({ name: 'priorityLabel', standalone: true })
export class PriorityLabelPipe implements PipeTransform {
  private readonly labels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]:    'Low',
    [TaskPriority.MEDIUM]: 'Medium',
    [TaskPriority.HIGH]:   'High',
    [TaskPriority.URGENT]: 'Urgent',
  };
  transform = (priority: TaskPriority): string => this.labels[priority] ?? 'Unknown';
}

/**
 * Extracts up to two uppercase initials from a full name string.
 * Splits on whitespace and takes the first character of each word.
 * @example `"Alice Zhang"` → `"AZ"`
 */
@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform = (name: string): string =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Returns `"<count> <word>"`, automatically pluralising when `count !== 1`.
 * @example `(3, 'task')` → `"3 tasks"` · `(1, 'task')` → `"1 task"`
 */
@Pipe({ name: 'pluralize', standalone: true })
export class PluralizePipe implements PipeTransform {
  transform = (count: number, singular: string, plural?: string): string =>
    `${count} ${count === 1 ? singular : (plural ?? singular + 's')}`;
}

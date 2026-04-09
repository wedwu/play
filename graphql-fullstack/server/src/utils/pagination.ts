/**
 * Relay-style cursor pagination over in-memory arrays.
 *
 * Cursors are opaque base64 strings encoding the item's ID. Clients must
 * not construct or decode them — they should be treated as black-box tokens.
 *
 * Supports all four Relay pagination arguments:
 *   - `first` + `after`  → forward pagination (most common)
 *   - `last`  + `before` → backward pagination
 *
 * The function is generic over any type that has an `id: string` field so it
 * can be reused for tasks, projects, or any future paginated type.
 */
import { Connection, Edge, PageInfo } from '../types';

function encodeCursor(id: string): string {
  return Buffer.from(`cursor:${id}`).toString('base64');
}

function decodeCursor(cursor: string): string {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  return decoded.replace('cursor:', '');
}

export function paginate<T extends { id: string }>(
  items: T[],
  args: { first?: number; after?: string; last?: number; before?: string }
): Connection<T> {
  const { first, after, last, before } = args;

  let sliced = [...items];
  let startIndex = 0;

  if (after) {
    const afterId = decodeCursor(after);
    const idx = sliced.findIndex((item) => item.id === afterId);
    if (idx !== -1) {
      sliced = sliced.slice(idx + 1);
      startIndex = idx + 1;
    }
  }

  if (before) {
    const beforeId = decodeCursor(before);
    const idx = sliced.findIndex((item) => item.id === beforeId);
    if (idx !== -1) {
      sliced = sliced.slice(0, idx);
    }
  }

  const totalCount = items.length;

  if (first != null) {
    sliced = sliced.slice(0, first);
  } else if (last != null) {
    sliced = sliced.slice(Math.max(sliced.length - last, 0));
  }

  const edges: Edge<T>[] = sliced.map((node) => ({
    cursor: encodeCursor(node.id),
    node,
  }));

  const pageInfo: PageInfo = {
    hasNextPage: first != null ? startIndex + first < totalCount : false,
    hasPreviousPage: after != null || (before != null && startIndex > 0),
    startCursor: edges[0]?.cursor,
    endCursor: edges[edges.length - 1]?.cursor,
  };

  return { edges, pageInfo, totalCount };
}

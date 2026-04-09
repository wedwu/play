/**
 * DataLoaders — per-request batching to eliminate N+1 query problems.
 *
 * The N+1 problem: fetching a list of N projects and then resolving each
 * project's `owner` field naively issues N separate lookups. DataLoader
 * collects all the IDs requested within a single event-loop tick, then calls
 * the batch function once with all of them.
 *
 * Rules:
 * 1. A new loader set is created per request (inside `buildContext`).
 *    This means the cache is scoped to one operation — no risk of serving
 *    stale data from a previous request.
 * 2. Batch functions must return results in the same order as the input keys,
 *    with `undefined` for any key that wasn't found. DataLoader uses this
 *    ordering to distribute results back to the individual callers.
 * 3. Loaders that accept non-primitive keys (like arrays of tag IDs) need a
 *    custom `cacheKeyFn` that converts the key to a string.
 */
import DataLoader from 'dataloader';
import { db } from '../datasources/db';
import { User, Task, Comment, Tag } from '../types';

export interface Loaders {
  userLoader: DataLoader<string, User | undefined>;
  tasksByProjectLoader: DataLoader<string, Task[]>;
  commentsByTaskLoader: DataLoader<string, Comment[]>;
  tagsByIdsLoader: DataLoader<string, Tag[]>;
}

export function createLoaders(): Loaders {
  const userLoader = new DataLoader<string, User | undefined>(async (ids) => {
    return ids.map((id) => db.users.get(id));
  });

  const tasksByProjectLoader = new DataLoader<string, Task[]>(async (projectIds) => {
    const all = [...db.tasks.values()];
    return projectIds.map((pid) =>
      all
        .filter((t) => t.projectId === pid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  });

  const commentsByTaskLoader = new DataLoader<string, Comment[]>(async (taskIds) => {
    const all = [...db.comments.values()];
    return taskIds.map((tid) =>
      all
        .filter((c) => c.taskId === tid)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    );
  });

  const tagsByIdsLoader = new DataLoader<string, Tag[]>(
    async (tagIdSets) => {
      return tagIdSets.map((ids) => {
        const parsed = JSON.parse(ids as unknown as string) as string[];
        return parsed.map((id) => db.tags.get(id)).filter(Boolean) as Tag[];
      });
    },
    { cacheKeyFn: (key) => (Array.isArray(key) ? JSON.stringify(key) : key) }
  );

  return { userLoader, tasksByProjectLoader, commentsByTaskLoader, tagsByIdsLoader };
}

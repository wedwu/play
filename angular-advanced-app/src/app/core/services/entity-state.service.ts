// ============================================================
// GENERIC STATE SERVICE — ES6 Arrow Functions Throughout
// ============================================================

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, distinctUntilChanged, debounceTime } from 'rxjs';
import { BaseEntity } from '../models/base-entity.model';

/** Cursor-based pagination state for a list view. */
export interface PaginationState { page: number; pageSize: number; total: number; }

/** Active sort field and direction for a typed entity list. */
export interface SortState<T>    { field: keyof T | null; direction: 'asc' | 'desc'; }

/** Text search query plus any additional key/value filter criteria. */
export interface FilterState     { query: string; [key: string]: unknown; }

/**
 * Complete observable state slice for a collection of entities of type `T`.
 * Emitted as an immutable snapshot via {@link EntityStateService.state$}.
 */
export interface EntityState<T extends BaseEntity> {
  items:      T[];
  selected:   T | null;
  loading:    boolean;
  error:      string | null;
  pagination: PaginationState;
  sort:       SortState<T>;
  filter:     FilterState;
}

const initialState = <T extends BaseEntity>(): EntityState<T> => ({
  items: [], selected: null, loading: false, error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  sort: { field: null, direction: 'asc' },
  filter: { query: '' },
});

/**
 * Abstract generic service that manages observable CRUD, pagination, sorting,
 * and filtering state for any {@link BaseEntity} subtype.
 *
 * Extend this class and implement {@link applyFilterAndSort} to create a
 * type-specific service. All mutations are immutable — every update emits a
 * fresh `EntityState` snapshot through an internal `BehaviorSubject`.
 *
 * @template T The entity type managed by this service.
 */
@Injectable()
export abstract class EntityStateService<T extends BaseEntity> {
  protected readonly _state$ = new BehaviorSubject<EntityState<T>>(initialState<T>());

  /** Full state snapshot stream. Emits on every change. */
  readonly state$      = this._state$.asObservable();
  /** All items in the collection. Emits only when the array reference changes. */
  readonly items$      = this._state$.pipe(map(s => s.items),      distinctUntilChanged());
  /** Currently selected item, or `null` when nothing is selected. */
  readonly selected$   = this._state$.pipe(map(s => s.selected),   distinctUntilChanged());
  /** `true` while an async operation is in-flight. */
  readonly loading$    = this._state$.pipe(map(s => s.loading),     distinctUntilChanged());
  /** Last error message, or `null` when no error is present. */
  readonly error$      = this._state$.pipe(map(s => s.error),       distinctUntilChanged());
  /** Current pagination state (page, pageSize, total). */
  readonly pagination$ = this._state$.pipe(map(s => s.pagination),  distinctUntilChanged());

  /**
   * Items after the current filter and sort are applied.
   * The filter stream is debounced by 150 ms to prevent thrashing on rapid input.
   */
  readonly filteredItems$: Observable<T[]> = combineLatest([
    this.items$,
    this._state$.pipe(map(s => s.filter), debounceTime(150)),
    this._state$.pipe(map(s => s.sort)),
  ]).pipe(
    map(([items, filter, sort]) => this.applyFilterAndSort(items, filter, sort))
  );

  /** The current page slice of {@link filteredItems$} according to {@link pagination$}. */
  readonly pagedItems$: Observable<T[]> = combineLatest([
    this.filteredItems$,
    this.pagination$,
  ]).pipe(
    map(([items, page]) => items.slice(
      (page.page - 1) * page.pageSize,
      page.page * page.pageSize
    ))
  );

  protected get state(): EntityState<T> { return this._state$.getValue(); }

  /**
   * Merges `patch` into the current state and emits the updated snapshot.
   * All state mutations must go through this method.
   */
  protected setState = (patch: Partial<EntityState<T>>): void => {
    this._state$.next({ ...this.state, ...patch });
  };

  // ── CRUD ──────────────────────────────────────

  /** Appends a single item to the collection. */
  add = (item: T): void =>
    this.setState({ items: [...this.state.items, item] });

  /** Appends multiple items to the collection in a single state emission. */
  addMany = (items: T[]): void =>
    this.setState({ items: [...this.state.items, ...items] });

  /**
   * Applies `patch` to the item matching `id`, preserving the prototype chain
   * so class methods remain available on the updated instance.
   * @param id - ID of the item to update.
   * @param patch - Partial fields to merge into the existing item.
   */
  update = (id: string, patch: Partial<T>): void =>
    this.setState({
      items: this.state.items.map(i =>
        i.id === id
          ? Object.assign(Object.create(Object.getPrototypeOf(i)), i, patch)
          : i
      ),
    });

  /**
   * Removes the item with the given `id` from the collection.
   * @param id - ID of the item to remove.
   */
  remove = (id: string): void =>
    this.setState({ items: this.state.items.filter(i => i.id !== id) });

  /** Sets the currently selected item. Pass `null` to clear the selection. */
  select = (item: T | null): void => this.setState({ selected: item });

  /**
   * Finds the item with the given `id` and makes it the active selection.
   * Clears the selection if no match is found.
   */
  selectById = (id: string): void =>
    this.select(this.state.items.find(i => i.id === id) ?? null);

  // ── Pagination ────────────────────────────────

  /**
   * Navigates to the given page (1-indexed) without changing `pageSize`.
   * @param page - Target page number.
   */
  setPage = (page: number): void =>
    this.setState({ pagination: { ...this.state.pagination, page } });

  /**
   * Changes the number of items per page and resets to page 1.
   * @param pageSize - New page size.
   */
  setPageSize = (pageSize: number): void =>
    this.setState({ pagination: { ...this.state.pagination, pageSize, page: 1 } });

  // ── Sorting ───────────────────────────────────

  /**
   * Sets the active sort field. When `field` is already active, the direction
   * toggles automatically unless `direction` is explicitly provided.
   * @param field - The entity property to sort by.
   * @param direction - Force `'asc'` or `'desc'`; auto-toggles when omitted.
   */
  setSort = (field: keyof T, direction?: 'asc' | 'desc'): void => {
    const current = this.state.sort;
    const dir = direction ?? (current.field === field && current.direction === 'asc' ? 'desc' : 'asc');
    this.setState({ sort: { field, direction: dir } });
  };

  // ── Filtering ─────────────────────────────────

  /**
   * Updates the free-text search query and resets to page 1.
   * @param query - Search string matched against entity fields.
   */
  setQuery = (query: string): void =>
    this.setState({ filter: { ...this.state.filter, query }, pagination: { ...this.state.pagination, page: 1 } });

  /**
   * Sets a named filter key to a value and resets to page 1.
   * @param key - Filter key (e.g. `'status'`, `'priority'`).
   * @param value - Value to filter by.
   */
  setFilter = (key: string, value: unknown): void =>
    this.setState({ filter: { ...this.state.filter, [key]: value }, pagination: { ...this.state.pagination, page: 1 } });

  /** Resets all filters to their initial state. Sort and pagination are preserved. */
  clearFilters = (): void => this.setState({ filter: { query: '' } });

  // ── Loading / Error ───────────────────────────

  /** Sets the loading flag. Use `true` before an async operation, `false` after. */
  setLoading = (loading: boolean): void => this.setState({ loading });

  /**
   * Records an error message and clears the loading flag.
   * Pass `null` to clear a previous error.
   */
  setError   = (error: string | null): void => this.setState({ error, loading: false });

  // ── Queries ───────────────────────────────────

  /**
   * Returns the item matching `id` from the current in-memory state.
   * Returns `undefined` if no match is found.
   */
  getById = (id: string): T | undefined =>
    this.state.items.find(i => i.id === id);

  /** Total number of items currently held in the collection. */
  get count(): number { return this.state.items.length; }

  // ── Abstract ──────────────────────────────────

  /**
   * Subclass must implement the combined filter and sort logic for type `T`.
   * Called automatically by {@link filteredItems$} whenever state changes.
   *
   * @param items - The full unfiltered item list.
   * @param filter - Current filter state.
   * @param sort - Current sort state.
   * @returns Filtered and sorted items ready for pagination.
   */
  protected abstract applyFilterAndSort(items: T[], filter: FilterState, sort: SortState<T>): T[];
}

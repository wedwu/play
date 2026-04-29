import { describe, beforeEach, it, expect } from '@jest/globals';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseEntity } from '../models/base-entity.model';
import { EntityStateService, FilterState, SortState } from './entity-state.service';

// ── Minimal concrete types for testing ───────────────────────────────────────

class Item extends BaseEntity {
  constructor(public name: string, public priority = 0) { super('system'); }
  validate      = (): boolean => true;
  getDisplayName = (): string => this.name;
  serialize      = (): Record<string, unknown> => ({ ...this.baseSerialize(), name: this.name });
  clone          = (): Item => new Item(this.name, this.priority);
}

@Injectable()
class TestService extends EntityStateService<Item> {
  protected override applyFilterAndSort = (
    items: Item[], filter: FilterState, sort: SortState<Item>
  ): Item[] => {
    let result = filter.query
      ? items.filter(i => i.name.toLowerCase().includes(filter.query.toLowerCase()))
      : [...items];
    if (sort.field === 'name') {
      result.sort((a, b) => sort.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name));
    }
    return result;
  };
}

const item = (name: string, priority = 0): Item => new Item(name, priority);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EntityStateService', () => {
  let service: TestService;

  beforeEach(() => { service = new TestService(); });

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with an empty items array', () => expect(service.count).toBe(0));
    it('starts with no selection',         () => expect(service['state'].selected).toBeNull());
    it('starts not loading',               () => expect(service['state'].loading).toBe(false));
    it('starts with no error',             () => expect(service['state'].error).toBeNull());
    it('starts on page 1 with pageSize 10', () => {
      const { page, pageSize } = service['state'].pagination;
      expect(page).toBe(1);
      expect(pageSize).toBe(10);
    });
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────

  describe('add', () => {
    it('appends an item and increments count', () => {
      service.add(item('Alpha'));
      expect(service.count).toBe(1);
    });

    it('preserves existing items', () => {
      service.add(item('A'));
      service.add(item('B'));
      expect(service.count).toBe(2);
    });
  });

  describe('addMany', () => {
    it('appends all items in a single emission', () => {
      service.addMany([item('A'), item('B'), item('C')]);
      expect(service.count).toBe(3);
    });
  });

  describe('update', () => {
    it('merges the patch into the matching item', () => {
      const i = item('Old');
      service.add(i);
      service.update(i.id, { name: 'New' } as Partial<Item>);
      expect(service.getById(i.id)?.name).toBe('New');
    });

    it('preserves the prototype chain (instanceof still works)', () => {
      const i = item('Test');
      service.add(i);
      service.update(i.id, { name: 'Updated' } as Partial<Item>);
      const updated = service.getById(i.id);
      expect(updated).toBeInstanceOf(Item);
      expect(updated?.name).toBe('Updated');
    });

    it('leaves other items untouched', () => {
      const a = item('A');
      const b = item('B');
      service.addMany([a, b]);
      service.update(a.id, { name: 'A2' } as Partial<Item>);
      expect(service.getById(b.id)?.name).toBe('B');
    });
  });

  describe('remove', () => {
    it('removes the item with the given id', () => {
      const i = item('X');
      service.add(i);
      service.remove(i.id);
      expect(service.count).toBe(0);
    });

    it('no-ops for an unknown id', () => {
      service.add(item('X'));
      service.remove('does-not-exist');
      expect(service.count).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns the matching item',       () => { const i = item('X'); service.add(i); expect(service.getById(i.id)?.name).toBe('X'); });
    it('returns undefined for unknown id', () => expect(service.getById('nope')).toBeUndefined());
  });

  // ── Selection ─────────────────────────────────────────────────────────────

  describe('select', () => {
    it('sets the selected item', () => {
      const i = item('X');
      service.select(i);
      expect(service['state'].selected?.id).toBe(i.id);
    });

    it('clears selection when passed null', () => {
      service.select(item('X'));
      service.select(null);
      expect(service['state'].selected).toBeNull();
    });
  });

  describe('selectById', () => {
    it('selects the item matching the id', () => {
      const i = item('X');
      service.add(i);
      service.selectById(i.id);
      expect(service['state'].selected?.id).toBe(i.id);
    });

    it('clears selection for unknown id', () => {
      service.select(item('X'));
      service.selectById('unknown');
      expect(service['state'].selected).toBeNull();
    });
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  describe('setPage', () => {
    it('updates the page number', () => {
      service.setPage(3);
      expect(service['state'].pagination.page).toBe(3);
    });
  });

  describe('setPageSize', () => {
    it('updates pageSize and resets to page 1', () => {
      service.setPage(4);
      service.setPageSize(25);
      expect(service['state'].pagination.pageSize).toBe(25);
      expect(service['state'].pagination.page).toBe(1);
    });
  });

  // ── Sorting ───────────────────────────────────────────────────────────────

  describe('setSort', () => {
    it('sets the sort field', () => {
      service.setSort('name');
      expect(service['state'].sort.field).toBe('name');
    });

    it('defaults to asc on first call', () => {
      service.setSort('name');
      expect(service['state'].sort.direction).toBe('asc');
    });

    it('toggles direction when same field is set again', () => {
      service.setSort('name');
      service.setSort('name');
      expect(service['state'].sort.direction).toBe('desc');
    });

    it('respects an explicit direction override', () => {
      service.setSort('name', 'desc');
      expect(service['state'].sort.direction).toBe('desc');
    });
  });

  // ── Filtering ─────────────────────────────────────────────────────────────

  describe('setQuery', () => {
    it('updates the query and resets to page 1', () => {
      service.setPage(3);
      service.setQuery('test');
      expect(service['state'].filter.query).toBe('test');
      expect(service['state'].pagination.page).toBe(1);
    });
  });

  describe('setFilter', () => {
    it('sets a named filter key and resets to page 1', () => {
      service.setPage(2);
      service.setFilter('status', 'active');
      expect(service['state'].filter['status']).toBe('active');
      expect(service['state'].pagination.page).toBe(1);
    });
  });

  describe('clearFilters', () => {
    it('resets query to empty string', () => {
      service.setQuery('something');
      service.clearFilters();
      expect(service['state'].filter.query).toBe('');
    });
  });

  // ── Loading / Error ───────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('sets the loading flag', () => {
      service.setLoading(true);
      expect(service['state'].loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('sets the error message and clears loading', () => {
      service.setLoading(true);
      service.setError('Something broke');
      expect(service['state'].error).toBe('Something broke');
      expect(service['state'].loading).toBe(false);
    });

    it('clears a previous error when passed null', () => {
      service.setError('oops');
      service.setError(null);
      expect(service['state'].error).toBeNull();
    });
  });

  // ── Observables ───────────────────────────────────────────────────────────

  describe('items$', () => {
    it('emits current items immediately', async () => {
      service.addMany([item('A'), item('B')]);
      const items = await firstValueFrom(service.items$);
      expect(items).toHaveLength(2);
    });
  });

  describe('selected$', () => {
    it('emits null initially', async () => {
      expect(await firstValueFrom(service.selected$)).toBeNull();
    });

    it('emits the selected item after select()', async () => {
      const i = item('X');
      service.select(i);
      expect((await firstValueFrom(service.selected$))?.id).toBe(i.id);
    });
  });

  describe('loading$', () => {
    it('emits false initially', async () => {
      expect(await firstValueFrom(service.loading$)).toBe(false);
    });
  });

  describe('error$', () => {
    it('emits null initially', async () => {
      expect(await firstValueFrom(service.error$)).toBeNull();
    });
  });
});

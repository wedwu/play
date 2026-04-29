import { describe, beforeEach, it, expect } from '@jest/globals';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { User, AdminUser, Department } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => { service = new UserService(); });

  // ── Seed data ─────────────────────────────────────────────────────────────

  describe('seed data', () => {
    it('starts with 5 seeded users', () => expect(service.count).toBe(5));

    it('seeds one admin (Alice Zhang)', () => {
      const admin = service['state'].items.find(u => u.role === 'admin');
      expect(admin).toBeDefined();
      expect(admin?.firstName).toBe('Alice');
    });

    it('seeds users across multiple departments', () => {
      const depts = new Set(service['state'].items.map(u => u.department));
      expect(depts.size).toBeGreaterThan(1);
    });
  });

  // ── admins$ ───────────────────────────────────────────────────────────────

  describe('admins$', () => {
    it('emits only users with role admin', async () => {
      const admins = await firstValueFrom(service.admins$);
      expect(admins.every(u => u.role === 'admin')).toBe(true);
    });

    it('includes the seeded admin', async () => {
      const admins = await firstValueFrom(service.admins$);
      expect(admins.some(u => u.firstName === 'Alice')).toBe(true);
    });

    it('updates when a new admin is created', async () => {
      const before = (await firstValueFrom(service.admins$)).length;
      service.createUser('New', 'Admin', 'newadmin@acme.com', 'admin');
      const after = (await firstValueFrom(service.admins$)).length;
      expect(after).toBe(before + 1);
    });
  });

  // ── byDepartment$ ─────────────────────────────────────────────────────────

  describe('byDepartment$', () => {
    const allDepts: Department[] = ['engineering', 'design', 'product', 'marketing', 'ops'];

    it('has a key for every department', async () => {
      const grouped = await firstValueFrom(service.byDepartment$);
      allDepts.forEach(d => {
        expect(Object.prototype.hasOwnProperty.call(grouped, d)).toBe(true);
      });
    });

    it('places users in the correct department bucket', async () => {
      service.createUser('Sam', 'Doe', 'sam@acme.com', 'developer', 'design');
      const grouped = await firstValueFrom(service.byDepartment$);
      expect(grouped['design'].some(u => u.firstName === 'Sam')).toBe(true);
    });

    it('provides an empty array for departments with no members', async () => {
      const grouped = await firstValueFrom(service.byDepartment$);
      expect(Array.isArray(grouped['marketing'])).toBe(true);
    });
  });

  // ── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('adds a user to state', () => {
      const before = service.count;
      service.createUser('Jane', 'Doe', 'jane@acme.com');
      expect(service.count).toBe(before + 1);
    });

    it('returns the created User instance', () => {
      const user = service.createUser('John', 'Smith', 'john@acme.com');
      expect(user).toBeInstanceOf(User);
      expect(user.fullName).toBe('John Smith');
    });

    it('defaults role to developer', () => {
      const user = service.createUser('A', 'B', 'a@b.com');
      expect(user.role).toBe('developer');
    });

    it('defaults department to engineering', () => {
      const user = service.createUser('A', 'B', 'a@b.com');
      expect(user.department).toBe('engineering');
    });

    it('respects explicit role and department', () => {
      const user = service.createUser('A', 'B', 'a@b.com', 'manager', 'design');
      expect(user.role).toBe('manager');
      expect(user.department).toBe('design');
    });

    it('persists so getById finds it', () => {
      const user = service.createUser('Z', 'Y', 'zy@acme.com');
      expect(service.getById(user.id)?.email).toBe('zy@acme.com');
    });
  });

  // ── updateRole ────────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('changes the role of the matching user', () => {
      const user = service.createUser('Dev', 'User', 'dev@acme.com', 'developer');
      service.updateRole(user.id, 'manager');
      expect(service.getById(user.id)?.role).toBe('manager');
    });

    it('no-ops silently for an unknown userId', () => {
      expect(() => service.updateRole('not-a-real-id', 'admin')).not.toThrow();
    });

    it('does not mutate other users', () => {
      const a = service.createUser('A', 'A', 'a@a.com', 'developer');
      const b = service.createUser('B', 'B', 'b@b.com', 'developer');
      service.updateRole(a.id, 'manager');
      expect(service.getById(b.id)?.role).toBe('developer');
    });
  });

  // ── getUsersForProject ────────────────────────────────────────────────────

  describe('getUsersForProject', () => {
    it('returns users whose IDs are in the memberIds list', async () => {
      const u1 = service.createUser('Member', 'One', 'm1@acme.com');
      const u2 = service.createUser('Member', 'Two', 'm2@acme.com');
      service.createUser('Non', 'Member', 'non@acme.com');

      const members = await firstValueFrom(
        service.getUsersForProject([u1.id, u2.id])
      );
      expect(members).toHaveLength(2);
      expect(members.map(u => u.id)).toContain(u1.id);
      expect(members.map(u => u.id)).toContain(u2.id);
    });

    it('returns an empty array when no IDs match', async () => {
      const members = await firstValueFrom(
        service.getUsersForProject(['unknown-1', 'unknown-2'])
      );
      expect(members).toHaveLength(0);
    });

    it('is reactive — updates when a new member is added', async () => {
      const u = service.createUser('Late', 'Member', 'late@acme.com');
      const members = await firstValueFrom(
        service.getUsersForProject([u.id])
      );
      expect(members).toHaveLength(1);
    });
  });

  // ── applyFilterAndSort ────────────────────────────────────────────────────

  describe('applyFilterAndSort', () => {
    it('filters by full-name query', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: 'alice' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(u => u.fullName.toLowerCase().includes('alice'))).toBe(true);
    });

    it('filters by role', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '', role: 'manager' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(u => u.role === 'manager')).toBe(true);
    });

    it('filters by department', () => {
      service.createUser('D', 'U', 'du@acme.com', 'developer', 'design');
      const result = service['applyFilterAndSort'](
        service['state'].items,
        { query: '', department: 'design' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(u => u.department === 'design')).toBe(true);
    });

    it('returns all items when no filter is applied', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '' },
        { field: null, direction: 'asc' }
      );
      expect(result).toHaveLength(items.length);
    });

    it('sorts by fullName ascending by default', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '' },
        { field: null, direction: 'asc' }
      );
      const names = result.map(u => u.fullName);
      expect(names).toEqual([...names].sort());
    });
  });
});

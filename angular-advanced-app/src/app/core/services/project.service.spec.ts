import { describe, beforeEach, it, expect } from '@jest/globals';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from './project.service';
import { Project } from '../models/project.model';
import { Task, TaskPriority } from '../models/task.model';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => { service = new ProjectService(); });

  // ── Seed data ─────────────────────────────────────────────────────────────

  describe('seed data', () => {
    it('starts with 3 seeded projects', () => expect(service.count).toBe(3));

    it('seeds two active projects', async () => {
      const active = await firstValueFrom(service.activeProjects$);
      expect(active).toHaveLength(2);
    });

    it('seeds one planning project', () => {
      const planning = service['state'].items.filter(p => p.phase === 'planning');
      expect(planning).toHaveLength(1);
    });
  });

  // ── activeProjects$ ───────────────────────────────────────────────────────

  describe('activeProjects$', () => {
    it('only includes projects in the active phase', async () => {
      const p = service.createProject('New', 'Desc', 'u1');
      p.phase = 'completed';
      service.update(p.id, p as Partial<Project>);

      const active = await firstValueFrom(service.activeProjects$);
      expect(active.every(p => p.phase === 'active')).toBe(true);
    });

    it('updates when a project phase changes', async () => {
      const p = service.createProject('Draft', 'Desc', 'u1');
      const before = (await firstValueFrom(service.activeProjects$)).length;

      p.phase = 'active';
      service.update(p.id, p as Partial<Project>);

      const after = (await firstValueFrom(service.activeProjects$)).length;
      expect(after).toBe(before + 1);
    });
  });

  // ── healthSummary$ ────────────────────────────────────────────────────────

  describe('healthSummary$', () => {
    it('emits an object with green, yellow, and red counts', async () => {
      const summary = await firstValueFrom(service.healthSummary$);
      expect(typeof summary.green).toBe('number');
      expect(typeof summary.yellow).toBe('number');
      expect(typeof summary.red).toBe('number');
    });

    it('total health count equals number of projects', async () => {
      const summary = await firstValueFrom(service.healthSummary$);
      expect(summary.green + summary.yellow + summary.red).toBe(service.count);
    });
  });

  // ── createProject ─────────────────────────────────────────────────────────

  describe('createProject', () => {
    it('creates a project and adds it to state', () => {
      const before = service.count;
      service.createProject('Alpha', 'First project', 'u1');
      expect(service.count).toBe(before + 1);
    });

    it('returns the created project', () => {
      const p = service.createProject('Beta', 'Second', 'u2');
      expect(p).toBeInstanceOf(Project);
      expect(p.name).toBe('Beta');
      expect(p.ownerId).toBe('u2');
    });

    it('creates with product category', () => {
      const p = service.createProject('Gamma', 'Third', 'u3');
      expect(p.category).toBe('product');
    });

    it('persists the project so getById finds it', () => {
      const p = service.createProject('Delta', 'Fourth', 'u4');
      expect(service.getById(p.id)?.name).toBe('Delta');
    });
  });

  // ── addTaskToProject ──────────────────────────────────────────────────────

  describe('addTaskToProject', () => {
    it('associates a task with the project', () => {
      const p = service.createProject('Work', 'Desc', 'u1');
      const t = new Task('Build API', '', TaskPriority.MEDIUM);

      service.addTaskToProject(p.id, t);

      const updated = service.getById(p.id)!;
      expect(updated.tasks).toHaveLength(1);
      expect(updated.tasks[0].id).toBe(t.id);
    });

    it('sets the task projectId', () => {
      const p = service.createProject('Work', 'Desc', 'u1');
      const t = new Task('Build API', '', TaskPriority.MEDIUM);

      service.addTaskToProject(p.id, t);
      expect(t.projectId).toBe(p.id);
    });

    it('no-ops silently for an unknown projectId', () => {
      const t = new Task('Orphan', '', TaskPriority.LOW);
      expect(() => service.addTaskToProject('unknown-id', t)).not.toThrow();
    });
  });

  // ── applyFilterAndSort ────────────────────────────────────────────────────

  describe('applyFilterAndSort', () => {
    it('filters by name query', () => {
      service.createProject('Nexus Rebuild', 'Desc', 'u1');
      service.createProject('Mobile App', 'Desc', 'u2');

      const result = service['applyFilterAndSort'](
        service['state'].items,
        { query: 'nexus' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(p => p.name.toLowerCase().includes('nexus'))).toBe(true);
    });

    it('filters by phase', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '', phase: 'active' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(p => p.phase === 'active')).toBe(true);
    });

    it('returns all items when no filter is set', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '' },
        { field: null, direction: 'asc' }
      );
      expect(result).toHaveLength(items.length);
    });
  });
});

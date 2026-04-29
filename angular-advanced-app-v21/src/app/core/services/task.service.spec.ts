import { TestBed } from '@angular/core/testing';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { firstValueFrom } from 'rxjs';
import { TaskService } from './task.service';
import { NotificationService } from './notification.service';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';

const makeNotifications = () => ({
  success: jest.fn(),
  error:   jest.fn(),
  warn:    jest.fn(),
  info:    jest.fn(),
}) as unknown as NotificationService;

describe('TaskService', () => {
  let service: TaskService;
  let notifications: ReturnType<typeof makeNotifications>;

  beforeEach(() => {
    jest.useFakeTimers();
    notifications = makeNotifications();
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: NotificationService, useValue: notifications },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  afterEach(() => {
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  // ── Seed data ─────────────────────────────────────────────────────────────

  describe('seed data', () => {
    it('starts with 6 seeded tasks', () => expect(service.count).toBe(6));

    it('seeds at least one IN_PROGRESS task', () => {
      const items = service['state'].items;
      expect(items.some(t => t.taskStatus === TaskStatus.IN_PROGRESS)).toBe(true);
    });

    it('seeds at least one BLOCKED task', () => {
      const items = service['state'].items;
      expect(items.some(t => t.taskStatus === TaskStatus.BLOCKED)).toBe(true);
    });
  });

  // ── urgentTasks$ ──────────────────────────────────────────────────────────

  describe('urgentTasks$', () => {
    it('emits tasks with URGENT priority that are not DONE', async () => {
      const urgent = await firstValueFrom(service.urgentTasks$);
      expect(urgent.every(t =>
        t.priority === TaskPriority.URGENT && t.taskStatus !== TaskStatus.DONE
      )).toBe(true);
    });

    it('excludes a completed urgent task', async () => {
      const task = service.createTask('Urgent done', TaskPriority.URGENT);
      service['state'].items
        .find(t => t.id === task.id)!.taskStatus = TaskStatus.DONE;
      service['setState']({ items: [...service['state'].items] });

      const urgent = await firstValueFrom(service.urgentTasks$);
      expect(urgent.find(t => t.id === task.id)).toBeUndefined();
    });
  });

  // ── overdueTasks$ ─────────────────────────────────────────────────────────

  describe('overdueTasks$', () => {
    it('is empty when no tasks are overdue', async () => {
      const items = service['state'].items.map(t => {
        t.dueDate = new Date(Date.now() + 86_400_000);
        return t;
      });
      service['setState']({ items });

      const overdue = await firstValueFrom(service.overdueTasks$);
      expect(overdue).toHaveLength(0);
    });

    it('includes tasks with a past due date and non-DONE status', async () => {
      const task = service.createTask('Late task', TaskPriority.HIGH);
      const found = service.getById(task.id)!;
      found.dueDate = new Date(Date.now() - 86_400_000);
      service.update(found.id, found as Partial<Task>);

      const overdue = await firstValueFrom(service.overdueTasks$);
      expect(overdue.some(t => t.id === task.id)).toBe(true);
    });
  });

  // ── tasksByStatus$ ────────────────────────────────────────────────────────

  describe('tasksByStatus$', () => {
    it('has a key for every TaskStatus value', async () => {
      const byStatus = await firstValueFrom(service.tasksByStatus$);
      Object.values(TaskStatus).forEach(s => {
        expect(Object.prototype.hasOwnProperty.call(byStatus, s)).toBe(true);
      });
    });

    it('places tasks in the correct bucket', async () => {
      const task = service.createTask('Backlog item', TaskPriority.LOW);
      const found = service.getById(task.id)!;
      found.taskStatus = TaskStatus.BACKLOG;
      service.update(found.id, found as Partial<Task>);

      const byStatus = await firstValueFrom(service.tasksByStatus$);
      expect(byStatus[TaskStatus.BACKLOG].some(t => t.id === task.id)).toBe(true);
    });
  });

  // ── totalStats$ ───────────────────────────────────────────────────────────

  describe('totalStats$', () => {
    it('reports the correct total', async () => {
      const stats = await firstValueFrom(service.totalStats$);
      expect(stats.total).toBe(service.count);
    });

    it('counts done tasks correctly', async () => {
      const task = service.createTask('To finish', TaskPriority.MEDIUM);
      service.transitionTask(task.id, TaskStatus.IN_PROGRESS);
      service.transitionTask(task.id, TaskStatus.REVIEW);
      service.transitionTask(task.id, TaskStatus.DONE);

      const stats = await firstValueFrom(service.totalStats$);
      const doneCount = service['state'].items.filter(t => t.taskStatus === TaskStatus.DONE).length;
      expect(stats.done).toBe(doneCount);
    });
  });

  // ── createTask ────────────────────────────────────────────────────────────

  describe('createTask', () => {
    it('adds the task to state', () => {
      const before = service.count;
      service.createTask('New task');
      expect(service.count).toBe(before + 1);
    });

    it('returns the created task', () => {
      const task = service.createTask('My task', TaskPriority.HIGH);
      expect(task).toBeInstanceOf(Task);
      expect(task.priority).toBe(TaskPriority.HIGH);
    });

    it('calls notifications.success', () => {
      service.createTask('Notify me');
      expect(notifications.success).toHaveBeenCalledWith(
        'Task created',
        expect.stringContaining('Notify me')
      );
    });

    it('sets assigneeId and projectId when provided', () => {
      const task = service.createTask('Assigned', TaskPriority.MEDIUM, 'u1', 'p1');
      expect(task.assigneeId).toBe('u1');
      expect(task.projectId).toBe('p1');
    });
  });

  // ── transitionTask ────────────────────────────────────────────────────────

  describe('transitionTask', () => {
    it('updates the task status on allowed transition', () => {
      const task = service.createTask('Move me');
      service.transitionTask(task.id, TaskStatus.IN_PROGRESS);
      expect(service.getById(task.id)?.taskStatus).toBe(TaskStatus.IN_PROGRESS);
    });

    it('calls success notification when task is completed', () => {
      const task = service.createTask('Finish me');
      service.transitionTask(task.id, TaskStatus.IN_PROGRESS);
      service.transitionTask(task.id, TaskStatus.REVIEW);
      (notifications.success as ReturnType<typeof jest.fn>).mockClear();
      service.transitionTask(task.id, TaskStatus.DONE);
      expect(notifications.success).toHaveBeenCalledWith(
        expect.stringContaining('Task completed'),
        expect.any(String)
      );
    });

    it('calls error notification on disallowed transition', () => {
      const task = service.createTask('Stuck');
      service.transitionTask(task.id, TaskStatus.DONE);
      expect(notifications.error).toHaveBeenCalledWith(
        'Transition failed',
        expect.any(String)
      );
    });

    it('does not mutate status on disallowed transition', () => {
      const task = service.createTask('No change');
      service.transitionTask(task.id, TaskStatus.DONE);
      expect(service.getById(task.id)?.taskStatus).toBe(TaskStatus.TODO);
    });

    it('no-ops silently for unknown taskId', () => {
      expect(() => service.transitionTask('unknown', TaskStatus.DONE)).not.toThrow();
    });
  });

  // ── addComment ────────────────────────────────────────────────────────────

  describe('addComment', () => {
    it('appends a comment and returns it', () => {
      const task = service.createTask('Comment target');
      const comment = service.addComment(task.id, 'u1', 'LGTM');
      expect(comment).not.toBeNull();
      expect(comment!.content).toBe('LGTM');
    });

    it('persists the comment in state', () => {
      const task = service.createTask('Comment target');
      service.addComment(task.id, 'u1', 'Nice work');
      expect(service.getById(task.id)!.comments).toHaveLength(1);
    });

    it('returns null for unknown taskId', () => {
      expect(service.addComment('unknown', 'u1', 'text')).toBeNull();
    });
  });

  // ── logTime ───────────────────────────────────────────────────────────────

  describe('logTime', () => {
    it('increments logged hours in state', () => {
      const task = service.createTask('Time track');
      service.logTime(task.id, 3.5);
      expect(service.getById(task.id)!.loggedHours).toBeCloseTo(3.5);
    });

    it('no-ops silently for unknown taskId', () => {
      expect(() => service.logTime('unknown', 5)).not.toThrow();
    });
  });

  // ── getByProject / getByAssignee ──────────────────────────────────────────

  describe('getByProject', () => {
    it('returns only tasks belonging to the given project', async () => {
      const task = service.createTask('Project task', TaskPriority.MEDIUM, undefined, 'p-abc');
      const results = await firstValueFrom(service.getByProject('p-abc'));
      expect(results.some(t => t.id === task.id)).toBe(true);
      expect(results.every(t => t.projectId === 'p-abc')).toBe(true);
    });
  });

  describe('getByAssignee', () => {
    it('returns only tasks assigned to the given user', async () => {
      const task = service.createTask('Assigned task', TaskPriority.LOW, 'u-xyz');
      const results = await firstValueFrom(service.getByAssignee('u-xyz'));
      expect(results.some(t => t.id === task.id)).toBe(true);
      expect(results.every(t => t.assigneeId === 'u-xyz')).toBe(true);
    });
  });

  // ── applyFilterAndSort ────────────────────────────────────────────────────

  describe('applyFilterAndSort', () => {
    it('filters by title query', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: 'ci/cd' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(t => t.title.toLowerCase().includes('ci/cd'))).toBe(true);
    });

    it('filters by status', () => {
      const items = service['state'].items;
      const result = service['applyFilterAndSort'](
        items,
        { query: '', status: TaskStatus.BLOCKED },
        { field: null, direction: 'asc' }
      );
      expect(result.every(t => t.taskStatus === TaskStatus.BLOCKED)).toBe(true);
    });

    it('filters by assigneeId', () => {
      service.createTask('Assigned', TaskPriority.MEDIUM, 'user-test');
      const result = service['applyFilterAndSort'](
        service['state'].items,
        { query: '', assigneeId: 'user-test' },
        { field: null, direction: 'asc' }
      );
      expect(result.every(t => t.assigneeId === 'user-test')).toBe(true);
    });
  });
});

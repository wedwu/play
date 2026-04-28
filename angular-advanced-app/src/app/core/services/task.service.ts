// ============================================================
// TASK SERVICE — ES6 Arrow Functions Throughout
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest, interval, map, takeUntil, tap, distinctUntilChanged } from 'rxjs';
import { Task, TaskBuilder, TaskPriority, TaskStatus, Comment } from '../models/task.model';
import { EntityStateService, FilterState, SortState } from './entity-state.service';
import { NotificationService } from './notification.service';
import { sortBy } from '../helpers/utils.helper';

/**
 * State service for {@link Task} entities.
 *
 * Extends {@link EntityStateService} with task-specific derived streams,
 * workflow enforcement, and an overdue monitor that fires every 60 seconds.
 * Pre-populated with demo seed data on construction.
 */
@Injectable({ providedIn: 'root' })
export class TaskService extends EntityStateService<Task> implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /** Tasks with {@link TaskPriority.URGENT} priority that are not yet `DONE`. */
  readonly urgentTasks$: Observable<Task[]> = this.items$.pipe(
    map(tasks => tasks.filter(t => t.priority === TaskPriority.URGENT && t.taskStatus !== TaskStatus.DONE))
  );

  /** Tasks whose `dueDate` has passed and are not in `DONE` status. */
  readonly overdueTasks$: Observable<Task[]> = this.items$.pipe(
    map(tasks => tasks.filter(t => t.isOverdue))
  );

  /**
   * All tasks bucketed by their current {@link TaskStatus}.
   * Every status key is always present, even when the bucket is empty.
   */
  readonly tasksByStatus$: Observable<Record<TaskStatus, Task[]>> = this.items$.pipe(
    map(tasks => Object.values(TaskStatus).reduce((acc, s) => ({
      ...acc, [s]: tasks.filter(t => t.taskStatus === s)
    }), {} as Record<TaskStatus, Task[]>))
  );

  /**
   * Aggregate counts and progress metrics across all tasks.
   * Emits only when at least one value changes (deep-compared via JSON).
   */
  readonly totalStats$ = this.items$.pipe(
    map(tasks => ({
      total:       tasks.length,
      done:        tasks.filter(t => t.taskStatus === TaskStatus.DONE).length,
      inProgress:  tasks.filter(t => t.taskStatus === TaskStatus.IN_PROGRESS).length,
      blocked:     tasks.filter(t => t.taskStatus === TaskStatus.BLOCKED).length,
      overdue:     tasks.filter(t => t.isOverdue).length,
      avgProgress: tasks.length
        ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
        : 0,
    })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  constructor(private notifications: NotificationService) {
    super();
    this.seedData();
    this.startOverdueMonitor();
  }

  // ── Business logic → arrow properties ────────

  /**
   * Builds a validated task via {@link TaskBuilder}, adds it to state, and
   * shows a success notification.
   * @param title - Task title (3–200 characters).
   * @param priority - Task priority. Defaults to `MEDIUM`.
   * @param assigneeId - Optional assignee user ID.
   * @param projectId - Optional parent project ID.
   */
  createTask = (
    title: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    assigneeId?: string,
    projectId?: string
  ): Task => {
    const task = new TaskBuilder(title, 'current-user')
      .withPriority(priority)
      .withAssignee(assigneeId ?? '')
      .withProject(projectId ?? '')
      .build();
    this.add(task);
    this.notifications.success('Task created', `"${title}" added to board`);
    return task;
  };

  /**
   * Attempts a workflow status transition on a task, enforcing
   * {@link STATUS_TRANSITIONS} rules. Shows a success notification when the
   * task reaches `DONE`, or an error notification when the transition is
   * not permitted.
   * @param taskId - ID of the task to transition.
   * @param newStatus - Desired target status.
   */
  transitionTask = (taskId: string, newStatus: TaskStatus): void => {
    const task = this.getById(taskId);
    if (!task) return;
    const result = task.transition(newStatus);
    if (result.success) {
      this.update(taskId, { taskStatus: newStatus } as Partial<Task>);
      if (newStatus === TaskStatus.DONE) this.notifications.success('🎉 Task completed!', task.title);
    } else {
      this.notifications.error('Transition failed', result.error ?? '');
    }
  };

  /**
   * Appends a comment to a task and persists the change in state.
   * Returns `null` when `taskId` does not match any stored task.
   * @param taskId - ID of the target task.
   * @param authorId - ID of the commenting user.
   * @param content - Comment body text.
   */
  addComment = (taskId: string, authorId: string, content: string): Comment | null => {
    const task = this.getById(taskId);
    if (!task) return null;
    const comment = task.addComment(authorId, content);
    this.update(taskId, task as Partial<Task>);
    return comment;
  };

  /**
   * Increments a task's logged hours counter and persists the change.
   * No-ops silently when `taskId` does not match any stored task.
   * @param taskId - ID of the target task.
   * @param hours - Hours to add to `loggedHours`.
   */
  logTime = (taskId: string, hours: number): void => {
    const task = this.getById(taskId);
    if (!task) return;
    task.logTime(hours);
    this.update(taskId, task as Partial<Task>);
  };

  /**
   * Returns a live stream of tasks belonging to the given project.
   * @param projectId - The project ID to filter by.
   */
  getByProject = (projectId: string): Observable<Task[]> =>
    this.items$.pipe(map(tasks => tasks.filter(t => t.projectId === projectId)));

  /**
   * Returns a live stream of tasks assigned to the given user.
   * @param userId - The user ID to filter by.
   */
  getByAssignee = (userId: string): Observable<Task[]> =>
    this.items$.pipe(map(tasks => tasks.filter(t => t.assigneeId === userId)));

  // ── Abstract implementation ───────────────────
  protected override applyFilterAndSort = (
    items: Task[], filter: FilterState, sort: SortState<Task>
  ): Task[] => {
    let result = [...items];

    if (filter['query']) {
      const q = (filter['query'] as string).toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.label.toLowerCase().includes(q))
      );
    }
    if (filter['status'])   result = result.filter(t => t.taskStatus === filter['status']);
    if (filter['priority'] !== undefined && filter['priority'] !== null)
      result = result.filter(t => t.priority === filter['priority']);
    if (filter['assigneeId']) result = result.filter(t => t.assigneeId === filter['assigneeId']);

    return sort.field
      ? sortBy(result, item => {
          const val = item[sort.field as keyof Task];
          return (val instanceof Date ? val.getTime() : (val as string | number)) ?? '';
        }, sort.direction)
      : sortBy(result, t => t.priority, 'desc');
  };

  /** Polls every 60 seconds and warns when any tasks are overdue. */
  private startOverdueMonitor = (): void => {
    interval(60_000).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        const overdue = this.state.items.filter(t => t.isOverdue);
        if (overdue.length > 0)
          this.notifications.warn('Overdue tasks', `${overdue.length} task(s) past due date`);
      })
    ).subscribe();
  };

  private seedData = (): void => {
    const tasks: Task[] = [
      new TaskBuilder('Set up CI/CD pipeline', 'u1')
        .withPriority(TaskPriority.HIGH)
        .withDescription('Configure GitHub Actions for automated testing and deployment')
        .withTag('devops', '#4ECDC4').withTag('infrastructure', '#45B7D1')
        .withEstimate(8).withDueDate(new Date(Date.now() + 86400000 * 3)).build(),

      new TaskBuilder('Design system audit', 'u2')
        .withPriority(TaskPriority.MEDIUM)
        .withDescription('Review all UI components for consistency')
        .withTag('design', '#DDA0DD').withEstimate(4).build(),

      new TaskBuilder('Fix authentication bug', 'u1')
        .withPriority(TaskPriority.URGENT)
        .withDescription('Users cannot reset passwords via email link')
        .withTag('bug', '#FF6B6B').withTag('auth', '#FFEAA7').withEstimate(3).build(),

      new TaskBuilder('Write unit tests', 'u3')
        .withPriority(TaskPriority.LOW)
        .withDescription('Achieve 80% test coverage on core modules')
        .withTag('testing', '#96CEB4').withEstimate(12).build(),

      new TaskBuilder('Implement dark mode', 'u2')
        .withPriority(TaskPriority.MEDIUM)
        .withDescription('Add theme toggle and persist user preference')
        .withTag('feature', '#4ECDC4').withTag('ui', '#DDA0DD').withEstimate(6).build(),

      new TaskBuilder('Database query optimization', 'u1')
        .withPriority(TaskPriority.HIGH)
        .withDescription('Slow queries in reports module causing timeouts')
        .withTag('performance', '#FF6B6B').withEstimate(5).build(),
    ];

    tasks[0].taskStatus = TaskStatus.IN_PROGRESS; tasks[0].loggedHours = 3;
    tasks[1].taskStatus = TaskStatus.REVIEW;
    tasks[3].taskStatus = TaskStatus.BACKLOG;
    tasks[5].taskStatus = TaskStatus.BLOCKED;

    tasks[0].addSubtask('Configure runner');
    tasks[0].addSubtask('Write deployment script');
    tasks[0].addSubtask('Set up staging environment');
    tasks[0].toggleSubtask(tasks[0].subtasks[0].id);

    tasks[2].addSubtask('Reproduce issue');
    tasks[2].addSubtask('Write fix');
    tasks[2].addSubtask('Test fix');

    this.addMany(tasks);
  };

  ngOnDestroy = (): void => {
    this.destroy$.next();
    this.destroy$.complete();
  };
}

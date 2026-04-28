// ============================================================
// TASK MODEL — ES6 Arrow Functions Throughout
// ============================================================

import { BaseEntity, Entity } from './base-entity.model';

/** Numeric priority levels — higher value means higher urgency. */
export enum TaskPriority {
  LOW    = 1,
  MEDIUM = 2,
  HIGH   = 3,
  URGENT = 4,
}

/** Possible states a task can occupy within the kanban workflow. */
export enum TaskStatus {
  BACKLOG     = 'backlog',
  TODO        = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW      = 'review',
  DONE        = 'done',
  BLOCKED     = 'blocked',
}

/** A coloured label attached to a task for categorisation. */
export interface Tag        { label: string; color: string; }
/** A file attached to a task. */
export interface Attachment { id: string; name: string; url: string; size: number; uploadedAt: Date; }
/** A threaded comment left by a team member on a task. */
export interface Comment    { id: string; authorId: string; content: string; createdAt: Date; edited: boolean; }
/** A checklist item nested inside a parent task. */
export interface SubTask    { id: string; title: string; done: boolean; }

/**
 * Generic result wrapper for operations that may fail with a message.
 * @template T The payload type on success.
 */
export interface Result<T>  { success: boolean; data?: T; error?: string; }

/**
 * Defines which statuses a task may legally move to from each current status.
 * Used by {@link Task.transition} to enforce workflow rules.
 */
const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]:     [TaskStatus.TODO],
  [TaskStatus.TODO]:        [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.BLOCKED, TaskStatus.TODO],
  [TaskStatus.REVIEW]:      [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]:        [TaskStatus.TODO],
  [TaskStatus.BLOCKED]:     [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

/**
 * Domain entity representing a unit of work assignable to a team member.
 *
 * Tracks priority, status workflow, subtasks, comments, time logging,
 * file attachments, and tags.
 */
@Entity('tasks')
export class Task extends BaseEntity {
  /** Short summary of the work to be done (3–200 characters). */
  title: string;
  /** Detailed description; may contain markdown. */
  description: string;
  priority: TaskPriority;
  /** Workflow status. Use {@link transition} to change safely. */
  taskStatus: TaskStatus;
  /** ID of the team member responsible for this task. */
  assigneeId?: string;
  /** ID of the parent project, if any. */
  projectId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  /** Accumulated hours logged via {@link logTime}. */
  loggedHours = 0;
  tags: Tag[] = [];
  attachments: Attachment[] = [];
  comments: Comment[] = [];
  subtasks: SubTask[] = [];
  dependencies: string[] = [];
  private _progressOverride?: number;

  constructor(
    title: string,
    description = '',
    priority: TaskPriority = TaskPriority.MEDIUM,
    createdBy = 'system'
  ) {
    super(createdBy);
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.taskStatus = TaskStatus.TODO;
  }

  // ── ES6 Getters ───────────────────────────────

  /**
   * Completion percentage (0–100).
   * Derived from subtask completion unless overridden via the setter.
   */
  get progress(): number {
    if (this._progressOverride !== undefined) return this._progressOverride;
    if (!this.subtasks.length) return this.taskStatus === TaskStatus.DONE ? 100 : 0;
    const done = this.subtasks.filter(s => s.done).length;
    return Math.round((done / this.subtasks.length) * 100);
  }

  set progress(value: number) {
    this._progressOverride = Math.min(100, Math.max(0, value));
  }

  /** `true` when `dueDate` is in the past and the task is not yet done. */
  get isOverdue(): boolean {
    return !!this.dueDate && new Date() > this.dueDate && this.taskStatus !== TaskStatus.DONE;
  }

  /**
   * Days remaining until `dueDate`. Negative values indicate overdue tasks.
   * Returns `null` when no due date is set.
   */
  get daysUntilDue(): number | null {
    if (!this.dueDate) return null;
    return Math.ceil((this.dueDate.getTime() - Date.now()) / 86_400_000);
  }

  get completedSubtasks(): number { return this.subtasks.filter(s => s.done).length; }
  get priorityLabel(): string     { return TaskPriority[this.priority]; }

  // ── Abstract implementations → arrow properties ──
  validate = (): boolean =>
    this.title.trim().length >= 3 && this.title.length <= 200;

  getDisplayName = (): string => `[${this.priorityLabel}] ${this.title}`;

  serialize = (): Record<string, unknown> => ({
    ...this.baseSerialize(),
    title: this.title,
    description: this.description,
    priority: this.priority,
    taskStatus: this.taskStatus,
    assigneeId: this.assigneeId,
    projectId: this.projectId,
    dueDate: this.dueDate?.toISOString(),
    estimatedHours: this.estimatedHours,
    loggedHours: this.loggedHours,
    tags: this.tags,
    subtasksCount: this.subtasks.length,
    progress: this.progress,
  });

  clone = (): Task => {
    const copy = new Task(this.title, this.description, this.priority, this.createdBy);
    copy.assigneeId = this.assigneeId;
    copy.projectId = this.projectId;
    copy.dueDate = this.dueDate ? new Date(this.dueDate) : undefined;
    copy.estimatedHours = this.estimatedHours;
    copy.tags = [...this.tags];
    return copy;
  };

  // ── Domain methods → arrow properties ────────

  /**
   * Assigns the task to a user.
   * @param userId - The target user's ID.
   * @returns A {@link Result} indicating success or a validation error.
   */
  assign = (userId: string): Result<Task> => {
    if (!userId) return { success: false, error: 'Invalid user ID' };
    this.assigneeId = userId;
    this.touch();
    return { success: true, data: this };
  };

  /**
   * Attempts to move the task to `newStatus`, enforcing {@link STATUS_TRANSITIONS} rules.
   * @param newStatus - The desired target status.
   * @returns A {@link Result} with the updated task on success, or an error message on failure.
   */
  transition = (newStatus: TaskStatus): Result<Task> => {
    const allowed = this.getAllowedTransitions();
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${this.taskStatus} to ${newStatus}` };
    }
    this.taskStatus = newStatus;
    this.touch();
    return { success: true, data: this };
  };

  /** Returns the list of statuses this task can legally move to from its current status. */
  getAllowedTransitions = (): TaskStatus[] =>
    STATUS_TRANSITIONS[this.taskStatus] ?? [];

  /**
   * Appends a new checklist item to `subtasks`.
   * @param title - Label for the subtask.
   */
  addSubtask = (title: string): SubTask => {
    const sub: SubTask = { id: BaseEntity.generateId(), title, done: false };
    this.subtasks = [...this.subtasks, sub];
    this.touch();
    return sub;
  };

  /**
   * Flips the `done` flag on a subtask by ID.
   * @param id - The subtask's unique ID.
   */
  toggleSubtask = (id: string): void => {
    this.subtasks = this.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    this.touch();
  };

  /**
   * Appends a comment to this task.
   * @param authorId - ID of the commenting user.
   * @param content - Comment body text.
   */
  addComment = (authorId: string, content: string): Comment => {
    const comment: Comment = {
      id: BaseEntity.generateId(), authorId, content,
      createdAt: new Date(), edited: false,
    };
    this.comments = [...this.comments, comment];
    this.touch();
    return comment;
  };

  /**
   * Attaches a tag if one with the same label doesn't already exist.
   * @param label - Display text for the tag.
   * @param color - CSS-compatible colour string.
   */
  addTag = (label: string, color: string): void => {
    if (!this.tags.find(t => t.label === label)) {
      this.tags = [...this.tags, { label, color }];
      this.touch();
    }
  };

  /**
   * Increments the logged hours counter.
   * @param hours - Number of hours to add.
   */
  logTime = (hours: number): void => {
    this.loggedHours += hours;
    this.touch();
  };
}

// ─────────────────────────────────────────────
// TASK BUILDER — Method chaining (ES6)
// ─────────────────────────────────────────────

/**
 * Fluent builder for constructing validated {@link Task} instances.
 * All setter methods return `this` for chaining.
 *
 * @example
 * const task = new TaskBuilder('Fix login bug')
 *   .withPriority(TaskPriority.HIGH)
 *   .withAssignee('user-123')
 *   .withDueDate(new Date('2025-01-31'))
 *   .build();
 */
export class TaskBuilder {
  private task: Task;

  constructor(title: string, createdBy = 'system') {
    this.task = new Task(title, '', TaskPriority.MEDIUM, createdBy);
  }

  withDescription = (desc: string): this => { this.task.description = desc; return this; };
  withPriority    = (p: TaskPriority): this => { this.task.priority = p; return this; };
  withAssignee    = (id: string): this => { this.task.assigneeId = id; return this; };
  withProject     = (id: string): this => { this.task.projectId = id; return this; };
  withDueDate     = (date: Date): this => { this.task.dueDate = date; return this; };
  withEstimate    = (hours: number): this => { this.task.estimatedHours = hours; return this; };

  withTag = (label: string, color: string): this => {
    this.task.addTag(label, color);
    return this;
  };

  /**
   * Validates and returns the constructed task.
   * @throws {Error} when {@link Task.validate} returns `false`.
   */
  build = (): Task => {
    if (!this.task.validate()) throw new Error(`Invalid task: ${this.task.title}`);
    return this.task;
  };
}

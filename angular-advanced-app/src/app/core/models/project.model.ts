// ============================================================
// PROJECT MODEL — ES6 Arrow Functions Throughout
// ============================================================

import { BaseEntity, Entity } from './base-entity.model';
import { Task, TaskStatus } from './task.model';

/** Stages of a project's lifecycle from inception to completion. */
export type ProjectPhase    = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
/** Broad classification of the kind of work the project represents. */
export type ProjectCategory = 'product' | 'infrastructure' | 'research' | 'maintenance' | 'other';

/** A named checkpoint with a due date and associated task IDs. */
export interface Milestone {
  id: string; name: string; dueDate: Date; completed: boolean; taskIds: string[];
}
/** A time-boxed iteration containing a subset of project tasks. */
export interface Sprint {
  id: string; name: string; startDate: Date; endDate: Date; taskIds: string[]; velocity: number;
}
/** Aggregated task counts and time metrics for a project at a point in time. */
export interface ProjectStats {
  totalTasks: number; completedTasks: number; inProgressTasks: number;
  blockedTasks: number; overdueTasks: number; completionRate: number;
  totalEstimatedHours: number; totalLoggedHours: number;
}

const PROJECT_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8'];
const PROJECT_EMOJIS = ['🚀','💡','⚡','🔥','🎯','🌊','🌟','🛠️','🎨','📦'];

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Ordered phases used by {@link Project.advance} to move the project forward. */
const PHASE_PROGRESSION: ProjectPhase[] = ['planning', 'active', 'on_hold', 'completed'];

/**
 * Domain entity representing a collection of tasks united by a shared goal.
 *
 * Manages team membership, milestones, sprint planning, and phase progression.
 * Each project gets a randomly assigned colour and emoji icon at construction.
 */
@Entity('projects')
export class Project extends BaseEntity {
  name: string;
  description: string;
  phase: ProjectPhase = 'planning';
  category: ProjectCategory;
  /** ID of the user who owns and is accountable for this project. */
  ownerId: string;
  memberIds: string[] = [];
  milestones: Milestone[] = [];
  sprints: Sprint[] = [];
  startDate: Date;
  targetEndDate?: Date;
  budget?: number;
  /** CSS hex colour assigned at creation for visual identification. */
  color: string;
  /** Emoji icon assigned at creation for visual identification. */
  iconEmoji: string;
  private _tasks: Task[] = [];

  constructor(
    name: string,
    description: string,
    ownerId: string,
    category: ProjectCategory = 'product',
    createdBy = 'system'
  ) {
    super(createdBy);
    this.name = name;
    this.description = description;
    this.ownerId = ownerId;
    this.category = category;
    this.startDate = new Date();
    this.color = randomItem(PROJECT_COLORS);
    this.iconEmoji = randomItem(PROJECT_EMOJIS);
  }

  // ── ES6 Getters ───────────────────────────────

  /** Immutable snapshot of all tasks. Mutate via {@link addTask} / {@link removeTask}. */
  get tasks(): Task[] { return [...this._tasks]; }

  /** Live roll-up of task counts, hours, and completion rate. Recomputed on every access. */
  get stats(): ProjectStats {
    const tasks = this._tasks;
    const completed  = tasks.filter(t => t.taskStatus === TaskStatus.DONE);
    const inProgress = tasks.filter(t => t.taskStatus === TaskStatus.IN_PROGRESS);
    const blocked    = tasks.filter(t => t.taskStatus === TaskStatus.BLOCKED);
    const overdue    = tasks.filter(t => t.isOverdue);
    return {
      totalTasks:          tasks.length,
      completedTasks:      completed.length,
      inProgressTasks:     inProgress.length,
      blockedTasks:        blocked.length,
      overdueTasks:        overdue.length,
      completionRate:      tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
      totalEstimatedHours: tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0),
      totalLoggedHours:    tasks.reduce((s, t) => s + t.loggedHours, 0),
    };
  }

  /** The sprint whose date range encompasses today, or `undefined` if none is active. */
  get activeSprint(): Sprint | undefined {
    const now = new Date();
    return this.sprints.find(s => s.startDate <= now && s.endDate >= now);
  }

  /** The nearest incomplete milestone with a future due date, or `undefined`. */
  get nextMilestone(): Milestone | undefined {
    return this.milestones
      .filter(m => !m.completed && m.dueDate > new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  }

  /**
   * Traffic-light indicator of overall project health.
   * - `'red'`    — overdue tasks exist, or >20% of tasks are blocked
   * - `'green'`  — completion rate ≥ 80%
   * - `'yellow'` — everything else
   */
  get health(): 'green' | 'yellow' | 'red' {
    const { overdueTasks, blockedTasks, totalTasks, completionRate } = this.stats;
    if (overdueTasks > 0 || blockedTasks > totalTasks * 0.2) return 'red';
    if (completionRate >= 80) return 'green';
    return 'yellow';
  }

  // ── Abstract implementations → arrow properties ──
  validate = (): boolean => this.name.trim().length >= 2 && !!this.ownerId;

  getDisplayName = (): string => `${this.iconEmoji} ${this.name}`;

  serialize = (): Record<string, unknown> => ({
    ...this.baseSerialize(),
    name: this.name,
    description: this.description,
    phase: this.phase,
    category: this.category,
    ownerId: this.ownerId,
    memberIds: this.memberIds,
    startDate: this.startDate.toISOString(),
    targetEndDate: this.targetEndDate?.toISOString(),
    color: this.color,
    iconEmoji: this.iconEmoji,
    stats: this.stats,
  });

  clone = (): Project => {
    const copy = new Project(this.name, this.description, this.ownerId, this.category, this.createdBy);
    copy.phase = this.phase;
    copy.memberIds = [...this.memberIds];
    copy.color = this.color;
    return copy;
  };

  // ── Domain methods → arrow properties ────────

  /**
   * Adds a task and sets its `projectId` to this project's ID.
   * @param task - The task to associate with this project.
   */
  addTask = (task: Task): void => {
    task.projectId = this.id;
    this._tasks = [...this._tasks, task];
    this.touch();
  };

  /**
   * Detaches a task from this project by ID.
   * @param taskId - ID of the task to remove.
   */
  removeTask = (taskId: string): void => {
    this._tasks = this._tasks.filter(t => t.id !== taskId);
    this.touch();
  };

  /**
   * Adds a user to the member list if not already present.
   * @param userId - ID of the user to add.
   */
  addMember = (userId: string): void => {
    if (!this.memberIds.includes(userId)) {
      this.memberIds = [...this.memberIds, userId];
      this.touch();
    }
  };

  /**
   * Removes a user from the member list.
   * @param userId - ID of the user to remove.
   */
  removeMember = (userId: string): void => {
    this.memberIds = this.memberIds.filter(id => id !== userId);
    this.touch();
  };

  /**
   * Creates and appends a milestone to this project.
   * @param name - Display name for the milestone.
   * @param dueDate - Target completion date.
   */
  addMilestone = (name: string, dueDate: Date): Milestone => {
    const m: Milestone = { id: BaseEntity.generateId(), name, dueDate, completed: false, taskIds: [] };
    this.milestones = [...this.milestones, m];
    this.touch();
    return m;
  };

  /**
   * Marks a milestone as completed.
   * @param id - ID of the milestone to complete.
   */
  completeMilestone = (id: string): void => {
    this.milestones = this.milestones.map(m => m.id === id ? { ...m, completed: true } : m);
    this.touch();
  };

  /**
   * Creates and appends a sprint to this project.
   * @param name - Sprint name / label.
   * @param startDate - Sprint start date.
   * @param endDate - Sprint end date.
   * @param taskIds - IDs of tasks included in this sprint.
   */
  startSprint = (name: string, startDate: Date, endDate: Date, taskIds: string[] = []): Sprint => {
    const sprint: Sprint = { id: BaseEntity.generateId(), name, startDate, endDate, taskIds, velocity: 0 };
    this.sprints = [...this.sprints, sprint];
    this.touch();
    return sprint;
  };

  /**
   * Advances the project to the next phase in the progression:
   * `planning → active → on_hold → completed`.
   * Has no effect when already at `'completed'`.
   */
  advance = (): void => {
    const idx = PHASE_PROGRESSION.indexOf(this.phase);
    if (idx < PHASE_PROGRESSION.length - 1) {
      this.phase = PHASE_PROGRESSION[idx + 1];
      this.touch();
    }
  };
}

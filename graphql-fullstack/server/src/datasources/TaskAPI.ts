import { v4 as uuid } from 'uuid';
import { db } from './db';
import { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class TaskAPI {
  async findById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async findByIds(ids: string[]): Promise<(Task | undefined)[]> {
    return ids.map((id) => db.tasks.get(id));
  }

  async findByProject(projectId: string, filter?: TaskFilterInput): Promise<Task[]> {
    let tasks = [...db.tasks.values()].filter((t) => t.projectId === projectId);
    if (filter) tasks = this.applyFilter(tasks, filter);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return [...db.tasks.values()].filter((t) => t.assigneeId === assigneeId);
  }

  async findAll(filter?: TaskFilterInput): Promise<Task[]> {
    let tasks = [...db.tasks.values()];
    if (filter) tasks = this.applyFilter(tasks, filter);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private applyFilter(tasks: Task[], filter: TaskFilterInput): Task[] {
    return tasks.filter((t) => {
      if (filter.status && t.status !== filter.status) return false;
      if (filter.priority && t.priority !== filter.priority) return false;
      if (filter.assigneeId && t.assigneeId !== filter.assigneeId) return false;
      if (filter.tagIds?.length) {
        if (!filter.tagIds.some((id) => t.tagIds.includes(id))) return false;
      }
      return true;
    });
  }

  async create(input: CreateTaskInput, reporterId: string): Promise<Task> {
    const project = db.projects.get(input.projectId);
    if (!project) throw new NotFoundError('Project', input.projectId);
    if (!project.memberIds.includes(reporterId)) throw new ForbiddenError('You are not a member of this project');

    const now = new Date();
    const task: Task = {
      id: uuid(),
      title: input.title.trim(),
      description: input.description?.trim(),
      status: TaskStatus.BACKLOG,
      priority: input.priority ?? TaskPriority.MEDIUM,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      reporterId,
      tagIds: input.tagIds ?? [],
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      estimatedHours: input.estimatedHours,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, input: UpdateTaskInput, requesterId: string): Promise<Task> {
    const task = db.tasks.get(id);
    if (!task) throw new NotFoundError('Task', id);

    const project = db.projects.get(task.projectId);
    if (!project?.memberIds.includes(requesterId)) throw new ForbiddenError();

    const updated: Task = {
      ...task,
      ...input,
      dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : undefined) : task.dueDate,
      updatedAt: new Date(),
    };
    db.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string, requesterId: string): Promise<boolean> {
    const task = db.tasks.get(id);
    if (!task) throw new NotFoundError('Task', id);
    if (task.reporterId !== requesterId) throw new ForbiddenError();

    db.tasks.delete(id);
    // Cascade delete comments
    for (const [commentId, comment] of db.comments) {
      if (comment.taskId === id) db.comments.delete(commentId);
    }
    return true;
  }
}

export class CommentAPI {
  async findByTask(taskId: string): Promise<import('../types').Comment[]> {
    return [...db.comments.values()]
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async create(taskId: string, content: string, authorId: string): Promise<import('../types').Comment> {
    const task = db.tasks.get(taskId);
    if (!task) throw new NotFoundError('Task', taskId);

    const now = new Date();
    const comment = { id: uuid(), content: content.trim(), taskId, authorId, createdAt: now, updatedAt: now };
    db.comments.set(comment.id, comment);
    return comment;
  }

  async delete(id: string, requesterId: string): Promise<boolean> {
    const comment = db.comments.get(id);
    if (!comment) throw new NotFoundError('Comment', id);
    if (comment.authorId !== requesterId) throw new ForbiddenError();
    db.comments.delete(id);
    return true;
  }
}

export class TagAPI {
  async findAll(): Promise<import('../types').Tag[]> {
    return [...db.tags.values()];
  }

  async findByIds(ids: string[]): Promise<import('../types').Tag[]> {
    return ids.map((id) => db.tags.get(id)).filter(Boolean) as import('../types').Tag[];
  }
}

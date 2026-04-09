import { v4 as uuid } from 'uuid';
import { db } from './db';
import { Project, ProjectStatus, CreateProjectInput, UpdateProjectInput } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ProjectAPI {
  async findById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  async findAll(): Promise<Project[]> {
    return [...db.projects.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async findByMember(userId: string): Promise<Project[]> {
    return [...db.projects.values()].filter((p) => p.memberIds.includes(userId));
  }

  async create(input: CreateProjectInput, ownerId: string): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: uuid(),
      name: input.name.trim(),
      description: input.description?.trim(),
      status: ProjectStatus.ACTIVE,
      ownerId,
      memberIds: [ownerId],
      createdAt: now,
      updatedAt: now,
    };
    db.projects.set(project.id, project);
    return project;
  }

  async update(id: string, input: UpdateProjectInput, requesterId: string): Promise<Project> {
    const project = db.projects.get(id);
    if (!project) throw new NotFoundError('Project', id);
    if (project.ownerId !== requesterId) throw new ForbiddenError();

    const updated: Project = { ...project, ...input, updatedAt: new Date() };
    db.projects.set(id, updated);
    return updated;
  }

  async delete(id: string, requesterId: string): Promise<boolean> {
    const project = db.projects.get(id);
    if (!project) throw new NotFoundError('Project', id);
    if (project.ownerId !== requesterId) throw new ForbiddenError();

    db.projects.delete(id);
    // Cascade delete tasks
    for (const [taskId, task] of db.tasks) {
      if (task.projectId === id) db.tasks.delete(taskId);
    }
    return true;
  }

  async addMember(projectId: string, userId: string, requesterId: string): Promise<Project> {
    const project = db.projects.get(projectId);
    if (!project) throw new NotFoundError('Project', projectId);
    if (project.ownerId !== requesterId) throw new ForbiddenError();
    if (!db.users.has(userId)) throw new NotFoundError('User', userId);

    if (!project.memberIds.includes(userId)) {
      const updated = { ...project, memberIds: [...project.memberIds, userId], updatedAt: new Date() };
      db.projects.set(projectId, updated);
      return updated;
    }
    return project;
  }

  async removeMember(projectId: string, userId: string, requesterId: string): Promise<Project> {
    const project = db.projects.get(projectId);
    if (!project) throw new NotFoundError('Project', projectId);
    if (project.ownerId !== requesterId) throw new ForbiddenError();

    const updated = {
      ...project,
      memberIds: project.memberIds.filter((id) => id !== userId),
      updatedAt: new Date(),
    };
    db.projects.set(projectId, updated);
    return updated;
  }
}

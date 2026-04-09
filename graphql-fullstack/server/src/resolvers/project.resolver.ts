import { Context } from '../context';
import { requireAuth } from '../utils/auth';
import { paginate } from '../utils/pagination';
import { Project, TaskFilterInput } from '../types';

export const projectResolvers = {
  Query: {
    projects: async (
      _: unknown,
      args: { first?: number; after?: string },
      ctx: Context
    ) => {
      requireAuth(ctx.userId);
      const projects = await ctx.dataSources.projects.findByMember(ctx.userId!);
      return paginate(projects, args);
    },

    project: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.findById(id);
    },
  },

  Mutation: {
    createProject: async (_: unknown, { input }: { input: { name: string; description?: string } }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.create(input, ctx.userId!);
    },

    updateProject: async (_: unknown, { id, input }: { id: string; input: Record<string, unknown> }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.update(id, input, ctx.userId!);
    },

    deleteProject: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.delete(id, ctx.userId!);
    },

    addProjectMember: async (_: unknown, { projectId, userId }: { projectId: string; userId: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.addMember(projectId, userId, ctx.userId!);
    },

    removeProjectMember: async (_: unknown, { projectId, userId }: { projectId: string; userId: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.projects.removeMember(projectId, userId, ctx.userId!);
    },
  },

  Project: {
    owner: async (project: Project, _: unknown, ctx: Context) => {
      return ctx.loaders.userLoader.load(project.ownerId);
    },

    members: async (project: Project, _: unknown, ctx: Context) => {
      return Promise.all(project.memberIds.map((id) => ctx.loaders.userLoader.load(id)));
    },

    tasks: async (
      project: Project,
      args: { filter?: TaskFilterInput; first?: number; after?: string },
      ctx: Context
    ) => {
      const tasks = await ctx.loaders.tasksByProjectLoader.load(project.id);
      return paginate(tasks, args);
    },

    taskCount: async (project: Project, _: unknown, ctx: Context) => {
      const tasks = await ctx.loaders.tasksByProjectLoader.load(project.id);
      return tasks.length;
    },
  },
};

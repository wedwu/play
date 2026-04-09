import { Context } from '../context';
import { requireAuth, requireRole, signToken } from '../utils/auth';
import { Role } from '../types';

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) return null;
      return ctx.loaders.userLoader.load(ctx.userId);
    },

    users: async (_: unknown, __: unknown, ctx: Context) => {
      requireAuth(ctx.userId);
      requireRole(ctx.userRole, Role.ADMIN);
      return ctx.dataSources.users.findAll();
    },

    user: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.loaders.userLoader.load(id);
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: { email: string; password: string; name: string } }, ctx: Context) => {
      const user = await ctx.dataSources.users.register(input);
      const token = signToken({ userId: user.id, role: user.role });
      return { token, user };
    },

    login: async (_: unknown, { input }: { input: { email: string; password: string } }, ctx: Context) => {
      const user = await ctx.dataSources.users.authenticate(input.email, input.password);
      const token = signToken({ userId: user.id, role: user.role });
      return { token, user };
    },

    updateUserRole: async (_: unknown, { userId, role }: { userId: string; role: Role }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.users.updateRole(userId, role, ctx.userId!);
    },
  },

  User: {
    projects: async (user: { id: string }, _: unknown, ctx: Context) => {
      return ctx.dataSources.projects.findByMember(user.id);
    },

    assignedTasks: async (user: { id: string }, _: unknown, ctx: Context) => {
      return ctx.dataSources.tasks.findByAssignee(user.id);
    },
  },
};

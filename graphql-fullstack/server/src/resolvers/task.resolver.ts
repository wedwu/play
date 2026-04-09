import { Context, pubsub } from '../context';
import { requireAuth } from '../utils/auth';
import { paginate } from '../utils/pagination';
import { Task, Comment, TaskFilterInput, CreateTaskInput, UpdateTaskInput } from '../types';

const TASK_UPDATED = 'TASK_UPDATED';
const TASK_CREATED = 'TASK_CREATED';
const COMMENT_ADDED = 'COMMENT_ADDED';

export const taskResolvers = {
  Query: {
    tasks: async (
      _: unknown,
      args: { filter?: TaskFilterInput; first?: number; after?: string },
      ctx: Context
    ) => {
      requireAuth(ctx.userId);
      const tasks = await ctx.dataSources.tasks.findAll(args.filter);
      return paginate(tasks, args);
    },

    task: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.tasks.findById(id);
    },

    tags: async (_: unknown, __: unknown, ctx: Context) => {
      return ctx.dataSources.tags.findAll();
    },
  },

  Mutation: {
    createTask: async (_: unknown, { input }: { input: CreateTaskInput }, ctx: Context) => {
      requireAuth(ctx.userId);
      const task = await ctx.dataSources.tasks.create(input, ctx.userId!);
      pubsub.publish(`${TASK_CREATED}.${task.projectId}`, { taskCreated: task });
      return task;
    },

    updateTask: async (_: unknown, { id, input }: { id: string; input: UpdateTaskInput }, ctx: Context) => {
      requireAuth(ctx.userId);
      const task = await ctx.dataSources.tasks.update(id, input, ctx.userId!);
      const updater = await ctx.loaders.userLoader.load(ctx.userId!);
      pubsub.publish(`${TASK_UPDATED}.${task.projectId}`, {
        taskUpdated: { task, updatedBy: updater },
      });
      return task;
    },

    deleteTask: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.tasks.delete(id, ctx.userId!);
    },

    addComment: async (_: unknown, { taskId, content }: { taskId: string; content: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      const comment = await ctx.dataSources.comments.create(taskId, content, ctx.userId!);
      const task = await ctx.dataSources.tasks.findById(taskId);
      pubsub.publish(`${COMMENT_ADDED}.${taskId}`, { commentAdded: { comment, task } });
      return comment;
    },

    deleteComment: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx.userId);
      return ctx.dataSources.comments.delete(id, ctx.userId!);
    },
  },

  Subscription: {
    taskUpdated: {
      subscribe: (_: unknown, { projectId }: { projectId: string }) =>
        pubsub.asyncIterator(`${TASK_UPDATED}.${projectId}`),
    },

    taskCreated: {
      subscribe: (_: unknown, { projectId }: { projectId: string }) =>
        pubsub.asyncIterator(`${TASK_CREATED}.${projectId}`),
    },

    commentAdded: {
      subscribe: (_: unknown, { taskId }: { taskId: string }) =>
        pubsub.asyncIterator(`${COMMENT_ADDED}.${taskId}`),
    },
  },

  Task: {
    project: async (task: Task, _: unknown, ctx: Context) => {
      return ctx.dataSources.projects.findById(task.projectId);
    },

    assignee: async (task: Task, _: unknown, ctx: Context) => {
      if (!task.assigneeId) return null;
      return ctx.loaders.userLoader.load(task.assigneeId);
    },

    reporter: async (task: Task, _: unknown, ctx: Context) => {
      return ctx.loaders.userLoader.load(task.reporterId);
    },

    comments: async (task: Task, _: unknown, ctx: Context) => {
      return ctx.loaders.commentsByTaskLoader.load(task.id);
    },

    tags: async (task: Task, _: unknown, ctx: Context) => {
      return ctx.dataSources.tags.findByIds(task.tagIds);
    },
  },

  Comment: {
    author: async (comment: Comment, _: unknown, ctx: Context) => {
      return ctx.loaders.userLoader.load(comment.authorId);
    },

    task: async (comment: Comment, _: unknown, ctx: Context) => {
      return ctx.dataSources.tasks.findById(comment.taskId);
    },
  },
};

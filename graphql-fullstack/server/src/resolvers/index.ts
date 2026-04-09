import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { userResolvers } from './user.resolver';
import { projectResolvers } from './project.resolver';
import { taskResolvers } from './task.resolver';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...taskResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...taskResolvers.Mutation,
  },

  Subscription: {
    ...taskResolvers.Subscription,
  },

  // Field resolvers
  User: userResolvers.User,
  Project: projectResolvers.Project,
  Task: taskResolvers.Task,
  Comment: taskResolvers.Comment,
};

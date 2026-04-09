import { GraphQLError } from 'graphql';

export class NotFoundError extends GraphQLError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, {
      extensions: { code: 'NOT_FOUND', resource, id },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, field?: string) {
    super(message, {
      extensions: { code: 'BAD_USER_INPUT', field },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

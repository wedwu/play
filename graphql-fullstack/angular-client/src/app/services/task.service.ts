import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import {
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  ADD_COMMENT_MUTATION,
} from '../graphql/mutations';
import {
  PROJECT_QUERY,
  TASK_UPDATED_SUBSCRIPTION,
} from '../graphql/queries';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private apollo: Apollo) {}

  getProject(id: string, first = 100) {
    return this.apollo
      .watchQuery({ query: PROJECT_QUERY, variables: { id, first } })
      .valueChanges.pipe(map((r: any) => r.data?.project));
  }

  createTask(input: {
    title: string;
    projectId: string;
    priority?: TaskPriority;
    description?: string;
    tagIds?: string[];
  }) {
    return this.apollo
      .mutate({
        mutation: CREATE_TASK_MUTATION,
        variables: { input },
        refetchQueries: [{ query: PROJECT_QUERY, variables: { id: input.projectId, first: 100 } }],
      })
      .pipe(map((r: any) => r.data?.createTask));
  }

  updateTask(id: string, input: Partial<{ status: TaskStatus; priority: TaskPriority; title: string; assigneeId: string }>) {
    return this.apollo
      .mutate({
        mutation: UPDATE_TASK_MUTATION,
        variables: { id, input },
        optimisticResponse: {
          updateTask: { __typename: 'Task', id, ...input },
        },
      })
      .pipe(map((r: any) => r.data?.updateTask));
  }

  deleteTask(id: string) {
    return this.apollo
      .mutate({ mutation: DELETE_TASK_MUTATION, variables: { id } })
      .pipe(map((r: any) => r.data?.deleteTask));
  }

  addComment(taskId: string, content: string) {
    return this.apollo
      .mutate({ mutation: ADD_COMMENT_MUTATION, variables: { taskId, content } })
      .pipe(map((r: any) => r.data?.addComment));
  }

  subscribeToTaskUpdates(projectId: string) {
    return this.apollo
      .subscribe({ query: TASK_UPDATED_SUBSCRIPTION, variables: { projectId } })
      .pipe(map((r: any) => r.data?.taskUpdated));
  }
}

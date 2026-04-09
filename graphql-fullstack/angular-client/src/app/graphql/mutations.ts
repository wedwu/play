import { gql } from 'apollo-angular';
import { USER_FIELDS, TASK_FIELDS, PROJECT_FIELDS } from './queries';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) { ...ProjectFields }
  }
  ${PROJECT_FIELDS}
`;

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) { ...TaskFields }
  }
  ${TASK_FIELDS}
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) { ...TaskFields }
  }
  ${TASK_FIELDS}
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($taskId: ID!, $content: String!) {
    addComment(taskId: $taskId, content: $content) {
      id content createdAt
      author { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

import { gql } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    role
    avatarUrl
  }
`;

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    title
    description
    status
    priority
    dueDate
    estimatedHours
    createdAt
    updatedAt
    assignee { ...UserFields }
    reporter { ...UserFields }
    tags { id name color }
  }
  ${USER_FIELDS}
`;

export const PROJECT_FIELDS = gql`
  fragment ProjectFields on Project {
    id
    name
    description
    status
    taskCount
    owner { ...UserFields }
    members { ...UserFields }
    createdAt
  }
  ${USER_FIELDS}
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const ME_QUERY = gql`
  query Me {
    me { ...UserFields }
  }
  ${USER_FIELDS}
`;

export const PROJECTS_QUERY = gql`
  query Projects($first: Int, $after: String) {
    projects(first: $first, after: $after) {
      edges {
        cursor
        node { ...ProjectFields }
      }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
  ${PROJECT_FIELDS}
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!, $first: Int, $after: String, $filter: TaskFilterInput) {
    project(id: $id) {
      ...ProjectFields
      tasks(first: $first, after: $after, filter: $filter) {
        edges {
          cursor
          node { ...TaskFields }
        }
        pageInfo { hasNextPage endCursor }
        totalCount
      }
    }
  }
  ${PROJECT_FIELDS}
  ${TASK_FIELDS}
`;

export const TASK_QUERY = gql`
  query Task($id: ID!) {
    task(id: $id) {
      ...TaskFields
      project { id name }
      comments {
        id
        content
        createdAt
        author { ...UserFields }
      }
    }
  }
  ${TASK_FIELDS}
  ${USER_FIELDS}
`;

export const TAGS_QUERY = gql`
  query Tags {
    tags { id name color }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

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
      id
      content
      createdAt
      author { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription TaskUpdated($projectId: ID!) {
    taskUpdated(projectId: $projectId) {
      task { ...TaskFields }
      updatedBy { ...UserFields }
    }
  }
  ${TASK_FIELDS}
  ${USER_FIELDS}
`;

export const TASK_CREATED_SUBSCRIPTION = gql`
  subscription TaskCreated($projectId: ID!) {
    taskCreated(projectId: $projectId) { ...TaskFields }
  }
  ${TASK_FIELDS}
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription CommentAdded($taskId: ID!) {
    commentAdded(taskId: $taskId) {
      comment {
        id
        content
        createdAt
        author { ...UserFields }
      }
    }
  }
  ${USER_FIELDS}
`;

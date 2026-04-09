import { gql } from 'apollo-angular';

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

export const ME_QUERY = gql`
  query Me {
    me { ...UserFields }
  }
  ${USER_FIELDS}
`;

export const PROJECTS_QUERY = gql`
  query Projects($first: Int, $after: String) {
    projects(first: $first, after: $after) {
      edges { cursor node { ...ProjectFields } }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
  ${PROJECT_FIELDS}
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!, $first: Int, $filter: TaskFilterInput) {
    project(id: $id) {
      ...ProjectFields
      tasks(first: $first, filter: $filter) {
        edges { cursor node { ...TaskFields } }
        pageInfo { hasNextPage endCursor }
        totalCount
      }
    }
  }
  ${PROJECT_FIELDS}
  ${TASK_FIELDS}
`;

export const TAGS_QUERY = gql`
  query Tags {
    tags { id name color }
  }
`;

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

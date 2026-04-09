import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # ──────────────────────────────────────────────────────────────
  # Scalars & Enums
  # ──────────────────────────────────────────────────────────────

  scalar DateTime
  scalar JSON

  enum Role {
    ADMIN
    MEMBER
    VIEWER
  }

  enum TaskStatus {
    BACKLOG
    TODO
    IN_PROGRESS
    IN_REVIEW
    DONE
    CANCELLED
  }

  enum TaskPriority {
    URGENT
    HIGH
    MEDIUM
    LOW
  }

  enum ProjectStatus {
    ACTIVE
    PAUSED
    COMPLETED
    ARCHIVED
  }

  # ──────────────────────────────────────────────────────────────
  # Core Types
  # ──────────────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    avatarUrl: String
    projects: [Project!]!
    assignedTasks: [Task!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    status: ProjectStatus!
    owner: User!
    members: [User!]!
    tasks(filter: TaskFilterInput, first: Int, after: String): TaskConnection!
    taskCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    project: Project!
    assignee: User
    reporter: User!
    comments: [Comment!]!
    tags: [Tag!]!
    dueDate: DateTime
    estimatedHours: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Comment {
    id: ID!
    content: String!
    task: Task!
    author: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Tag {
    id: ID!
    name: String!
    color: String!
  }

  # ──────────────────────────────────────────────────────────────
  # Relay-style Connections (cursor-based pagination)
  # ──────────────────────────────────────────────────────────────

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type TaskEdge {
    cursor: String!
    node: Task!
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProjectEdge {
    cursor: String!
    node: Project!
  }

  type ProjectConnection {
    edges: [ProjectEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # ──────────────────────────────────────────────────────────────
  # Auth Payload
  # ──────────────────────────────────────────────────────────────

  type AuthPayload {
    token: String!
    user: User!
  }

  # ──────────────────────────────────────────────────────────────
  # Subscription Payloads
  # ──────────────────────────────────────────────────────────────

  type TaskUpdatedPayload {
    task: Task!
    updatedBy: User!
  }

  type CommentAddedPayload {
    comment: Comment!
    task: Task!
  }

  # ──────────────────────────────────────────────────────────────
  # Input Types
  # ──────────────────────────────────────────────────────────────

  input RegisterInput {
    email: String!
    password: String!
    name: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProjectInput {
    name: String!
    description: String
  }

  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
  }

  input CreateTaskInput {
    title: String!
    description: String
    projectId: ID!
    assigneeId: ID
    priority: TaskPriority
    dueDate: String
    estimatedHours: Float
    tagIds: [ID!]
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: TaskPriority
    assigneeId: ID
    dueDate: String
    estimatedHours: Float
    tagIds: [ID!]
  }

  input TaskFilterInput {
    status: TaskStatus
    priority: TaskPriority
    assigneeId: ID
    tagIds: [ID!]
  }

  # ──────────────────────────────────────────────────────────────
  # Operations
  # ──────────────────────────────────────────────────────────────

  type Query {
    # Auth
    me: User

    # Users (admin only)
    users: [User!]!
    user(id: ID!): User

    # Projects
    projects(first: Int, after: String): ProjectConnection!
    project(id: ID!): Project

    # Tasks
    tasks(filter: TaskFilterInput, first: Int, after: String): TaskConnection!
    task(id: ID!): Task

    # Tags
    tags: [Tag!]!
  }

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    addProjectMember(projectId: ID!, userId: ID!): Project!
    removeProjectMember(projectId: ID!, userId: ID!): Project!

    # Tasks
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!

    # Comments
    addComment(taskId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!

    # Admin
    updateUserRole(userId: ID!, role: Role!): User!
  }

  type Subscription {
    taskUpdated(projectId: ID!): TaskUpdatedPayload!
    taskCreated(projectId: ID!): Task!
    commentAdded(taskId: ID!): CommentAddedPayload!
  }
`;

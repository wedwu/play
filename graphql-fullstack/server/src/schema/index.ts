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
    email: String! @sanitize(trim: true, lowercase: true)
    password: String!
    name: String!  @sanitize(trim: true, maxLength: 100)
  }

  input LoginInput {
    email: String! @sanitize(trim: true, lowercase: true)
    password: String!
  }

  input CreateProjectInput {
    name: String!        @sanitize(trim: true, maxLength: 120)
    description: String  @sanitize(trim: true, maxLength: 500)
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
    # Auth — public
    me: User

    # Users — admin only
    users: [User!]! @auth(requires: ADMIN)
    user(id: ID!): User @auth

    # Projects — members only
    projects(first: Int, after: String): ProjectConnection! @auth
    project(id: ID!): Project @auth

    # Tasks — members only
    tasks(filter: TaskFilterInput, first: Int, after: String): TaskConnection! @auth
    task(id: ID!): Task @auth

    # Tags — members only
    tags: [Tag!]! @auth
  }

  type Mutation {
    # Auth — public (rate limited at HTTP layer)
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Projects — members only
    createProject(input: CreateProjectInput!): Project! @auth @rateLimit(max: 10, window: 60)
    updateProject(id: ID!, input: UpdateProjectInput!): Project! @auth
    deleteProject(id: ID!): Boolean! @auth
    addProjectMember(projectId: ID!, userId: ID!): Project! @auth(requires: ADMIN)
    removeProjectMember(projectId: ID!, userId: ID!): Project! @auth(requires: ADMIN)

    # Tasks — members only
    createTask(input: CreateTaskInput!): Task! @auth @rateLimit(max: 30, window: 60)
    updateTask(id: ID!, input: UpdateTaskInput!): Task! @auth
    deleteTask(id: ID!): Boolean! @auth

    # Comments — rate limited to prevent spam
    addComment(taskId: ID!, content: String!): Comment! @auth @rateLimit(max: 60, window: 60)
    deleteComment(id: ID!): Boolean! @auth

    # Admin only
    updateUserRole(userId: ID!, role: Role!): User! @auth(requires: ADMIN)
  }

  type Subscription {
    taskUpdated(projectId: ID!): TaskUpdatedPayload!
    taskCreated(projectId: ID!): Task!
    commentAdded(taskId: ID!): CommentAddedPayload!
  }
`;

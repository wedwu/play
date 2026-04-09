/**
 * In-memory database — swap for a real ORM/DB connection in production.
 * Structured to mirror a real persistence layer: separate stores, typed maps.
 */
import { v4 as uuid } from 'uuid';
import { User, Project, Task, Comment, Tag, Role, TaskStatus, TaskPriority, ProjectStatus } from '../types';
import { hashPassword } from '../utils/auth';

export interface Db {
  users: Map<string, User>;
  projects: Map<string, Project>;
  tasks: Map<string, Task>;
  comments: Map<string, Comment>;
  tags: Map<string, Tag>;
}

export const db: Db = {
  users: new Map(),
  projects: new Map(),
  tasks: new Map(),
  comments: new Map(),
  tags: new Map(),
};

export async function seedDatabase(): Promise<void> {
  // Tags
  const tagIds = {
    frontend: uuid(),
    backend: uuid(),
    bug: uuid(),
    feature: uuid(),
    docs: uuid(),
  };

  const tags: Tag[] = [
    { id: tagIds.frontend, name: 'Frontend', color: '#3B82F6' },
    { id: tagIds.backend, name: 'Backend', color: '#10B981' },
    { id: tagIds.bug, name: 'Bug', color: '#EF4444' },
    { id: tagIds.feature, name: 'Feature', color: '#8B5CF6' },
    { id: tagIds.docs, name: 'Docs', color: '#F59E0B' },
  ];
  tags.forEach((t) => db.tags.set(t.id, t));

  // Users
  const now = new Date();
  const adminId = uuid();
  const member1Id = uuid();
  const member2Id = uuid();

  const [adminHash, m1Hash, m2Hash] = await Promise.all([
    hashPassword('admin123'),
    hashPassword('member123'),
    hashPassword('member123'),
  ]);

  const users: User[] = [
    {
      id: adminId,
      email: 'admin@taskflow.dev',
      passwordHash: adminHash,
      name: 'Alice Admin',
      role: Role.ADMIN,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: member1Id,
      email: 'bob@taskflow.dev',
      passwordHash: m1Hash,
      name: 'Bob Builder',
      role: Role.MEMBER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: member2Id,
      email: 'carol@taskflow.dev',
      passwordHash: m2Hash,
      name: 'Carol Coder',
      role: Role.MEMBER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
      createdAt: now,
      updatedAt: now,
    },
  ];
  users.forEach((u) => db.users.set(u.id, u));

  // Projects
  const proj1Id = uuid();
  const proj2Id = uuid();

  const projects: Project[] = [
    {
      id: proj1Id,
      name: 'TaskFlow Platform',
      description: 'The core platform — GraphQL API, React and Angular clients.',
      status: ProjectStatus.ACTIVE,
      ownerId: adminId,
      memberIds: [adminId, member1Id, member2Id],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: proj2Id,
      name: 'Mobile App',
      description: 'React Native companion app.',
      status: ProjectStatus.ACTIVE,
      ownerId: member1Id,
      memberIds: [member1Id, member2Id],
      createdAt: now,
      updatedAt: now,
    },
  ];
  projects.forEach((p) => db.projects.set(p.id, p));

  // Tasks
  const taskDefs = [
    { title: 'Design GraphQL schema', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: adminId, tagIds: [tagIds.backend, tagIds.docs], projectId: proj1Id },
    { title: 'Implement resolvers', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: member1Id, tagIds: [tagIds.backend], projectId: proj1Id },
    { title: 'Set up DataLoaders', status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, assigneeId: member1Id, tagIds: [tagIds.backend], projectId: proj1Id },
    { title: 'Build React client', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: member2Id, tagIds: [tagIds.frontend], projectId: proj1Id },
    { title: 'Build Angular client', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assigneeId: member2Id, tagIds: [tagIds.frontend], projectId: proj1Id },
    { title: 'Fix subscription memory leak', status: TaskStatus.BACKLOG, priority: TaskPriority.URGENT, tagIds: [tagIds.bug, tagIds.backend], projectId: proj1Id },
    { title: 'Write API documentation', status: TaskStatus.TODO, priority: TaskPriority.LOW, tagIds: [tagIds.docs], projectId: proj1Id },
    { title: 'Mobile nav scaffold', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: member2Id, tagIds: [tagIds.frontend, tagIds.feature], projectId: proj2Id },
    { title: 'Push notifications', status: TaskStatus.BACKLOG, priority: TaskPriority.HIGH, tagIds: [tagIds.feature], projectId: proj2Id },
  ];

  const taskIds: string[] = [];
  taskDefs.forEach((def) => {
    const id = uuid();
    taskIds.push(id);
    const task: Task = {
      id,
      title: def.title,
      status: def.status,
      priority: def.priority,
      projectId: def.projectId,
      assigneeId: def.assigneeId,
      reporterId: adminId,
      tagIds: def.tagIds,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.set(id, task);
  });

  // Comments
  const commentDefs = [
    { content: 'Schema looks great, approved!', taskId: taskIds[0], authorId: member1Id },
    { content: 'Added cursor-based pagination to the task queries.', taskId: taskIds[1], authorId: member1Id },
    { content: 'Should we also add filtering by assignee?', taskId: taskIds[1], authorId: member2Id },
    { content: 'DataLoader cuts N+1 queries significantly in tests.', taskId: taskIds[2], authorId: adminId },
  ];

  commentDefs.forEach((def) => {
    const id = uuid();
    db.comments.set(id, { id, ...def, createdAt: now, updatedAt: now });
  });
}

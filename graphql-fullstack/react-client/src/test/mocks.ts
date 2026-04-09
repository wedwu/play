/**
 * Shared mock data for all React tests.
 * Plain objects — no Apollo-specific wrappers.
 */
import type { Task, Project, User, Tag } from '../types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alice Admin',
  email: 'admin@taskflow.dev',
  role: 'ADMIN',
  avatarUrl: 'https://example.com/avatar.svg',
};

export const mockMember: User = {
  id: 'user-2',
  name: 'Bob Builder',
  email: 'bob@taskflow.dev',
  role: 'MEMBER',
};

export const mockTag: Tag = { id: 'tag-1', name: 'Frontend', color: '#3B82F6' };

export const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Build login form',
  status: 'TODO',
  priority: 'HIGH',
  reporter: mockUser,
  tags: [mockTag],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export const mockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'TaskFlow Platform',
  description: 'The core platform',
  status: 'ACTIVE',
  owner: mockUser,
  members: [mockUser, mockMember],
  taskCount: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

// Shaped project query response with tasks connection
export const mockProjectWithTasks = (tasks: Task[] = [mockTask()]) => ({
  ...mockProject(),
  tasks: {
    edges: tasks.map((t, i) => ({ cursor: `c-${i}`, node: t })),
    pageInfo: { hasNextPage: false, endCursor: null },
    totalCount: tasks.length,
  },
});

// Projects connection response
export const mockProjectsConnection = (projects: Project[] = [mockProject()], hasNextPage = false) => ({
  edges: projects.map((p, i) => ({ cursor: `cursor-${i}`, node: p })),
  pageInfo: { hasNextPage, endCursor: hasNextPage ? 'cursor-end' : null },
  totalCount: projects.length,
});

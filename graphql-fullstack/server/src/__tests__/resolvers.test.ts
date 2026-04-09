/**
 * Integration-style tests for resolvers using the in-memory data layer.
 * No mocking — actual datasource & loader code runs against the seeded DB.
 */
import { seedDatabase, db } from '../datasources/db';
import { UserAPI } from '../datasources/UserAPI';
import { ProjectAPI } from '../datasources/ProjectAPI';
import { TaskAPI } from '../datasources/TaskAPI';
import { hashPassword, comparePassword, signToken, verifyToken } from '../utils/auth';
import { paginate } from '../utils/pagination';
import { Role, TaskStatus } from '../types';

beforeAll(async () => {
  await seedDatabase();
});

afterAll(() => {
  db.users.clear();
  db.projects.clear();
  db.tasks.clear();
  db.comments.clear();
  db.tags.clear();
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('JWT utilities', () => {
  it('signs and verifies a token', () => {
    const payload = { userId: 'abc', role: Role.ADMIN };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('abc');
    expect(decoded.role).toBe(Role.ADMIN);
  });

  it('throws on invalid token', () => {
    expect(() => verifyToken('not.a.token')).toThrow();
  });
});

describe('Password utilities', () => {
  it('hashes and verifies correctly', async () => {
    const hash = await hashPassword('secret');
    expect(await comparePassword('secret', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

// ─── UserAPI ─────────────────────────────────────────────────────────────────

describe('UserAPI', () => {
  const api = new UserAPI();

  it('finds seeded users', async () => {
    const users = await api.findAll();
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  it('authenticates with correct credentials', async () => {
    const user = await api.authenticate('admin@taskflow.dev', 'admin123');
    expect(user.email).toBe('admin@taskflow.dev');
    expect(user.role).toBe(Role.ADMIN);
  });

  it('rejects wrong password', async () => {
    await expect(api.authenticate('admin@taskflow.dev', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('prevents duplicate email registration', async () => {
    await expect(
      api.register({ email: 'admin@taskflow.dev', password: 'x', name: 'Dup' })
    ).rejects.toThrow('Email already in use');
  });

  it('registers a new user as MEMBER', async () => {
    const user = await api.register({ email: 'new@test.com', password: 'pass123', name: 'New User' });
    expect(user.role).toBe(Role.MEMBER);
    db.users.delete(user.id); // cleanup
  });
});

// ─── ProjectAPI ──────────────────────────────────────────────────────────────

describe('ProjectAPI', () => {
  const api = new ProjectAPI();

  it('returns projects for a member', async () => {
    const users = await new UserAPI().findAll();
    const admin = users.find((u) => u.role === Role.ADMIN)!;
    const projects = await api.findByMember(admin.id);
    expect(projects.length).toBeGreaterThan(0);
  });
});

// ─── TaskAPI ─────────────────────────────────────────────────────────────────

describe('TaskAPI', () => {
  const api = new TaskAPI();

  it('filters tasks by status', async () => {
    const tasks = await api.findAll({ status: TaskStatus.DONE });
    expect(tasks.every((t) => t.status === TaskStatus.DONE)).toBe(true);
  });

  it('creates a task in a project', async () => {
    const projects = await new ProjectAPI().findAll();
    const project = projects[0];
    const reporter = [...db.users.values()].find((u) => project.memberIds.includes(u.id))!;

    const task = await api.create(
      { title: 'Test task', projectId: project.id, priority: undefined },
      reporter.id
    );

    expect(task.title).toBe('Test task');
    expect(task.projectId).toBe(project.id);
    db.tasks.delete(task.id); // cleanup
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────

describe('paginate()', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));

  it('returns first N items', () => {
    const result = paginate(items, { first: 3 });
    expect(result.edges.length).toBe(3);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.totalCount).toBe(10);
  });

  it('paginates with cursor', () => {
    const page1 = paginate(items, { first: 3 });
    const page2 = paginate(items, { first: 3, after: page1.pageInfo.endCursor });
    expect(page2.edges[0].node.id).toBe('4');
  });

  it('returns all items when no args given', () => {
    const result = paginate(items, {});
    expect(result.edges.length).toBe(10);
    expect(result.pageInfo.hasNextPage).toBe(false);
  });
});

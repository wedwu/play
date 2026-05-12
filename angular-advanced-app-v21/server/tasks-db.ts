export interface SubTaskRecord { id: string; title: string; done: boolean; }
export interface TagRecord { label: string; color: string; }

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  priority: number;
  taskStatus: string;
  assigneeId?: string;
  projectId?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours: number;
  tags: TagRecord[];
  subtasks: SubTaskRecord[];
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const now = new Date().toISOString();
const threeDaysOut = new Date(Date.now() + 86_400_000 * 3).toISOString();

export const TASKS: Record<string, TaskRecord> = {
  'task-001': {
    id: 'task-001',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    priority: 3, taskStatus: 'in_progress', assigneeId: 'u1',
    dueDate: threeDaysOut, estimatedHours: 8, loggedHours: 3,
    tags: [{ label: 'devops', color: '#4ECDC4' }, { label: 'infrastructure', color: '#45B7D1' }],
    subtasks: [
      { id: 'sub-001', title: 'Configure runner', done: true },
      { id: 'sub-002', title: 'Write deployment script', done: false },
      { id: 'sub-003', title: 'Set up staging environment', done: false },
    ],
    createdBy: 'u1', status: 'active', createdAt: now, updatedAt: now,
  },
  'task-002': {
    id: 'task-002',
    title: 'Design system audit',
    description: 'Review all UI components for consistency',
    priority: 2, taskStatus: 'review', assigneeId: 'u2',
    estimatedHours: 4, loggedHours: 0,
    tags: [{ label: 'design', color: '#DDA0DD' }], subtasks: [],
    createdBy: 'u2', status: 'active', createdAt: now, updatedAt: now,
  },
  'task-003': {
    id: 'task-003',
    title: 'Fix authentication bug',
    description: 'Users cannot reset passwords via email link',
    priority: 4, taskStatus: 'todo', assigneeId: 'u1',
    estimatedHours: 3, loggedHours: 0,
    tags: [{ label: 'bug', color: '#FF6B6B' }, { label: 'auth', color: '#FFEAA7' }],
    subtasks: [
      { id: 'sub-004', title: 'Reproduce issue', done: false },
      { id: 'sub-005', title: 'Write fix', done: false },
      { id: 'sub-006', title: 'Test fix', done: false },
    ],
    createdBy: 'u1', status: 'active', createdAt: now, updatedAt: now,
  },
  'task-004': {
    id: 'task-004',
    title: 'Write unit tests',
    description: 'Achieve 80% test coverage on core modules',
    priority: 1, taskStatus: 'backlog', assigneeId: 'u3',
    estimatedHours: 12, loggedHours: 0,
    tags: [{ label: 'testing', color: '#96CEB4' }], subtasks: [],
    createdBy: 'u3', status: 'active', createdAt: now, updatedAt: now,
  },
  'task-005': {
    id: 'task-005',
    title: 'Implement dark mode',
    description: 'Add theme toggle and persist user preference',
    priority: 2, taskStatus: 'todo', assigneeId: 'u2',
    estimatedHours: 6, loggedHours: 0,
    tags: [{ label: 'feature', color: '#4ECDC4' }, { label: 'ui', color: '#DDA0DD' }],
    subtasks: [],
    createdBy: 'u2', status: 'active', createdAt: now, updatedAt: now,
  },
  'task-006': {
    id: 'task-006',
    title: 'Database query optimization',
    description: 'Slow queries in reports module causing timeouts',
    priority: 3, taskStatus: 'blocked', assigneeId: 'u1',
    estimatedHours: 5, loggedHours: 0,
    tags: [{ label: 'performance', color: '#FF6B6B' }], subtasks: [],
    createdBy: 'u1', status: 'active', createdAt: now, updatedAt: now,
  },
};

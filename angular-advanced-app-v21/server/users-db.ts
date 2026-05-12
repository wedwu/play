export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  superAdmin?: boolean;
  managedDepartments?: string[];
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const now = new Date().toISOString();

export const USERS: Record<string, UserRecord> = {
  'user-001': {
    id: 'user-001',
    firstName: 'Alice', lastName: 'Zhang', email: 'alice@acme.com',
    role: 'admin', department: 'ops',
    skills: ['TypeScript', 'Angular', 'Leadership'],
    superAdmin: true, managedDepartments: [],
    createdBy: 'system', status: 'active', createdAt: now, updatedAt: now,
  },
  'user-002': {
    id: 'user-002',
    firstName: 'Bob', lastName: 'Martin', email: 'bob@acme.com',
    role: 'manager', department: 'engineering',
    skills: ['Node.js', 'PostgreSQL'],
    createdBy: 'system', status: 'active', createdAt: now, updatedAt: now,
  },
  'user-003': {
    id: 'user-003',
    firstName: 'Carol', lastName: 'White', email: 'carol@acme.com',
    role: 'developer', department: 'engineering',
    skills: ['React', 'CSS'],
    createdBy: 'system', status: 'active', createdAt: now, updatedAt: now,
  },
  'user-004': {
    id: 'user-004',
    firstName: 'Dave', lastName: 'Kim', email: 'dave@acme.com',
    role: 'developer', department: 'design',
    skills: ['Figma', 'CSS'],
    createdBy: 'system', status: 'active', createdAt: now, updatedAt: now,
  },
  'user-005': {
    id: 'user-005',
    firstName: 'Eva', lastName: 'Patel', email: 'eva@acme.com',
    role: 'developer', department: 'product',
    skills: ['Python', 'Analytics'],
    createdBy: 'system', status: 'active', createdAt: now, updatedAt: now,
  },
};

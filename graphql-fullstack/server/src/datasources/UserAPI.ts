import { v4 as uuid } from 'uuid';
import { db } from './db';
import { User, Role, RegisterInput } from '../types';
import { hashPassword, comparePassword } from '../utils/auth';
import { NotFoundError, ValidationError } from '../utils/errors';

export class UserAPI {
  async findById(id: string): Promise<User | undefined> {
    return db.users.get(id);
  }

  async findByIds(ids: string[]): Promise<(User | undefined)[]> {
    return ids.map((id) => db.users.get(id));
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return [...db.users.values()].find((u) => u.email === email);
  }

  async findAll(): Promise<User[]> {
    return [...db.users.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async register(input: RegisterInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ValidationError('Email already in use', 'email');

    const now = new Date();
    const user: User = {
      id: uuid(),
      email: input.email.toLowerCase().trim(),
      passwordHash: await hashPassword(input.password),
      name: input.name.trim(),
      role: Role.MEMBER,
      createdAt: now,
      updatedAt: now,
    };
    db.users.set(user.id, user);
    return user;
  }

  async authenticate(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email.toLowerCase().trim());
    if (!user) throw new ValidationError('Invalid credentials');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new ValidationError('Invalid credentials');

    return user;
  }

  async updateRole(id: string, role: Role, requesterId: string): Promise<User> {
    const requester = db.users.get(requesterId);
    if (requester?.role !== Role.ADMIN) {
      throw new ValidationError('Only admins can change roles');
    }
    const user = db.users.get(id);
    if (!user) throw new NotFoundError('User', id);

    const updated = { ...user, role, updatedAt: new Date() };
    db.users.set(id, updated);
    return updated;
  }
}

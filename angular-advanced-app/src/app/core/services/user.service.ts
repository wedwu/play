// ============================================================
// USER SERVICE — ES6 Arrow Functions Throughout
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User, AdminUser, UserRole, Department } from '../models/user.model';
import { EntityStateService, FilterState, SortState } from './entity-state.service';
import { sortBy } from '../helpers/utils.helper';

/**
 * State service for {@link User} entities.
 *
 * Extends {@link EntityStateService} with user-specific derived streams and
 * business operations. Pre-populated with demo seed data on construction.
 */
@Injectable({ providedIn: 'root' })
export class UserService extends EntityStateService<User> {
  /** Live stream of all users with the `'admin'` role. */
  readonly admins$: Observable<User[]> = this.items$.pipe(
    map(users => users.filter(u => u.role === 'admin'))
  );

  /**
   * Users grouped by department. Every department key is always present,
   * even when the bucket is empty.
   */
  readonly byDepartment$: Observable<Record<Department, User[]>> = this.items$.pipe(
    map(users => {
      const depts: Department[] = ['engineering', 'design', 'product', 'marketing', 'ops'];
      return depts.reduce((acc, d) => ({ ...acc, [d]: users.filter(u => u.department === d) }),
        {} as Record<Department, User[]>);
    })
  );

  constructor() {
    super();
    this.seedUsers();
  }

  /**
   * Creates a new user, adds them to state, and returns the instance.
   * @param firstName - First name.
   * @param lastName - Last name.
   * @param email - Email address.
   * @param role - Role to assign. Defaults to `'developer'`.
   * @param dept - Department. Defaults to `'engineering'`.
   */
  createUser = (
    firstName: string, lastName: string, email: string,
    role: UserRole = 'developer', dept: Department = 'engineering'
  ): User => {
    const user = new User(firstName, lastName, email, role, dept, 'admin');
    this.add(user);
    return user;
  };

  /**
   * Promotes a user to a new role and persists the change in state.
   * No-ops silently when `userId` does not match any stored user.
   * @param userId - ID of the user to update.
   * @param role - The new role to assign.
   */
  updateRole = (userId: string, role: UserRole): void => {
    const user = this.getById(userId);
    if (user) { user.promote(role); this.update(userId, user as Partial<User>); }
  };

  /**
   * Returns a live stream of users whose IDs appear in `memberIds`.
   * @param memberIds - Array of user IDs to look up.
   */
  getUsersForProject = (memberIds: string[]): Observable<User[]> =>
    this.items$.pipe(map(users => users.filter(u => memberIds.includes(u.id))));

  protected override applyFilterAndSort = (
    items: User[], filter: FilterState, sort: SortState<User>
  ): User[] => {
    let result = [...items];
    if (filter['query']) {
      const q = (filter['query'] as string).toLowerCase();
      result = result.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.includes(q)
      );
    }
    if (filter['role'])       result = result.filter(u => u.role === filter['role']);
    if (filter['department']) result = result.filter(u => u.department === filter['department']);
    return sort.field
      ? sortBy(result, u => String(u[sort.field as keyof User] ?? ''), sort.direction)
      : sortBy(result, u => u.fullName);
  };

  private seedUsers = (): void => {
    const admin = new AdminUser('Alice', 'Zhang', 'alice@acme.com', true);
    admin.addSkill('TypeScript'); admin.addSkill('Angular'); admin.addSkill('Leadership');

    const makeUser = (
      first: string, last: string, email: string,
      role: UserRole, dept: Department, skills: string[]
    ): User => {
      const u = new User(first, last, email, role, dept);
      skills.forEach(s => u.addSkill(s));
      return u;
    };

    this.addMany([
      admin,
      makeUser('Bob',   'Martin', 'bob@acme.com',   'manager',   'engineering', ['Node.js', 'PostgreSQL']),
      makeUser('Carol', 'White',  'carol@acme.com',  'developer', 'engineering', ['React', 'CSS']),
      makeUser('Dave',  'Kim',    'dave@acme.com',   'developer', 'design',      ['Figma', 'CSS']),
      makeUser('Eva',   'Patel',  'eva@acme.com',    'developer', 'product',     ['Python', 'Analytics']),
    ]);
  };
}

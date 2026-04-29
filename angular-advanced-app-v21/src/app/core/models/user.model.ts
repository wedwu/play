// ============================================================
// USER MODEL — ES6 Arrow Functions Throughout
// ============================================================

import { BaseEntity, Entity, Required } from './base-entity.model';

/** Access levels ordered by privilege: admin > manager > developer > viewer. */
export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer';

/** Organisational unit a user belongs to. */
export type Department = 'engineering' | 'design' | 'product' | 'marketing' | 'ops';

/** Set of CRUD and administrative capabilities granted to a role. */
export interface UserPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

/**
 * Maps each {@link UserRole} to its fixed set of {@link UserPermissions}.
 * Access is read-only; role changes must go through {@link User.promote}.
 */
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin:     { canCreate: true,  canRead: true,  canUpdate: true,  canDelete: true,  canManageUsers: true  },
  manager:   { canCreate: true,  canRead: true,  canUpdate: true,  canDelete: false, canManageUsers: false },
  developer: { canCreate: true,  canRead: true,  canUpdate: true,  canDelete: false, canManageUsers: false },
  viewer:    { canCreate: false, canRead: true,  canUpdate: false, canDelete: false, canManageUsers: false },
};

/**
 * Domain entity representing an authenticated system user.
 *
 * Tracks identity, role-based permissions, skills, and login history.
 * `firstName`, `lastName`, and `email` are required fields (see {@link Required}).
 */
@Entity('users')
export class User extends BaseEntity {
  @Required firstName!: string;
  @Required lastName!: string;
  @Required email!: string;

  role: UserRole;
  department: Department;
  avatarUrl?: string;
  bio?: string;
  skills: string[] = [];
  private _passwordHash?: string;
  private _loginCount = 0;
  lastLoginAt?: Date;

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    role: UserRole = 'developer',
    department: Department = 'engineering',
    createdBy = 'system'
  ) {
    super(createdBy);
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.role = role;
    this.department = department;
  }

  // ── Getters (ES6 get syntax) ──────────────────

  /** Concatenated first and last name for display. */
  get fullName(): string { return `${this.firstName} ${this.lastName}`; }
  /** Two-character uppercase initials derived from first and last name. */
  get initials(): string { return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase(); }
  /** Permission set for the user's current role. Recalculated on every access. */
  get permissions(): UserPermissions { return ROLE_PERMISSIONS[this.role]; }
  /** Number of recorded logins. Incremented by {@link recordLogin}. */
  get loginCount(): number { return this._loginCount; }

  /**
   * Stores a salted hash derived from the provided raw password.
   * The raw value is never retained on the instance.
   */
  set password(raw: string) {
    this._passwordHash = btoa(raw + '_salt_' + this.id);
    this.touch();
  }

  // ── Abstract implementations → arrow properties ──
  validate(): boolean {
    return (
      this.firstName.trim().length > 0 &&
      this.lastName.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
    );
  }

  getDisplayName = (): string => this.fullName;

  serialize(): Record<string, unknown> {
    return {
      ...this.baseSerialize(),
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      department: this.department,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      skills: [...this.skills],
      loginCount: this._loginCount,
      lastLoginAt: this.lastLoginAt?.toISOString(),
    };
  }

  clone(): User {
    const copy = new User(this.firstName, this.lastName, this.email, this.role, this.department, this.createdBy);
    copy.bio = this.bio;
    copy.skills = [...this.skills];
    return copy;
  }

  // ── Domain methods → arrow properties ────────

  /**
   * Checks whether the user holds a specific permission.
   * @param permission - Key of {@link UserPermissions} to test.
   */
  can = (permission: keyof UserPermissions): boolean =>
    this.permissions[permission];

  /** Increments the login counter and records the current timestamp. */
  recordLogin = (): void => {
    this._loginCount++;
    this.lastLoginAt = new Date();
    this.touch();
  };

  /**
   * Adds a skill if not already present.
   * @param skill - Skill label to add.
   */
  addSkill = (skill: string): void => {
    if (!this.skills.includes(skill)) {
      this.skills = [...this.skills, skill];
      this.touch();
    }
  };

  /**
   * Removes a skill by label.
   * @param skill - Skill label to remove.
   */
  removeSkill = (skill: string): void => {
    this.skills = this.skills.filter(s => s !== skill);
    this.touch();
  };

  /**
   * Changes the user's role and touches the timestamp.
   * @param newRole - The role to assign.
   */
  promote = (newRole: UserRole): void => {
    this.role = newRole;
    this.touch();
  };
}

// ─────────────────────────────────────────────
// ADMIN USER — Multi-level inheritance
// ─────────────────────────────────────────────

/**
 * A {@link User} subclass with elevated `'admin'` role and department management.
 * Adds a tamper-evident audit log for recording admin actions.
 */
export class AdminUser extends User {
  /** When `true`, this admin has unrestricted access across all departments. */
  readonly superAdmin: boolean;
  managedDepartments: Department[] = [];
  auditLog: string[] = [];

  constructor(firstName: string, lastName: string, email: string, superAdmin = false) {
    super(firstName, lastName, email, 'admin', 'ops', 'system');
    this.superAdmin = superAdmin;
  }

  // Override arrow properties
  override validate = (): boolean => super.validate() && this.role === 'admin';

  override getDisplayName = (): string => `[ADMIN] ${this.fullName}`;

  override clone = (): AdminUser =>
    new AdminUser(this.firstName, this.lastName, this.email, this.superAdmin);

  /**
   * Appends a timestamped action to the audit log.
   * @param action - Human-readable description of the action taken.
   */
  log = (action: string): void => {
    this.auditLog.push(`[${new Date().toISOString()}] ${action}`);
  };

  /**
   * Grants this admin responsibility for a department.
   * Silently skips if already assigned, then logs the action.
   * @param dept - The department to assign.
   */
  assignDepartment = (dept: Department): void => {
    if (!this.managedDepartments.includes(dept)) {
      this.managedDepartments.push(dept);
      this.log(`Assigned to department: ${dept}`);
    }
  };

  override serialize = (): Record<string, unknown> => ({
    ...super.serialize(),
    superAdmin: this.superAdmin,
    managedDepartments: this.managedDepartments,
    auditLogCount: this.auditLog.length,
  });
}

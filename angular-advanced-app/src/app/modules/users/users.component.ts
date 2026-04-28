// ============================================================
// USERS COMPONENT
// Demonstrates: Input/Output, EventEmitter, ViewChild, HostListener
// ============================================================

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { User, UserRole, Department } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';
import { InitialsPipe, RelativeTimePipe } from '../../shared/pipes/pipes';
import { RippleDirective, TooltipDirective } from '../../shared/directives/directives';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NgClass, RippleDirective, TooltipDirective, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['user', 'selected'],
  outputs: ['userClick'],
  template: `
    <div class="user-card" [ngClass]="{ selected }" (click)="userClick.emit(user)" appRipple>
      <div class="avatar-wrap">
        <div class="avatar" [style.background]="color">{{ user.initials }}</div>
        <span class="status-dot" [ngClass]="user.status"></span>
      </div>
      <div class="user-details">
        <div class="user-name">{{ user.fullName }}</div>
        <div class="user-role">{{ user.role }}</div>
        <div class="user-dept">{{ user.department }}</div>
      </div>
      <div class="user-skills">
        @for (skill of user.skills.slice(0,3); track skill) {
          <span class="skill-chip" [appTooltip]="skill">{{ skill }}</span>
        }
        @if (user.skills.length > 3) {
          <span class="skill-more">+{{ user.skills.length - 3 }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .user-card {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 0.75rem;
      position: relative; overflow: hidden;
      &:hover { border-color: var(--accent); transform: translateY(-2px); }
      &.selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }
    }
    .avatar-wrap { display: flex; align-items: center; gap: 0.5rem; position: relative; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; color: #000; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg-secondary); position: absolute; bottom: 0; left: 36px; }
    .status-dot.active { background: #4ECDC4; }
    .status-dot.inactive { background: #aaa; }
    .user-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; }
    .user-role { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--accent); text-transform: uppercase; }
    .user-dept { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    .user-skills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .skill-chip { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help; }
    .skill-more { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--accent); padding: 1px 4px; }
  `]
})
export class UserCardComponent {
  @Input() user!: User;
  @Input() selected = false;
  @Output() userClick = new EventEmitter<User>();

  get color(): string {
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FFEAA7'];
    const hash = this.user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}

// ─────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    AsyncPipe, CommonModule, NgClass, FormsModule,
    UserCardComponent, InitialsPipe, RelativeTimePipe,
    RippleDirective, TooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('gridIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.9)' }),
          stagger(60, [animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="users-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Team</h1>
          @if (users$ | async; as users) {
            <p class="page-subtitle">{{ users.length }} members across all departments</p>
          }
        </div>
        <button class="btn btn-primary" appRipple (click)="addRandomUser()">+ Add Member</button>
      </header>

      <!-- Dept tabs -->
      <div class="dept-tabs">
        <button class="tab" [class.active]="!filterDept" (click)="setDept(null)" appRipple>All</button>
        @for (dept of departments; track dept) {
          <button class="tab" [class.active]="filterDept === dept" (click)="setDept(dept)" appRipple>
            {{ dept }}
          </button>
        }
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input class="search-input" [(ngModel)]="search"
               (ngModelChange)="userService.setQuery($event)"
               placeholder="🔍 Search team members..."/>
        <select class="filter-select" [(ngModel)]="filterRole" (ngModelChange)="userService.setFilter('role', $event || null)">
          <option value="">All Roles</option>
          @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
        </select>
      </div>

      <!-- User grid -->
      @if (users$ | async; as users) {
        <div class="users-grid" [@gridIn]="users.length">
          @for (user of users; track user.id) {
            <app-user-card
              [user]="user"
              [selected]="selectedUser?.id === user.id"
              (userClick)="selectUser($event)">
            </app-user-card>
          }
          @empty {
            <div class="empty-state">No team members found</div>
          }
        </div>
      }

      <!-- Detail panel -->
      @if (selectedUser) {
        <div class="detail-panel">
          <div class="panel-header">
            <div class="panel-avatar" [style.background]="getUserColor(selectedUser.id)">{{ selectedUser.initials }}</div>
            <div>
              <h2>{{ selectedUser.fullName }}</h2>
              <p class="panel-email">{{ selectedUser.email }}</p>
              <div class="panel-badges">
                <span class="badge badge--role">{{ selectedUser.role }}</span>
                <span class="badge badge--dept">{{ selectedUser.department }}</span>
                <span class="badge" [ngClass]="'badge--' + selectedUser.status">{{ selectedUser.status }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="selectedUser = null">✕</button>
          </div>

          @if (selectedUser.bio) {
            <p class="panel-bio">{{ selectedUser.bio }}</p>
          }

          <div class="panel-section">
            <h3>Skills ({{ selectedUser.skills.length }})</h3>
            <div class="skills-list">
              @for (skill of selectedUser.skills; track skill) {
                <span class="skill-badge">{{ skill }}
                  <button class="skill-remove" (click)="removeSkill(skill)">×</button>
                </span>
              }
              <button class="add-skill-btn" appRipple (click)="addSkillPrompt()">+ Add Skill</button>
            </div>
          </div>

          <div class="panel-section">
            <h3>Permissions</h3>
            <div class="permissions-grid">
              @for (entry of getPermissions(selectedUser); track entry.key) {
                <div class="perm-item" [ngClass]="{ allowed: entry.value }">
                  <span class="perm-icon">{{ entry.value ? '✓' : '✕' }}</span>
                  <span class="perm-label">{{ entry.key }}</span>
                </div>
              }
            </div>
          </div>

          <div class="panel-section">
            <h3>Change Role</h3>
            <div class="role-btns">
              @for (r of roles; track r) {
                <button class="btn btn-sm" [class.active]="selectedUser.role === r"
                  appRipple (click)="changeRole(r)">{{ r }}</button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page { max-width: 1200px; display: grid; grid-template-rows: auto auto auto 1fr; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; margin: 0; }
    .page-subtitle { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--text-secondary); margin: 0.25rem 0 0; }

    .dept-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tab { background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 8px; padding: 0.4rem 0.9rem; font-family: 'Space Mono', monospace; font-size: 0.72rem; cursor: pointer; text-transform: capitalize; position: relative; overflow: hidden; transition: all 0.15s; }
    .tab.active { background: var(--accent); color: var(--bg-primary); border-color: var(--accent); }

    .search-bar { display: flex; gap: 0.75rem; }
    .search-input, .filter-select { background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-primary); border-radius: 8px; padding: 0.6rem 1rem; font-family: 'Space Mono', monospace; font-size: 0.8rem; outline: none; &:focus { border-color: var(--accent); } }
    .search-input { flex: 1; }

    .users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary); font-family: 'Space Mono', monospace; }

    .detail-panel { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-top: 1rem; }
    .panel-header { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .panel-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.25rem; color: #000; flex-shrink: 0; }
    .panel-header > div { flex: 1; }
    .panel-header h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.25rem; margin: 0 0 0.25rem; }
    .panel-email { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 0.5rem; }
    .panel-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .badge { font-family: 'Space Mono', monospace; font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 700; }
    .badge--role { background: var(--accent-dim); color: var(--accent); }
    .badge--dept { background: #45B7D122; color: #45B7D1; }
    .badge--active { background: #4ECDC422; color: #4ECDC4; }
    .close-btn { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; flex-shrink: 0; }

    .panel-bio { font-family: 'Space Mono', monospace; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; }
    .panel-section { margin-bottom: 1.25rem; }
    .panel-section h3 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; margin: 0 0 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }

    .skills-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .skill-badge { background: var(--bg-elevated); border: 1px solid var(--accent); color: var(--accent); border-radius: 6px; padding: 0.25rem 0.5rem; font-family: 'Space Mono', monospace; font-size: 0.72rem; display: flex; align-items: center; gap: 0.25rem; }
    .skill-remove { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0; font-size: 0.8rem; line-height: 1; opacity: 0.6; &:hover { opacity: 1; } }
    .add-skill-btn { background: none; border: 1px dashed var(--border); color: var(--text-secondary); border-radius: 6px; padding: 0.25rem 0.75rem; font-family: 'Space Mono', monospace; font-size: 0.72rem; cursor: pointer; position: relative; overflow: hidden; }

    .permissions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
    .perm-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.6rem; border-radius: 6px; background: var(--bg-elevated); border: 1px solid var(--border); }
    .perm-item.allowed { border-color: #4ECDC444; }
    .perm-icon { font-family: 'Space Mono', monospace; font-size: 0.75rem; }
    .perm-item.allowed .perm-icon { color: #4ECDC4; }
    .perm-item:not(.allowed) .perm-icon { color: #FF6B6B; }
    .perm-label { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); }

    .role-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .btn { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); border-radius: 8px; padding: 0.5rem 1rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.8rem; cursor: pointer; position: relative; overflow: hidden; transition: all 0.15s; text-transform: capitalize; }
    .btn:hover { border-color: var(--accent); }
    .btn.active { background: var(--accent); color: var(--bg-primary); border-color: var(--accent); }
    .btn-primary { background: var(--accent); color: var(--bg-primary); border-color: var(--accent); }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.72rem; }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  readonly users$ = this.userService.filteredItems$;

  selectedUser: User | null = null;
  search = '';
  filterRole = '';
  filterDept: Department | null = null;
  private destroy$ = new Subject<void>();

  readonly roles: UserRole[] = ['admin', 'manager', 'developer', 'viewer'];
  readonly departments: Department[] = ['engineering', 'design', 'product', 'marketing', 'ops'];
  readonly avatarColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FFEAA7'];

  constructor(
    public userService: UserService,
    private notifications: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit = (): void => {
    this.userService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  selectUser = (user: User): void => {
    this.selectedUser = this.selectedUser?.id === user.id ? null : user;
  }

  setDept = (dept: Department | null): void => {
    this.filterDept = dept;
    this.userService.setFilter('department', dept);
  }

  changeRole = (role: UserRole): void => {
    if (!this.selectedUser) return;
    this.userService.updateRole(this.selectedUser.id, role);
    this.selectedUser = { ...this.selectedUser, role } as User;
    this.notifications.success('Role updated', `${this.selectedUser.fullName} → ${role}`);
    this.cdr.markForCheck();
  }

  addSkillPrompt = (): void => {
    const skill = prompt('Add skill:')?.trim();
    if (skill && this.selectedUser) {
      this.selectedUser.addSkill(skill);
      this.userService.update(this.selectedUser.id, this.selectedUser as Partial<User>);
      this.notifications.info('Skill added', skill);
      this.cdr.markForCheck();
    }
  }

  removeSkill = (skill: string): void => {
    if (!this.selectedUser) return;
    this.selectedUser.removeSkill(skill);
    this.userService.update(this.selectedUser.id, this.selectedUser as Partial<User>);
    this.cdr.markForCheck();
  }

  addRandomUser = (): void => {
    const names = [['Jordan','Lee'],['Sam','Patel'],['Alex','Kim'],['Morgan','Brown']];
    const [first, last] = names[Math.floor(Math.random() * names.length)];
    const user = this.userService.createUser(
      first, last, `${first.toLowerCase()}.${last.toLowerCase()}@acme.com`,
      'developer', 'engineering'
    );
    this.notifications.success('Member added', user.fullName);
  }

  getPermissions = (user: User): { key: string; value: boolean }[] => {
    return Object.entries(user.permissions).map(([key, value]) => ({ key, value }));
  }

  getUserColor = (id: string): string => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  ngOnDestroy = (): void => {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

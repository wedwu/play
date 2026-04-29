// ============================================================
// USERS COMPONENT
// Demonstrates: Input/Output, EventEmitter, ViewChild, HostListener
// ============================================================

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { User, UserRole, Department } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';
import { InitialsPipe } from '../../shared/pipes/pipes';
import { RippleDirective, TooltipDirective } from '../../shared/directives/directives';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [NgClass, RippleDirective, TooltipDirective, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['user', 'selected'],
  outputs: ['userClick'],
  templateUrl: './user-card.component.html',
  styleUrl: './users.component.scss'
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
    UserCardComponent, RippleDirective
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
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

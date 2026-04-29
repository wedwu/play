// ============================================================
// USERS COMPONENT
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from "@angular/core";

import { AsyncPipe, CommonModule, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { UserService } from "../../core/services/user.service";
import { NotificationService } from "../../core/services/notification.service";
import { User, UserRole, Department } from "../../core/models/user.model";

import {
  RippleDirective,
  TooltipDirective,
} from "../../shared/directives/directives";

import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
} from "@angular/animations";

/**
 * Reusable user card component (used inside UsersComponent).
 *
 * Displays a single user with avatar, role, department, and click handling.
 * Supports selection highlighting and custom ripple/tooltip effects.
 */
@Component({
  selector: "app-user-card",
  standalone: true,
  imports: [NgClass, RippleDirective, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./user-card.component.html",
  styleUrl: "./users.component.scss",
})
export class UserCardComponent {
  /** The user to display */
  @Input() user!: User;

  /** Whether this card is currently selected */
  @Input() selected = false;

  /** Emits when the card is clicked */
  @Output() userClick = new EventEmitter<User>();

  /**
   * Deterministic avatar background color based on user ID.
   * Consistent across renders and components.
   */
  get color(): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#DDA0DD",
      "#FFEAA7",
    ];
    const hash = this.user.id
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}

/**
 * Main users page component.
 *
 * Displays a searchable, filterable grid of team members with role management,
 * skill editing, and real-time updates. Demonstrates Input/Output, EventEmitter,
 * OnPush change detection, and animations.
 */
@Component({
  selector: "app-users",
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    NgClass,
    FormsModule,
    UserCardComponent,
    RippleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("gridIn", [
      transition("* => *", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "scale(0.9)" }),
            stagger(60, [
              animate(
                "300ms ease-out",
                style({ opacity: 1, transform: "scale(1)" }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
  templateUrl: "./users.component.html",
  styleUrl: "./users.component.scss",
})
export class UsersComponent implements OnInit, OnDestroy {
  // ── Injected Dependencies ──

  /** Public because it's used in the template (`users$`, filters, etc.) */
  readonly userService = inject(UserService);

  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Public Readonly Observables ──

  /** Filtered users observable (used directly in template with AsyncPipe) */
  readonly users$ = this.userService.filteredItems$;

  // ── Component State ──

  /** Currently selected user (null when none selected) */
  selectedUser: User | null = null;

  /** Search term for filtering users */
  search = "";

  /** Role filter */
  filterRole = "";

  /** Department filter */
  filterDept: Department | null = null;

  /** Subject for automatic unsubscription */
  private readonly destroy$ = new Subject<void>();

  /** Available roles for filtering */
  readonly roles: UserRole[] = ["admin", "manager", "developer", "viewer"];

  /** Available departments for filtering */
  readonly departments: Department[] = [
    "engineering",
    "design",
    "product",
    "marketing",
    "ops",
  ];

  /** Predefined avatar colors (used as fallback) */
  private readonly avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#DDA0DD",
    "#FFEAA7",
  ];

  constructor() {}

  // ── Lifecycle Hooks ──

  ngOnInit(): void {
    this.userService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public Methods (used in template) ──

  /** Toggles selection of a user */
  selectUser(user: User): void {
    this.selectedUser =
      this.selectedUser?.id === user.id ? null : this.cloneUser(user);
  }

  /** Sets department filter and updates the service */
  setDept(dept: Department | null): void {
    this.filterDept = dept;
    this.userService.setFilter("department", dept);
  }

  /** Updates the selected user's role */
  changeRole(role: UserRole): void {
    if (!this.selectedUser) return;

    this.userService.updateRole(this.selectedUser.id, role);

    // Update local selected user with a fresh clone
    const updated = this.cloneUser(this.selectedUser);
    updated.role = role;
    this.selectedUser = updated;

    this.notifications.success(
      "Role updated",
      `${this.selectedUser.fullName} → ${role}`,
    );
    this.cdr.markForCheck();
  }

  /** Adds a new skill to the selected user */
  addSkillPrompt(): void {
    const skill = prompt("Add skill:")?.trim();
    if (!skill || !this.selectedUser) return;

    const updated = this.cloneUser(this.selectedUser);
    updated.addSkill(skill);

    this.userService.update(this.selectedUser.id, updated as Partial<User>);
    this.selectedUser = updated;

    this.notifications.info("Skill added", skill);
    this.cdr.markForCheck();
  }

  /** Removes a skill from the selected user */
  removeSkill(skill: string): void {
    if (!this.selectedUser) return;

    const updated = this.cloneUser(this.selectedUser);
    updated.removeSkill(skill);

    this.userService.update(this.selectedUser.id, updated as Partial<User>);
    this.selectedUser = updated;

    this.cdr.markForCheck();
  }

  /** Creates and adds a random new user */
  addRandomUser(): void {
    const names = [
      ["Jordan", "Lee"],
      ["Sam", "Patel"],
      ["Alex", "Kim"],
      ["Morgan", "Brown"],
    ];
    const [first, last] = names[Math.floor(Math.random() * names.length)];

    const user = this.userService.createUser(
      first,
      last,
      `${first.toLowerCase()}.${last.toLowerCase()}@acme.com`,
      "developer",
      "engineering",
    );

    this.notifications.success("Member added", user.fullName);
  }

  /** Converts user permissions object into array for template display */
  getPermissions(user: User): { key: string; value: boolean }[] {
    return Object.entries(user.permissions).map(([key, value]) => ({
      key,
      value,
    }));
  }

  /** Returns avatar background color for a given user ID */
  getUserColor(id: string): string {
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  // ── Private Helpers ──

  /** Creates a deep clone of a User instance (preserves methods/getters) */
  private cloneUser(user: User): User {
    return user.clone ? user.clone() : (structuredClone(user) as User);
  }
}

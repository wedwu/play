// ============================================================
// DASHBOARD COMPONENT
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from "@angular/core";

import { AsyncPipe, CommonModule, NgClass } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Subject, combineLatest, takeUntil } from "rxjs";

import { TaskService } from "../../core/services/task.service";
import { UserService } from "../../core/services/user.service";
import { TaskStatus, TaskPriority } from "../../core/models/task.model";

import { PriorityLabelPipe } from "../../shared/pipes/pipes";
import {
  RippleDirective,
  TooltipDirective,
} from "../../shared/directives/directives";

/**
 * Main dashboard page component.
 *
 * Displays aggregate task statistics, urgent tasks, a mini Kanban board overview,
 * and a team member list. Demonstrates all major Angular lifecycle hooks with
 * real-time logging in a debug panel.
 *
 * Uses **OnPush** change detection and exposes observables for async pipe usage.
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    NgClass,
    RouterLink,
    PriorityLabelPipe,
    RippleDirective,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  /** Reference to the lifecycle debug panel element. Bound in {@link ngAfterViewInit}. */
  @ViewChild("debugPanel") debugPanel!: ElementRef<HTMLElement>;

  /**
   * Optional theme override passed from a parent component.
   * Triggers {@link ngOnChanges} when changed.
   */
  @Input() theme?: string;

  // ── Injected services (MUST come before any properties that use them) ──
  readonly taskService = inject(TaskService);
  readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Public readonly references (exposed to template) ──
  /** Enum reference for use in the template */
  readonly TaskStatus = TaskStatus;

  /** Observable of urgent/high-priority tasks */
  readonly urgentTasks$ = this.taskService.urgentTasks$;

  /** Observable of tasks grouped by status (for mini Kanban) */
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;

  /** Observable containing total task statistics */
  readonly stats$ = this.taskService.totalStats$;

  /** Observable of all users/team members */
  readonly users$ = this.userService.items$;

  /** Kanban column definitions shown in the board overview card */
  readonly statusCols = [
    { status: TaskStatus.TODO, label: "To Do", color: "#96CEB4" },
    { status: TaskStatus.IN_PROGRESS, label: "In Progress", color: "#45B7D1" },
    { status: TaskStatus.REVIEW, label: "Review", color: "#DDA0DD" },
  ];

  /** Timestamped lifecycle hook entries (last 6 only) shown in the debug panel */
  hookLog: string[] = [];

  /** Number of times `stats$` or `users$` observables have emitted */
  renderCount = 0;

  /** Flag indicating whether the `@ViewChild` debug panel has been initialized */
  viewChildReady = false;

  /** Used to automatically unsubscribe from observables on destroy */
  private readonly destroy$ = new Subject<void>();

  /** Predefined color palette for user avatars */
  private readonly avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#DDA0DD",
    "#FFEAA7",
  ];

  constructor() {
    this.log("constructor");
  }

  /**
   * Dynamic greeting based on current time of day.
   * Used in the template header.
   */
  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  }

  // ── Lifecycle Hooks ──

  ngOnChanges(changes: SimpleChanges): void {
    this.log(`ngOnChanges: ${Object.keys(changes).join(", ")}`);
  }

  ngOnInit(): void {
    this.log("ngOnInit");

    combineLatest([this.stats$, this.users$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.renderCount++;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.log("ngAfterViewInit");
    this.viewChildReady = !!this.debugPanel;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.log("ngOnDestroy");
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public API ──

  /** Creates a new medium-priority task with a random title */
  addQuickTask(): void {
    const titles = [
      "Review PRs",
      "Update docs",
      "Team sync",
      "Code review",
      "Deploy staging",
    ];
    this.taskService.createTask(
      titles[Math.floor(Math.random() * titles.length)],
      TaskPriority.MEDIUM,
    );
  }

  /**
   * Generates a consistent avatar background color based on user ID.
   * @param id - The user's unique identifier
   * @returns A hex color string from the predefined palette
   */
  getAvatarColor(id: string): string {
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  // ── Private Helpers ──

  /**
   * Logs a lifecycle hook or event with timestamp.
   * Keeps only the last 6 entries.
   * @param hook - Name of the hook or event
   */
  private log(hook: string): void {
    const entry = `${hook} @ ${new Date().toLocaleTimeString()}`;
    this.hookLog = [...this.hookLog.slice(-5), entry];
  }
}

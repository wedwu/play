// ============================================================
// DASHBOARD COMPONENT — ES6 Arrow Functions + Lifecycle Hooks
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
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
import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
} from "@angular/animations";

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
  animations: [
    trigger("fadeInUp", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate(
          "400ms cubic-bezier(0.35,0,0.25,1)",
          style({ opacity: 1, transform: "translateY(0)" }),
        ),
      ]),
    ]),
    trigger("staggerCards", [
      transition("* => *", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "translateY(16px)" }),
            stagger(80, [
              animate(
                "350ms ease-out",
                style({ opacity: 1, transform: "translateY(0)" }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
/**
 * Main dashboard page component.
 *
 * Displays aggregate task stats, urgent tasks, a mini kanban board overview,
 * and a team member list. Demonstrates all 8 Angular lifecycle hooks logged
 * in a real-time debug panel.
 */
export class DashboardComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  /** Reference to the lifecycle debug panel element. Bound in {@link ngAfterViewInit}. */
  @ViewChild("debugPanel") debugPanel!: ElementRef;
  /** Optional theme override passed from a parent. Triggers {@link ngOnChanges}. */
  @Input() theme?: string;

  readonly TaskStatus = TaskStatus;
  readonly urgentTasks$ = this.taskService.urgentTasks$;
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;
  readonly stats$ = this.taskService.totalStats$;
  readonly users$ = this.userService.items$;

  /** Kanban columns shown in the board overview card. */
  readonly statusCols = [
    { status: TaskStatus.TODO, label: "To Do", color: "#96CEB4" },
    { status: TaskStatus.IN_PROGRESS, label: "In Progress", color: "#45B7D1" },
    { status: TaskStatus.REVIEW, label: "Review", color: "#DDA0DD" },
  ];

  /** Timestamped lifecycle hook entries shown in the debug panel (capped at 6). */
  hookLog: string[] = [];
  /** Number of times `stats$` or `users$` has emitted since init. */
  renderCount = 0;
  /** `true` once {@link ngAfterViewInit} has confirmed `debugPanel` is bound. */
  viewChildReady = false;
  private readonly destroy$ = new Subject<void>();
  private readonly avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#DDA0DD",
    "#FFEAA7",
  ];

  constructor(
    public taskService: TaskService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {
    this.log("constructor");
  }

  /** Time-sensitive greeting: `'morning'`, `'afternoon'`, or `'evening'`. */
  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  }

  // ── Lifecycle hooks as arrow properties ──────
  ngOnChanges = (changes: SimpleChanges): void => {
    this.log("ngOnChanges: " + Object.keys(changes).join(", "));
  };

  ngOnInit = (): void => {
    this.log("ngOnInit");
    combineLatest([this.stats$, this.users$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.renderCount++;
        this.cdr.markForCheck();
      });
  };

  ngAfterViewInit = (): void => {
    this.log("ngAfterViewInit");
    this.viewChildReady = !!this.debugPanel;
    this.cdr.detectChanges();
  };

  ngOnDestroy = (): void => {
    this.log("ngOnDestroy");
    this.destroy$.next();
    this.destroy$.complete();
  };

  // ── Methods as arrow properties ───────────────

  /** Creates a medium-priority task with a randomly chosen title. */
  addQuickTask = (): void => {
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
  };

  /**
   * Derives a consistent avatar background colour from a user ID hash.
   * @param id - The user's unique ID.
   */
  getAvatarColor = (id: string): string => {
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  };

  /** Appends a timestamped hook name to `hookLog`, keeping only the last 6 entries. */
  private log = (hook: string): void => {
    const entry = `${hook} @ ${new Date().toLocaleTimeString()}`;
    this.hookLog = [...this.hookLog.slice(-5), entry];
  };
}

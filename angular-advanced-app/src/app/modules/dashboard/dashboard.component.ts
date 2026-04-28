// ============================================================
// DASHBOARD COMPONENT — ES6 Arrow Functions + Lifecycle Hooks
// ============================================================

import {
  Component, OnInit, OnDestroy, AfterViewInit, ViewChild,
  ElementRef, ChangeDetectionStrategy, ChangeDetectorRef,
  Input, OnChanges, SimpleChanges
} from '@angular/core';
import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { TaskStatus, TaskPriority } from '../../core/models/task.model';
import { RelativeTimePipe, PriorityLabelPipe, HoursPipe } from '../../shared/pipes/pipes';
import { RippleDirective, TooltipDirective } from '../../shared/directives/directives';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, CommonModule, NgClass, RouterLink, RelativeTimePipe, PriorityLabelPipe, HoursPipe, RippleDirective, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.35,0,0.25,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, [animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="dashboard">
      <header class="page-header" [@fadeInUp]>
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Good {{ greeting }}, Admin</p>
        </div>
        <button class="btn btn-primary" appRipple (click)="addQuickTask()">+ Quick Task</button>
      </header>

      @if (stats$ | async; as stats) {
        <div class="stats-grid" [@staggerCards]="stats">
          <div class="stat-card" [appTooltip]="'Total tasks in system'">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">Total Tasks</div>
            <div class="stat-bar"><div class="stat-fill" [style.width.%]="100" style="background:var(--accent)"></div></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#4ECDC4">{{ stats.done }}</div>
            <div class="stat-label">Completed</div>
            <div class="stat-bar"><div class="stat-fill" [style.width.%]="(stats.done / (stats.total || 1)) * 100" style="background:#4ECDC4"></div></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#45B7D1">{{ stats.inProgress }}</div>
            <div class="stat-label">In Progress</div>
            <div class="stat-bar"><div class="stat-fill" [style.width.%]="(stats.inProgress / (stats.total || 1)) * 100" style="background:#45B7D1"></div></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#FF6B6B">{{ stats.overdue }}</div>
            <div class="stat-label">Overdue</div>
            <div class="stat-bar"><div class="stat-fill" [style.width.%]="(stats.overdue / (stats.total || 1)) * 100" style="background:#FF6B6B"></div></div>
          </div>
        </div>
      }

      <div class="dashboard-grid">
        <section class="card" [@fadeInUp]>
          <header class="card-header">
            <h2>🚨 Urgent</h2>
            <a routerLink="/tasks" class="card-link">View all →</a>
          </header>
          @if (urgentTasks$ | async; as urgent) {
            @if (urgent.length === 0) {
              <p class="empty-state">No urgent tasks 🎉</p>
            } @else {
              @for (task of urgent; track task.id) {
                <div class="task-row urgent">
                  <div class="task-info">
                    <span class="task-title">{{ task.title }}</span>
                    <span class="task-meta">{{ task.priority | priorityLabel }} · {{ task.taskStatus }}</span>
                  </div>
                  <button class="btn btn-sm" appRipple
                    (click)="taskService.transitionTask(task.id, TaskStatus.IN_PROGRESS)">
                    Start
                  </button>
                </div>
              }
            }
          }
        </section>

        <section class="card" [@fadeInUp]>
          <header class="card-header"><h2>📋 Board Overview</h2></header>
          @if (tasksByStatus$ | async; as byStatus) {
            <div class="kanban-mini">
              @for (col of statusCols; track col.status) {
                <div class="kanban-col">
                  <div class="kanban-col-header">
                    <span class="kanban-dot" [style.background]="col.color"></span>
                    <span>{{ col.label }}</span>
                    <span class="kanban-count">{{ (byStatus[col.status] || []).length }}</span>
                  </div>
                  @for (task of (byStatus[col.status] || []).slice(0, 3); track task.id) {
                    <div class="kanban-card" [ngClass]="'priority-' + task.priority">{{ task.title }}</div>
                  }
                  @if ((byStatus[col.status] || []).length > 3) {
                    <div class="kanban-more">+{{ (byStatus[col.status] || []).length - 3 }} more</div>
                  }
                </div>
              }
            </div>
          }
        </section>

        <section class="card" [@fadeInUp]>
          <header class="card-header">
            <h2>👥 Team</h2>
            <a routerLink="/users" class="card-link">Manage →</a>
          </header>
          @if (users$ | async; as users) {
            <div class="team-list">
              @for (user of users.slice(0, 5); track user.id) {
                <div class="team-member">
                  <div class="member-avatar" [style.background]="getAvatarColor(user.id)">{{ user.initials }}</div>
                  <div class="member-info">
                    <span class="member-name">{{ user.fullName }}</span>
                    <span class="member-role">{{ user.role }} · {{ user.department }}</span>
                  </div>
                  <span class="member-skills" [appTooltip]="'Skills: ' + user.skills.join(', ')">
                    {{ user.skills.length }} skills
                  </span>
                </div>
              }
            </div>
          }
        </section>

        <section class="card card--debug" [@fadeInUp] #debugPanel>
          <header class="card-header"><h2>⚙️ Lifecycle Debug</h2></header>
          <div class="debug-list">
            @for (hook of hookLog; track hook) {
              <div class="debug-entry">{{ hook }}</div>
            }
          </div>
          <div class="debug-meta">Renders: {{ renderCount }} | ViewChild bound: {{ viewChildReady ? '✅' : '⏳' }}</div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; margin: 0; }
    .page-subtitle { color: var(--text-secondary); font-family: 'Space Mono', monospace; font-size: 0.8rem; margin: 0.25rem 0 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
    .stat-value { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.5rem; line-height: 1; }
    .stat-label { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.5rem; text-transform: uppercase; }
    .stat-bar { height: 3px; background: var(--border); border-radius: 2px; margin-top: 1rem; }
    .stat-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
    .card--debug { grid-column: 1 / -1; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-header h2 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin: 0; }
    .card-link { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--accent); text-decoration: none; }
    .task-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: 8px; background: var(--bg-elevated); margin-bottom: 0.5rem; }
    .task-row.urgent { border-left: 3px solid #FF6B6B; }
    .task-title { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.85rem; display: block; }
    .task-meta { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    .kanban-mini { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; }
    .kanban-col-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    .kanban-dot { width: 8px; height: 8px; border-radius: 50%; }
    .kanban-count { margin-left: auto; background: var(--bg-elevated); border-radius: 10px; padding: 1px 6px; font-size: 0.65rem; }
    .kanban-card { background: var(--bg-elevated); border-radius: 6px; padding: 0.5rem; font-size: 0.75rem; margin-bottom: 0.35rem; font-family: 'Space Mono', monospace; border-left: 2px solid var(--border); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .kanban-card.priority-4 { border-left-color: #FF6B6B; }
    .kanban-card.priority-3 { border-left-color: #FFEAA7; }
    .kanban-more { font-size: 0.65rem; color: var(--text-secondary); font-family: 'Space Mono', monospace; text-align: center; padding: 0.25rem; }
    .team-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .team-member { display: flex; align-items: center; gap: 0.75rem; }
    .member-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.75rem; color: #000; flex-shrink: 0; }
    .member-info { flex: 1; }
    .member-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.85rem; display: block; }
    .member-role { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    .member-skills { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--accent); cursor: help; }
    .debug-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
    .debug-entry { font-family: 'Space Mono', monospace; font-size: 0.7rem; background: var(--bg-elevated); border: 1px solid var(--accent); color: var(--accent); padding: 0.2rem 0.5rem; border-radius: 4px; }
    .debug-meta { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    .empty-state { color: var(--text-secondary); font-family: 'Space Mono', monospace; font-size: 0.8rem; text-align: center; padding: 1rem; }
    .btn { background: var(--accent); color: var(--bg-primary); border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; position: relative; overflow: hidden; }
    .btn-sm { padding: 0.3rem 0.75rem; font-size: 0.75rem; }
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .dashboard-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('debugPanel') debugPanel!: ElementRef;
  @Input() theme?: string;

  readonly TaskStatus    = TaskStatus;
  readonly urgentTasks$  = this.taskService.urgentTasks$;
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;
  readonly stats$        = this.taskService.totalStats$;
  readonly users$        = this.userService.items$;

  readonly statusCols = [
    { status: TaskStatus.TODO,        label: 'To Do',       color: '#96CEB4' },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress', color: '#45B7D1' },
    { status: TaskStatus.REVIEW,      label: 'Review',      color: '#DDA0DD' },
  ];

  hookLog: string[] = [];
  renderCount = 0;
  viewChildReady = false;
  private readonly destroy$ = new Subject<void>();
  private readonly avatarColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FFEAA7'];

  constructor(
    public taskService: TaskService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { this.log('constructor'); }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  // ── Lifecycle hooks as arrow properties ──────
  ngOnChanges = (changes: SimpleChanges): void => {
    this.log('ngOnChanges: ' + Object.keys(changes).join(', '));
  };

  ngOnInit = (): void => {
    this.log('ngOnInit');
    combineLatest([this.stats$, this.users$]).pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.renderCount++; this.cdr.markForCheck(); });
  };

  ngAfterViewInit = (): void => {
    this.log('ngAfterViewInit');
    this.viewChildReady = !!this.debugPanel;
    this.cdr.detectChanges();
  };

  ngOnDestroy = (): void => {
    this.log('ngOnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  };

  // ── Methods as arrow properties ───────────────
  addQuickTask = (): void => {
    const titles = ['Review PRs', 'Update docs', 'Team sync', 'Code review', 'Deploy staging'];
    this.taskService.createTask(titles[Math.floor(Math.random() * titles.length)], TaskPriority.MEDIUM);
  };

  getAvatarColor = (id: string): string => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  };

  private log = (hook: string): void => {
    const entry = `${hook} @ ${new Date().toLocaleTimeString()}`;
    this.hookLog = [...this.hookLog.slice(-5), entry];
  };
}

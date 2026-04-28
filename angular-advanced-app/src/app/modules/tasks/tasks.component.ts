// ============================================================
// TASKS COMPONENT
// Demonstrates: Forms, ChangeDetectionStrategy, ContentChild,
//               ng-template content projection, EventEmitter
// ============================================================

import {
  Component, OnInit, OnDestroy, AfterContentInit,
  ContentChild, TemplateRef, ChangeDetectionStrategy,
  ChangeDetectorRef, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef
} from '@angular/core';
import { CommonModule, NgClass, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { RelativeTimePipe, PriorityLabelPipe, HoursPipe, TruncatePipe } from '../../shared/pipes/pipes';
import { RippleDirective, TooltipDirective, AutoFocusDirective } from '../../shared/directives/directives';
import { trigger, transition, style, animate } from '@angular/animations';

type KanbanCol = { status: TaskStatus; label: string; color: string; icon: string };

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule, NgClass, AsyncPipe, FormsModule, ReactiveFormsModule,
    RelativeTimePipe, PriorityLabelPipe, HoursPipe, TruncatePipe,
    RippleDirective, TooltipDirective, AutoFocusDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="tasks-page">
      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          @if (stats$ | async; as s) {
            <p class="page-subtitle">{{ s.total }} tasks · {{ s.done }} done · {{ s.avgProgress }}% avg progress</p>
          }
        </div>
        <button class="btn btn-primary" appRipple (click)="openNewTaskModal()">+ New Task</button>
      </header>

      <!-- Toolbar -->
      <div class="toolbar" [@slideIn]>
        <input class="search-input" placeholder="🔍 Search tasks..."
               [(ngModel)]="searchQuery"
               (ngModelChange)="taskService.setQuery($event)"
               [appAutoFocus]="true"/>

        <select class="filter-select" [(ngModel)]="filterStatus"
                (ngModelChange)="taskService.setFilter('status', $event || null)">
          <option value="">All Statuses</option>
          @for (s of allStatuses; track s) {
            <option [value]="s">{{ s | titlecase }}</option>
          }
        </select>

        <select class="filter-select" [(ngModel)]="filterPriority"
                (ngModelChange)="taskService.setFilter('priority', $event || null)">
          <option value="">All Priorities</option>
          @for (p of allPriorities; track p.value) {
            <option [value]="p.value">{{ p.label }}</option>
          }
        </select>

        <div class="view-toggle">
          <button [class.active]="view === 'kanban'" appRipple (click)="view = 'kanban'">⬜ Kanban</button>
          <button [class.active]="view === 'list'"   appRipple (click)="view = 'list'">☰ List</button>
        </div>
      </div>

      <!-- Kanban Board -->
      @if (view === 'kanban') {
        @if (tasksByStatus$ | async; as byStatus) {
          <div class="kanban-board">
            @for (col of columns; track col.status) {
              <div class="kanban-col">
                <div class="col-header" [style.border-top-color]="col.color">
                  <span class="col-icon">{{ col.icon }}</span>
                  <span class="col-title">{{ col.label }}</span>
                  <span class="col-count" [style.background]="col.color">
                    {{ (byStatus[col.status] || []).length }}
                  </span>
                </div>

                <div class="col-cards">
                  @for (task of byStatus[col.status] || []; track task.id) {
                    <div class="task-card" [@cardIn]
                         [ngClass]="{ overdue: task.isOverdue, 'priority-urgent': task.priority === 4 }"
                         (click)="selectTask(task)">

                      <!-- Priority strip -->
                      <div class="priority-strip" [style.background]="priorityColor(task.priority)"></div>

                      <div class="card-body">
                        <h3 class="card-title">{{ task.title | truncate:60 }}</h3>

                        @if (task.tags.length) {
                          <div class="tag-list">
                            @for (tag of task.tags.slice(0, 3); track tag.label) {
                              <span class="tag" [style.background]="tag.color + '33'" [style.color]="tag.color">
                                {{ tag.label }}
                              </span>
                            }
                          </div>
                        }

                        @if (task.subtasks.length) {
                          <div class="progress-row">
                            <div class="progress-bar">
                              <div class="progress-fill" [style.width.%]="task.progress" [style.background]="col.color"></div>
                            </div>
                            <span class="progress-label">{{ task.completedSubtasks }}/{{ task.subtasks.length }}</span>
                          </div>
                        }

                        <div class="card-footer">
                          <span class="card-meta" [appTooltip]="'Created ' + task.createdAt">
                            {{ task.createdAt | relativeTime }}
                          </span>
                          @if (task.dueDate) {
                            <span class="due-date" [ngClass]="{ overdue: task.isOverdue }" [appTooltip]="'Due date'">
                              📅 {{ task.daysUntilDue }}d
                            </span>
                          }
                          @if (task.estimatedHours) {
                            <span class="hours" [appTooltip]="'Estimated hours'">
                              ⏱ {{ task.estimatedHours | hours }}
                            </span>
                          }
                        </div>

                        <!-- Transition buttons -->
                        @if (task.getAllowedTransitions().length) {
                          <div class="transition-btns">
                            @for (next of task.getAllowedTransitions().slice(0, 2); track next) {
                              <button class="btn-transition" appRipple
                                (click)="transition(task, next); $event.stopPropagation()">
                                → {{ next }}
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Add task to column -->
                  <button class="add-card-btn" (click)="openNewTaskModal(col.status)">
                    + Add task
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- List View -->
      @if (view === 'list') {
        @if (pagedTasks$ | async; as tasks) {
          <div class="task-list">
            <table class="data-table">
              <thead>
                <tr>
                  <th (click)="taskService.setSort('title')" class="sortable">Title</th>
                  <th (click)="taskService.setSort('priority')" class="sortable">Priority</th>
                  <th (click)="taskService.setSort('taskStatus')" class="sortable">Status</th>
                  <th (click)="taskService.setSort('dueDate')" class="sortable">Due</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (task of tasks; track task.id) {
                  <tr [@cardIn] [ngClass]="{ 'row--overdue': task.isOverdue }" (click)="selectTask(task)">
                    <td>
                      <div class="cell-title">{{ task.title }}</div>
                      @if (task.tags.length) {
                        <div class="cell-tags">
                          @for (tag of task.tags.slice(0,2); track tag.label) {
                            <span class="tag-sm" [style.color]="tag.color">{{ tag.label }}</span>
                          }
                        </div>
                      }
                    </td>
                    <td>
                      <span class="priority-badge" [ngClass]="'p' + task.priority">
                        {{ task.priority | priorityLabel }}
                      </span>
                    </td>
                    <td><span class="status-badge" [ngClass]="'s-' + task.taskStatus">{{ task.taskStatus }}</span></td>
                    <td>
                      @if (task.dueDate) {
                        <span [ngClass]="{ 'text-danger': task.isOverdue }">{{ task.dueDate | relativeTime }}</span>
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td>
                      <div class="mini-progress">
                        <div class="mini-fill" [style.width.%]="task.progress"></div>
                      </div>
                      <span class="mini-label">{{ task.progress }}%</span>
                    </td>
                    <td class="actions-cell" (click)="$event.stopPropagation()">
                      <button class="btn-icon" [appTooltip]="'Complete task'"
                        (click)="transition(task, TaskStatus.DONE)">✓</button>
                      <button class="btn-icon btn-icon--danger" [appTooltip]="'Delete task'"
                        (click)="deleteTask(task.id)">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- Task Detail Modal -->
      @if (selectedTask) {
        <div class="modal-backdrop" (click)="selectedTask = null">
          <div class="modal" [@cardIn] (click)="$event.stopPropagation()">
            <header class="modal-header">
              <div>
                <h2 class="modal-title">{{ selectedTask.title }}</h2>
                <div class="modal-meta">
                  <span class="priority-badge" [ngClass]="'p' + selectedTask.priority">
                    {{ selectedTask.priority | priorityLabel }}
                  </span>
                  <span class="status-badge" [ngClass]="'s-' + selectedTask.taskStatus">
                    {{ selectedTask.taskStatus }}
                  </span>
                </div>
              </div>
              <button class="modal-close" (click)="selectedTask = null">✕</button>
            </header>

            <div class="modal-body">
              <p class="modal-desc">{{ selectedTask.description || 'No description.' }}</p>

              @if (selectedTask.subtasks.length) {
                <div class="subtask-section">
                  <h3>Subtasks ({{ selectedTask.completedSubtasks }}/{{ selectedTask.subtasks.length }})</h3>
                  @for (sub of selectedTask.subtasks; track sub.id) {
                    <label class="subtask-item">
                      <input type="checkbox" [checked]="sub.done"
                        (change)="toggleSubtask(selectedTask.id, sub.id)"/>
                      <span [ngClass]="{ done: sub.done }">{{ sub.title }}</span>
                    </label>
                  }
                </div>
              }

              @if (selectedTask.comments.length) {
                <div class="comments-section">
                  <h3>Comments</h3>
                  @for (c of selectedTask.comments; track c.id) {
                    <div class="comment">
                      <strong>{{ c.authorId }}</strong>
                      <p>{{ c.content }}</p>
                      <small>{{ c.createdAt | relativeTime }}</small>
                    </div>
                  }
                </div>
              }

              <div class="detail-grid">
                @if (selectedTask.estimatedHours) {
                  <div class="detail-item">
                    <label>Estimated</label>
                    <span>{{ selectedTask.estimatedHours | hours }}</span>
                  </div>
                }
                <div class="detail-item">
                  <label>Logged</label>
                  <span>{{ selectedTask.loggedHours | hours }}</span>
                </div>
                <div class="detail-item">
                  <label>Created</label>
                  <span>{{ selectedTask.createdAt | relativeTime }}</span>
                </div>
                <div class="detail-item">
                  <label>Progress</label>
                  <span>{{ selectedTask.progress }}%</span>
                </div>
              </div>

              <!-- Transitions -->
              <div class="modal-actions">
                @for (next of selectedTask.getAllowedTransitions(); track next) {
                  <button class="btn" appRipple (click)="transition(selectedTask, next)">→ {{ next }}</button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- New Task Modal -->
      @if (showNewTaskModal) {
        <div class="modal-backdrop" (click)="showNewTaskModal = false">
          <div class="modal modal--sm" [@cardIn] (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2 class="modal-title">New Task</h2>
              <button class="modal-close" (click)="showNewTaskModal = false">✕</button>
            </header>
            <div class="modal-body">
              <form [formGroup]="taskForm" (ngSubmit)="submitNewTask()">
                <div class="form-group">
                  <label>Title *</label>
                  <input formControlName="title" placeholder="Task title..." [appAutoFocus]="true"/>
                  @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
                    <span class="error">Title must be at least 3 characters</span>
                  }
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea formControlName="description" rows="3" placeholder="Optional description..."></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Priority</label>
                    <select formControlName="priority">
                      @for (p of allPriorities; track p.value) {
                        <option [value]="p.value">{{ p.label }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" formControlName="dueDate"/>
                  </div>
                </div>
                <div class="form-group">
                  <label>Estimate (hours)</label>
                  <input type="number" formControlName="estimatedHours" min="0" step="0.5"/>
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn btn-ghost" (click)="showNewTaskModal = false">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="taskForm.invalid" appRipple>
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tasks-page { max-width: 1400px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; margin: 0; }
    .page-subtitle { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--text-secondary); margin: 0.25rem 0 0; }

    .toolbar { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .search-input, .filter-select {
      background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-primary);
      border-radius: 8px; padding: 0.6rem 1rem; font-family: 'Space Mono', monospace; font-size: 0.8rem;
      outline: none;
      &:focus { border-color: var(--accent); }
    }
    .search-input { flex: 1; min-width: 200px; }
    .view-toggle { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .view-toggle button {
      background: var(--bg-secondary); border: none; color: var(--text-secondary); padding: 0.6rem 1rem;
      font-family: 'Space Mono', monospace; font-size: 0.75rem; cursor: pointer; position: relative; overflow: hidden;
      &.active { background: var(--accent); color: var(--bg-primary); }
    }

    /* Kanban */
    .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; align-items: flex-start; }
    .kanban-col { min-width: 260px; max-width: 300px; background: var(--bg-secondary); border-radius: 12px; padding: 1rem; flex-shrink: 0; }
    .col-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-top: 3px solid; border-radius: 4px 4px 0 0; padding-top: 0.75rem; margin-top: -0.25rem; }
    .col-icon { font-size: 1rem; }
    .col-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; flex: 1; }
    .col-count { font-family: 'Space Mono', monospace; font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; color: #000; font-weight: 700; }
    .col-cards { display: flex; flex-direction: column; gap: 0.6rem; }

    .task-card {
      background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px;
      cursor: pointer; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; position: relative;
      display: flex;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
      &.overdue { border-color: #FF6B6B44; }
    }
    .priority-strip { width: 3px; flex-shrink: 0; }
    .card-body { flex: 1; padding: 0.75rem; }
    .card-title { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.82rem; margin: 0 0 0.5rem; line-height: 1.3; }
    .tag-list { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .tag { font-family: 'Space Mono', monospace; font-size: 0.6rem; padding: 1px 6px; border-radius: 3px; }
    .progress-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .progress-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; }
    .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
    .progress-label { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); white-space: nowrap; }
    .card-footer { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .card-meta, .due-date, .hours { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); }
    .due-date.overdue { color: #FF6B6B; }
    .transition-btns { display: flex; gap: 0.3rem; margin-top: 0.5rem; flex-wrap: wrap; }
    .btn-transition {
      background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: 4px; padding: 0.2rem 0.5rem; font-family: 'Space Mono', monospace; font-size: 0.6rem;
      cursor: pointer; position: relative; overflow: hidden;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }
    .add-card-btn {
      background: none; border: 1px dashed var(--border); color: var(--text-secondary); border-radius: 8px;
      padding: 0.5rem; width: 100%; font-family: 'Space Mono', monospace; font-size: 0.75rem;
      cursor: pointer; transition: all 0.2s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    /* List / Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td {
      padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border);
      font-family: 'Space Mono', monospace; font-size: 0.78rem;
    }
    .data-table th { color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; cursor: pointer; background: var(--bg-secondary); }
    .data-table tr { cursor: pointer; transition: background 0.15s; }
    .data-table tr:hover td { background: var(--bg-hover); }
    .row--overdue td { border-left: 3px solid #FF6B6B; }
    .cell-title { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.85rem; color: var(--text-primary); }
    .cell-tags { display: flex; gap: 0.25rem; margin-top: 0.2rem; }
    .tag-sm { font-family: 'Space Mono', monospace; font-size: 0.6rem; }
    .mini-progress { height: 4px; background: var(--border); border-radius: 2px; width: 80px; display: inline-block; vertical-align: middle; }
    .mini-fill { height: 100%; background: var(--accent); border-radius: 2px; }
    .mini-label { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); margin-left: 0.5rem; }

    /* Badges */
    .priority-badge, .status-badge {
      font-family: 'Space Mono', monospace; font-size: 0.65rem; padding: 2px 8px; border-radius: 4px;
      text-transform: uppercase; font-weight: 700;
    }
    .p4 { background: #FF6B6B22; color: #FF6B6B; }
    .p3 { background: #FFEAA722; color: #FFEAA7; }
    .p2 { background: #4ECDC422; color: #4ECDC4; }
    .p1 { background: #96CEB422; color: #96CEB4; }
    .s-done        { background: #4ECDC422; color: #4ECDC4; }
    .s-in_progress { background: #45B7D122; color: #45B7D1; }
    .s-blocked     { background: #FF6B6B22; color: #FF6B6B; }
    .s-todo        { background: #96CEB422; color: #96CEB4; }
    .s-review      { background: #DDA0DD22; color: #DDA0DD; }
    .s-backlog     { background: #aaa2; color: #aaa; }

    .actions-cell { display: flex; gap: 0.4rem; align-items: center; }
    .btn-icon {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px;
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 0.8rem; color: var(--text-secondary); transition: all 0.15s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }
    .btn-icon--danger:hover { border-color: #FF6B6B; color: #FF6B6B; }

    /* Modals */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px;
      width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto;
    }
    .modal--sm { max-width: 480px; }
    .modal-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 1.5rem 1.5rem 0; position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;
    }
    .modal-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.25rem; margin: 0 0 0.5rem; }
    .modal-meta { display: flex; gap: 0.5rem; }
    .modal-close {
      background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 0.8rem; flex-shrink: 0;
    }
    .modal-body { padding: 1.25rem 1.5rem 1.5rem; }
    .modal-desc { color: var(--text-secondary); font-family: 'Space Mono', monospace; font-size: 0.8rem; line-height: 1.6; }
    .modal-actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; flex-wrap: wrap; }

    .subtask-section h3, .comments-section h3 { font-family: 'Syne', sans-serif; font-size: 0.9rem; margin: 1rem 0 0.5rem; }
    .subtask-item { display: flex; gap: 0.5rem; align-items: center; padding: 0.35rem 0; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 0.8rem; }
    .subtask-item input { cursor: pointer; }
    .subtask-item span.done { text-decoration: line-through; opacity: 0.5; }
    .comment { background: var(--bg-elevated); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; }
    .comment p { margin: 0.25rem 0; font-family: 'Space Mono', monospace; font-size: 0.8rem; }
    .comment small { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1rem; }
    .detail-item { background: var(--bg-elevated); border-radius: 8px; padding: 0.75rem; }
    .detail-item label { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); display: block; text-transform: uppercase; margin-bottom: 0.25rem; }
    .detail-item span { font-family: 'Syne', sans-serif; font-weight: 600; }

    /* Form */
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
    .form-group input, .form-group select, .form-group textarea {
      background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary);
      border-radius: 8px; padding: 0.65rem 0.9rem; font-family: 'Space Mono', monospace; font-size: 0.8rem; outline: none;
      &:focus { border-color: var(--accent); }
    }
    .form-group textarea { resize: vertical; }
    .error { color: #FF6B6B; font-family: 'Space Mono', monospace; font-size: 0.7rem; }

    .btn { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); border-radius: 8px; padding: 0.6rem 1.25rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: opacity 0.2s; position: relative; overflow: hidden; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: var(--accent); color: var(--bg-primary); border-color: var(--accent); }
    .btn-ghost { background: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .text-danger { color: #FF6B6B; }
    .text-muted { color: var(--text-secondary); }
    .sortable { cursor: pointer; user-select: none; &:hover { color: var(--accent); } }
  `]
})
export class TasksComponent implements OnInit, AfterContentInit, OnDestroy {
  // Content projection demo
  @ContentChild(TemplateRef) customRowTemplate?: TemplateRef<unknown>;
  @ViewChildren('taskRow') taskRows!: QueryList<ElementRef>;

  readonly TaskStatus = TaskStatus;
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;
  readonly pagedTasks$ = this.taskService.pagedItems$;
  readonly stats$ = this.taskService.totalStats$;

  view: 'kanban' | 'list' = 'kanban';
  selectedTask: Task | null = null;
  showNewTaskModal = false;
  searchQuery = '';
  filterStatus = '';
  filterPriority: number | '' = '';

  taskForm!: FormGroup;
  private preSelectedStatus?: TaskStatus;
  private destroy$ = new Subject<void>();

  readonly columns: KanbanCol[] = [
    { status: TaskStatus.BACKLOG,     label: 'Backlog',      color: '#666',    icon: '📥' },
    { status: TaskStatus.TODO,        label: 'To Do',        color: '#96CEB4', icon: '📋' },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress',  color: '#45B7D1', icon: '🔄' },
    { status: TaskStatus.REVIEW,      label: 'Review',       color: '#DDA0DD', icon: '👀' },
    { status: TaskStatus.BLOCKED,     label: 'Blocked',      color: '#FF6B6B', icon: '🚫' },
    { status: TaskStatus.DONE,        label: 'Done',         color: '#4ECDC4', icon: '✅' },
  ];

  readonly allStatuses = Object.values(TaskStatus);
  readonly allPriorities = [
    { value: TaskPriority.LOW,    label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH,   label: 'High' },
    { value: TaskPriority.URGENT, label: 'Urgent' },
  ];

  constructor(
    public taskService: TaskService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit = (): void => {
    this.taskForm = this.fb.group({
      title:          ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description:    [''],
      priority:       [TaskPriority.MEDIUM],
      dueDate:        [''],
      estimatedHours: [null, [Validators.min(0)]],
    });

    this.taskService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngAfterContentInit = (): void => {
    console.log('[TasksComponent] ngAfterContentInit — custom template:', !!this.customRowTemplate);
  }

  selectTask = (task: Task): void => {
    this.selectedTask = task.clone();
    this.selectedTask = task; // reference for mutations
  }

  transition = (task: Task, newStatus: TaskStatus): void => {
    this.taskService.transitionTask(task.id, newStatus);
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = { ...this.selectedTask, taskStatus: newStatus } as Task;
    }
  }

  deleteTask = (id: string): void => {
    this.taskService.remove(id);
  }

  toggleSubtask = (taskId: string, subId: string): void => {
    const task = this.taskService.getById(taskId);
    if (task) {
      task.toggleSubtask(subId);
      this.taskService.update(taskId, task as Partial<Task>);
    }
  }

  openNewTaskModal = (preStatus?: TaskStatus): void => {
    this.preSelectedStatus = preStatus;
    this.taskForm.reset({ priority: TaskPriority.MEDIUM });
    this.showNewTaskModal = true;
  }

  submitNewTask = (): void => {
    if (this.taskForm.invalid) return;
    const { title, description, priority, dueDate, estimatedHours } = this.taskForm.value;
    const task = this.taskService.createTask(title, priority);
    if (description) task.description = description;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (this.preSelectedStatus) task.taskStatus = this.preSelectedStatus;
    this.taskService.update(task.id, task as Partial<Task>);
    this.showNewTaskModal = false;
  }

  priorityColor = (p: TaskPriority): string => {
    return { 1: '#96CEB4', 2: '#4ECDC4', 3: '#FFEAA7', 4: '#FF6B6B' }[p] ?? '#666';
  }

  ngOnDestroy = (): void => {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

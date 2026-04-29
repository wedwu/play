// ============================================================
// TASKS COMPONENT
// Demonstrates: Forms, ChangeDetectionStrategy, ContentChild,
//               ng-template content projection, EventEmitter
// ============================================================

import {
  Component, OnInit, OnDestroy, AfterContentInit,
  ContentChild, TemplateRef, ChangeDetectionStrategy,
  ChangeDetectorRef, ViewChildren, QueryList, ElementRef
} from '@angular/core';
import { CommonModule, NgClass, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { RelativeTimePipe, PriorityLabelPipe, HoursPipe, TruncatePipe } from '../../shared/pipes/pipes';
import { RippleDirective, TooltipDirective, AutoFocusDirective } from '../../shared/directives/directives';
import { trigger, transition, style, animate } from '@angular/animations';

/** Shape of a single kanban board column definition. */
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
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
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
    { status: TaskStatus.BACKLOG,     label: 'Backlog',      color: '#666',    icon: 'inbox'      },
    { status: TaskStatus.TODO,        label: 'To Do',        color: '#96CEB4', icon: 'list_alt'   },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress',  color: '#45B7D1', icon: 'autorenew'  },
    { status: TaskStatus.REVIEW,      label: 'Review',       color: '#DDA0DD', icon: 'visibility' },
    { status: TaskStatus.BLOCKED,     label: 'Blocked',      color: '#FF6B6B', icon: 'block'      },
    { status: TaskStatus.DONE,        label: 'Done',         color: '#4ECDC4', icon: 'task_alt'   },
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

// ============================================================
// TASKS COMPONENT
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  AfterContentInit,
  ContentChild,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  ElementRef,
  inject,
} from "@angular/core";

import { CommonModule, NgClass, AsyncPipe } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { TaskService } from "../../core/services/task.service";
import { Task, TaskStatus, TaskPriority } from "../../core/models/task.model";

import {
  RelativeTimePipe,
  PriorityLabelPipe,
  HoursPipe,
  TruncatePipe,
} from "../../shared/pipes/pipes";

import {
  RippleDirective,
  TooltipDirective,
  AutoFocusDirective,
} from "../../shared/directives/directives";

import { trigger, transition, style, animate } from "@angular/animations";

/** Shape of a single kanban board column definition. */
export interface KanbanCol {
  status: TaskStatus;
  label: string;
  color: string;
  icon: string;
};

/**
 * Tasks management component.
 *
 * Provides a dual-view (Kanban + List) interface for tasks with full CRUD operations,
 * advanced filtering, search, and a modal form for creating new tasks.
 *
 * Demonstrates content projection, reactive forms, OnPush change detection,
 * and custom directives/pipes.
 */
@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    RelativeTimePipe,
    PriorityLabelPipe,
    HoursPipe,
    TruncatePipe,
    RippleDirective,
    TooltipDirective,
    AutoFocusDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("cardIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "scale(0.95)" }),
        animate("250ms ease-out", style({ opacity: 1, transform: "scale(1)" })),
      ]),
      transition(":leave", [
        animate(
          "200ms ease-in",
          style({ opacity: 0, transform: "scale(0.95)" }),
        ),
      ]),
    ]),
    trigger("slideIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(-12px)" }),
        animate(
          "300ms ease-out",
          style({ opacity: 1, transform: "translateY(0)" }),
        ),
      ]),
    ]),
  ],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.scss",
})
export class TasksComponent implements OnInit, AfterContentInit, OnDestroy {
  // ── Content Projection & View Queries ──

  /** Custom row template projected from parent component (demo) */
  @ContentChild(TemplateRef) customRowTemplate?: TemplateRef<unknown>;

  /** Query list of all task row elements */
  @ViewChildren("taskRow") taskRows!: QueryList<ElementRef>;

  // ── Injected Dependencies ──

  /** Task service – public because it’s used directly in the template */
  readonly taskService = inject(TaskService);

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Public Readonly Observables ──

  /** Enum reference for use in the template */
  readonly TaskStatus = TaskStatus;

  /** Tasks grouped by status (used by Kanban view) */
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;

  /** Paged tasks for list view */
  readonly pagedTasks$ = this.taskService.pagedItems$;

  /** Aggregate statistics */
  readonly stats$ = this.taskService.totalStats$;

  // ── Component State ──

  /** Current view mode: Kanban board or list */
  view: "kanban" | "list" = "kanban";

  /** Currently selected task (always a clone to avoid mutating list items) */
  selectedTask: Task | null = null;

  /** Controls visibility of the “New Task” modal */
  showNewTaskModal = false;

  /** Search term for filtering tasks */
  searchQuery = "";

  /** Status filter value */
  filterStatus = "";

  /** Priority filter value */
  filterPriority: number | "" = "";

  /** Reactive form for creating new tasks */
  taskForm!: FormGroup;

  /** Status to pre-select when opening the new task modal */
  private preSelectedStatus?: TaskStatus;

  /** Subject used for automatic unsubscription */
  private readonly destroy$ = new Subject<void>();

  /** Kanban column definitions */
  readonly columns: KanbanCol[] = [
    {
      status: TaskStatus.BACKLOG,
      label: "Backlog",
      color: "#666",
      icon: "inbox",
    },
    {
      status: TaskStatus.TODO,
      label: "To Do",
      color: "#96CEB4",
      icon: "list_alt",
    },
    {
      status: TaskStatus.IN_PROGRESS,
      label: "In Progress",
      color: "#45B7D1",
      icon: "autorenew",
    },
    {
      status: TaskStatus.REVIEW,
      label: "Review",
      color: "#DDA0DD",
      icon: "visibility",
    },
    {
      status: TaskStatus.BLOCKED,
      label: "Blocked",
      color: "#FF6B6B",
      icon: "block",
    },
    {
      status: TaskStatus.DONE,
      label: "Done",
      color: "#4ECDC4",
      icon: "task_alt",
    },
  ];

  /** All available task statuses */
  readonly allStatuses = Object.values(TaskStatus);

  /** All priority options */
  readonly allPriorities = [
    { value: TaskPriority.LOW, label: "Low" },
    { value: TaskPriority.MEDIUM, label: "Medium" },
    { value: TaskPriority.HIGH, label: "High" },
    { value: TaskPriority.URGENT, label: "Urgent" },
  ];

  // ── Lifecycle Hooks ──

  ngOnInit(): void {
    this.taskForm = this.fb.group({
      title: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200),
        ],
      ],
      description: [""],
      priority: [TaskPriority.MEDIUM],
      dueDate: [""],
      estimatedHours: [null, [Validators.min(0)]],
    });

    this.taskService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngAfterContentInit(): void {
    console.log(
      "[TasksComponent] ngAfterContentInit — custom template:",
      !!this.customRowTemplate,
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public Methods ──

  /** Selects a task by creating a clone (prevents accidental mutation of list items) */
  selectTask(task: Task): void {
    this.selectedTask = task.clone
      ? task.clone()
      : (structuredClone(task) as Task);
  }

  /** Transitions a task to a new status and keeps the selected task in sync */
  transition(task: Task, newStatus: TaskStatus): void {
    this.taskService.transitionTask(task.id, newStatus);

    // Update selected task immediately if it’s the same one being edited
    if (this.selectedTask?.id === task.id) {
      const updated = this.selectedTask.clone
        ? this.selectedTask.clone()
        : (structuredClone(this.selectedTask) as Task);
      updated.taskStatus = newStatus;
      this.selectedTask = updated;
    }
  }

  /** Deletes a task by ID */
  deleteTask(id: string): void {
    this.taskService.remove(id);
  }

  /** Toggles a subtask’s completed state */
  toggleSubtask(taskId: string, subId: string): void {
    const task = this.taskService.getById(taskId);
    if (task) {
      task.toggleSubtask(subId);
      this.taskService.update(taskId, task as Partial<Task>);
    }
  }

  /** Opens the new task modal (optionally pre-selecting a status) */
  openNewTaskModal(preStatus?: TaskStatus): void {
    this.preSelectedStatus = preStatus;
    this.taskForm.reset({ priority: TaskPriority.MEDIUM });
    this.showNewTaskModal = true;
  }

  /** Submits the new task form */
  submitNewTask(): void {
    if (this.taskForm.invalid) return;

    const { title, description, priority, dueDate, estimatedHours } =
      this.taskForm.value;

    const task = this.taskService.createTask(title, priority);

    if (description) task.description = description;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (estimatedHours !== null) task.estimatedHours = estimatedHours;
    if (this.preSelectedStatus) task.taskStatus = this.preSelectedStatus;

    this.taskService.update(task.id, task as Partial<Task>);
    this.showNewTaskModal = false;
  }

  /** Returns background color for a given priority */
  priorityColor(p: TaskPriority): string {
    const colors: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: "#96CEB4",
      [TaskPriority.MEDIUM]: "#4ECDC4",
      [TaskPriority.HIGH]: "#FFEAA7",
      [TaskPriority.URGENT]: "#FF6B6B",
    };
    return colors[p] ?? "#666";
  }
}

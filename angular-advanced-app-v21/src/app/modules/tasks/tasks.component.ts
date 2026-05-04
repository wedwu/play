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

/** Shape of a single kanban board column definition. */
export interface KanbanCol {
  status: TaskStatus;
  label: string;
  color: string;
  icon: string;
}

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

  /** Enum reference for use in the template
   *
   * In Angular/TypeScript, an enum defines a set of named constants for type-safe values that can be referenced directly in templates after exposing it from the component class.
   * By declaring `readonly TaskStatus = TaskStatus;` in the component, we create a public property that references the `TaskStatus` enum. This allows us to use `TaskStatus` values directly in the component's template for comparisons, bindings, and display logic without needing to import the enum separately in the template context.
   * For example, in the template we can write:
   * ```html
   * <div *ngFor="let task of pagedTasks$ | async">
   *   <span [ngClass]="{'urgent': task.taskStatus === TaskStatus.URGENT}">
   */
  readonly TaskStatus = TaskStatus;

  /** Tasks grouped by status (used by Kanban view) */
  readonly tasksByStatus$ = this.taskService.tasksByStatus$;

  /** Paged tasks for list view
   *
   * In Angular/TypeScript, pagedTasks$ is a readonly observable property (using the $ suffix convention) that aliases a service’s paged data stream for efficient, reactive list-view rendering with pagination support.
   *
   * By defining `readonly pagedTasks$ = this.taskService.pagedItems$;` in the component, we create a public observable that emits only the current page of tasks after filtering and sorting. This allows us to subscribe to `pagedTasks$` in the template using the async pipe, ensuring that the list view only renders the relevant subset of tasks for the current pagination state, improving performance and user experience.
   * For example, in the template we can write:
   * ```html
   * <div *ngFor="let task of pagedTasks$ | async">
   *   {{ task.title }}
   * </div>
   */
  readonly pagedTasks$ = this.taskService.pagedItems$;

  /** Aggregate statistics
   *
   * In Angular/TypeScript, aggregate statistics compute summary values (sum, average, count, min/max, etc.) from an array of data objects, typically using native array methods like reduce in the component or a custom pipe for template reuse.
   *
   * By defining `readonly stats$ = this.taskService.totalStats$;` in the component, we create a public observable that emits computed aggregate statistics about the tasks, such as total count, counts by status, average progress, etc. This allows us to subscribe to `stats$` in the template using the async pipe and display these summary values without needing to manually compute them in the template or subscribe to the raw task list.
   * For example, in the template we can write:
   * ```html
   * <div>Total Tasks: {{ (stats$ | async)?.total }}</div>
   * <div>Done: {{ (stats$ | async)?.done }}</div>
   * <div>In Progress: {{ (stats$ | async)?.inProgress }}</div>
   * <div>Blocked: {{ (stats$ | async)?.blocked }}</div>
   * <div>Overdue: {{ (stats$ | async)?.overdue }}</div>
   * <div>Average Progress: {{ (stats$ | async)?.avgProgress }}%</div>
   * ```
   * This approach keeps the template clean and focused on presentation, while the component handles the logic of computing the aggregate statistics from the underlying task data.
   *
   */
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

    /** Subscribe to task updates and trigger change detection
     * In Angular/TypeScript, this line subscribes to an observable stream (items$) from a service, automatically triggers manual change detection via ChangeDetectorRef.markForCheck() on every emission (useful for OnPush strategy), and safely unsubscribes using takeUntil with a destroy subject to prevent memory leaks.
     *
     * By subscribing to `this.taskService.items$` and using `takeUntil(this.destroy$)`, we ensure that the subscription is automatically cleaned up when the component is destroyed, preventing potential memory leaks. The `this.cdr.markForCheck()` call inside the subscription callback forces Angular to check for changes and update the view whenever a new value is emitted from `items$`, which is essential when using OnPush change detection strategy to ensure the UI stays in sync with the latest data.
     */

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

  /** Transitions a task to a new status and keeps the selected task in sync
   * In TypeScript, void is a return type used on functions (or methods) to explicitly declare that they perform side effects or actions but return no value (implicitly returning undefined).
   *
   * By declaring `transition(task: Task, newStatus: TaskStatus): void`, we indicate that this method will perform an action (transitioning the task to a new status) without returning any data. This is a common pattern for event handlers or methods that modify state without needing to provide feedback through a return value. The method updates the task's status via the service and also ensures that if the transitioned task is currently selected, the selectedTask reference is updated to reflect the new status, keeping the UI in sync with the underlying data changes.
   *
   */
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
    this.taskService.deleteTask(id);
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

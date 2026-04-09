import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';

type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: Array<{ id: string; name: string; color: string }>;
  assignee?: { id: string; name: string; avatarUrl?: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  taskCount: number;
  members: Array<{ id: string; name: string; avatarUrl?: string }>;
  tasks: { edges: Array<{ node: Task }> };
}

const STATUS_COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog', TODO: 'Todo', IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review', DONE: 'Done', CANCELLED: 'Cancelled',
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  URGENT: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E',
};

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col" *ngIf="project() as p; else loading">
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</a>
          <span class="text-gray-300">/</span>
          <h1 class="font-bold text-gray-900">{{ p.name }}</h1>
        </div>
        <p *ngIf="p.description" class="text-sm text-gray-500 mt-1">{{ p.description }}</p>
      </header>

      <div class="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
        <div class="flex -space-x-2">
          <img *ngFor="let m of p.members.slice(0, 4)"
            [src]="m.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=' + m.name"
            [alt]="m.name" [title]="m.name" class="w-8 h-8 rounded-full border-2 border-white" />
        </div>
        <span class="text-sm text-gray-500">{{ p.taskCount }} tasks</span>
        <div class="ml-auto">
          <button (click)="showForm.set(true)"
            class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Add Task
          </button>
        </div>
      </div>

      <div *ngIf="showForm()" class="bg-indigo-50 border-b border-indigo-200 px-6 py-4">
        <form (ngSubmit)="createTask(p.id)" class="flex items-start gap-3 flex-wrap">
          <input [(ngModel)]="newTitle" name="title" required placeholder="Task title"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48" autofocus />
          <select [(ngModel)]="newPriority" name="priority"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
          </select>
          <div class="flex gap-2">
            <button type="submit" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Create</button>
            <button type="button" (click)="showForm.set(false)" class="text-gray-500 px-3 py-2 text-sm">Cancel</button>
          </div>
        </form>
      </div>

      <main class="flex-1 p-6 overflow-auto">
        <div *ngIf="liveUpdate()" class="mb-4 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
          Live update: {{ liveUpdate() }}
        </div>

        <div class="flex gap-4 overflow-x-auto pb-4">
          <div *ngFor="let status of columns" class="flex-shrink-0 w-72">
            <div class="rounded-xl p-3 bg-gray-100">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700">{{ statusLabel(status) }}</h3>
                <span class="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium">
                  {{ tasksForStatus(p, status).length }}
                </span>
              </div>
              <div class="space-y-2">
                <div *ngFor="let task of tasksForStatus(p, status)"
                  class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-sm font-medium text-gray-900">{{ task.title }}</h4>
                    <span class="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded"
                      [style.color]="priorityColor(task.priority)"
                      [style.background-color]="priorityColor(task.priority) + '20'">
                      {{ task.priority }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span *ngFor="let tag of task.tags"
                      class="text-xs px-2 py-0.5 rounded-full text-white"
                      [style.background-color]="tag.color">
                      {{ tag.name }}
                    </span>
                  </div>
                  <div class="mt-3 flex items-center justify-between">
                    <span class="text-xs text-gray-400">
                      {{ task.assignee?.name ?? 'Unassigned' }}
                    </span>
                    <button *ngIf="!['DONE', 'CANCELLED'].includes(task.status)"
                      (click)="advanceTask(task)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Move →
                    </button>
                  </div>
                </div>
                <p *ngIf="tasksForStatus(p, status).length === 0"
                  class="text-xs text-gray-400 text-center py-6">No tasks</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <ng-template #loading>
      <div class="flex items-center justify-center h-screen text-gray-400">Loading...</div>
    </ng-template>
  `,
})
export class ProjectComponent implements OnInit, OnDestroy {
  project = signal<Project | null>(null);
  showForm = signal(false);
  liveUpdate = signal<string | null>(null);
  newTitle = '';
  newPriority: TaskPriority = 'MEDIUM';
  priorities: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  columns = STATUS_COLUMNS;

  private subs: Subscription[] = [];

  constructor(private route: ActivatedRoute, private taskService: TaskService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.subs.push(
      this.taskService.getProject(id).subscribe((p) => this.project.set(p))
    );

    this.subs.push(
      this.taskService.subscribeToTaskUpdates(id).subscribe((payload) => {
        if (payload) {
          this.liveUpdate.set(`"${payload.task.title}" updated by ${payload.updatedBy.name}`);
          setTimeout(() => this.liveUpdate.set(null), 4000);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  tasksForStatus(project: Project, status: TaskStatus): Task[] {
    return project.tasks.edges.map((e) => e.node).filter((t) => t.status === status);
  }

  statusLabel(status: TaskStatus): string {
    return STATUS_LABELS[status];
  }

  priorityColor(priority: TaskPriority): string {
    return PRIORITY_COLORS[priority];
  }

  createTask(projectId: string) {
    this.taskService.createTask({ title: this.newTitle, projectId, priority: this.newPriority }).subscribe(() => {
      this.newTitle = '';
      this.showForm.set(false);
    });
  }

  advanceTask(task: Task) {
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const idx = order.indexOf(task.status);
    if (idx < order.length - 1) {
      this.taskService.updateTask(task.id, { status: order[idx + 1] }).subscribe();
    }
  }
}

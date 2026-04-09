import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PROJECTS_QUERY } from '../../graphql/queries';
import { CREATE_PROJECT_MUTATION } from '../../graphql/mutations';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  taskCount: number;
  members: Array<{ id: string; name: string; avatarUrl?: string }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">TaskFlow <span class="text-xs text-indigo-600 font-normal ml-1">Angular</span></h1>
        <div class="flex items-center gap-4" *ngIf="user()">
          <span class="text-sm text-gray-600">
            {{ user()!.name }}
            <span class="text-xs text-gray-400 ml-1">({{ user()!.role }})</span>
          </span>
          <button (click)="logout()" class="text-sm text-red-600 hover:text-red-800">Sign out</button>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Projects</h2>
            <p class="text-gray-500 text-sm mt-1">{{ totalCount() }} total</p>
          </div>
          <button (click)="showForm.set(true)"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + New Project
          </button>
        </div>

        <form *ngIf="showForm()" (ngSubmit)="createProject()"
          class="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h3 class="font-semibold text-gray-900">New Project</h3>
          <input [(ngModel)]="newName" name="name" required placeholder="Project name"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autofocus />
          <textarea [(ngModel)]="newDesc" name="desc" placeholder="Description (optional)" rows="2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
          <div class="flex gap-2">
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
            <button type="button" (click)="showForm.set(false)" class="text-gray-500 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>

        <div *ngIf="loading()" class="text-center py-12 text-gray-400">Loading projects...</div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a *ngFor="let project of projects()" [routerLink]="['/projects', project.id]"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block">
            <div class="flex items-start justify-between">
              <h3 class="font-semibold text-gray-900">{{ project.name }}</h3>
              <span [class]="project.status === 'ACTIVE'
                ? 'text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700'
                : 'text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600'">
                {{ project.status }}
              </span>
            </div>
            <p *ngIf="project.description" class="text-sm text-gray-500 mt-2 line-clamp-2">
              {{ project.description }}
            </p>
            <div class="mt-4 flex items-center justify-between">
              <div class="flex -space-x-2">
                <img *ngFor="let m of project.members.slice(0, 4)"
                  [src]="m.avatarUrl ?? 'https://api.dicebear.com/7.x/initials/svg?seed=' + m.name"
                  [alt]="m.name" [title]="m.name"
                  class="w-7 h-7 rounded-full border-2 border-white" />
              </div>
              <span class="text-xs text-gray-500">{{ project.taskCount }} tasks</span>
            </div>
          </a>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  user = this.authService.user;
  projects = signal<Project[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  showForm = signal(false);
  newName = '';
  newDesc = '';
  private endCursor: string | null = null;

  constructor(private authService: AuthService, private apollo: Apollo) {}

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.apollo
      .watchQuery({ query: PROJECTS_QUERY, variables: { first: 12 } })
      .valueChanges.pipe(map((r: any) => r.data?.projects))
      .subscribe((conn) => {
        if (!conn) return;
        this.projects.set(conn.edges.map((e: any) => e.node));
        this.totalCount.set(conn.totalCount);
        this.endCursor = conn.pageInfo.endCursor ?? null;
        this.loading.set(false);
      });
  }

  createProject() {
    this.apollo
      .mutate({
        mutation: CREATE_PROJECT_MUTATION,
        variables: { input: { name: this.newName, description: this.newDesc } },
        refetchQueries: ['Projects'],
      })
      .subscribe(() => {
        this.newName = '';
        this.newDesc = '';
        this.showForm.set(false);
      });
  }

  logout() {
    this.authService.logout();
  }
}

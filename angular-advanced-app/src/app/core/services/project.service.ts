// ============================================================
// PROJECT SERVICE — ES6 Arrow Functions
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Project, ProjectPhase } from '../models/project.model';
import { EntityStateService, FilterState, SortState } from './entity-state.service';
import { Task } from '../models/task.model';
import { sortBy } from '../helpers/utils.helper';

/**
 * State service for {@link Project} entities.
 *
 * Extends {@link EntityStateService} with project-specific derived streams and
 * business operations. Pre-populated with demo seed data on construction.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService extends EntityStateService<Project> {
  /** Live stream of projects currently in the `'active'` phase. */
  readonly activeProjects$: Observable<Project[]> = this.items$.pipe(
    map(ps => ps.filter(p => p.phase === 'active'))
  );

  /**
   * Count of projects in each traffic-light health bucket.
   * Recalculates whenever the project list changes.
   * @see {@link Project.health}
   */
  readonly healthSummary$ = this.items$.pipe(
    map(projects => ({
      green:  projects.filter(p => p.health === 'green').length,
      yellow: projects.filter(p => p.health === 'yellow').length,
      red:    projects.filter(p => p.health === 'red').length,
    }))
  );

  constructor() {
    super();
    this.seedProjects();
  }

  /**
   * Creates a new `'product'` project, adds it to state, and returns it.
   * @param name - Project display name.
   * @param description - Project description.
   * @param ownerId - ID of the user who owns this project.
   */
  createProject = (name: string, description: string, ownerId: string): Project => {
    const p = new Project(name, description, ownerId, 'product', 'system');
    this.add(p);
    return p;
  };

  /**
   * Adds a task to an existing project and persists the update in state.
   * No-ops silently when `projectId` does not match any stored project.
   * @param projectId - ID of the target project.
   * @param task - The task to associate with the project.
   */
  addTaskToProject = (projectId: string, task: Task): void => {
    const project = this.getById(projectId);
    if (project) {
      project.addTask(task);
      this.update(projectId, project as Partial<Project>);
    }
  };

  protected override applyFilterAndSort = (
    items: Project[], filter: FilterState, sort: SortState<Project>
  ): Project[] => {
    let result = [...items];
    if (filter['query']) {
      const q = (filter['query'] as string).toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (filter['phase']) result = result.filter(p => p.phase === filter['phase'] as ProjectPhase);
    return sort.field
      ? sortBy(result, p => String(p[sort.field as keyof Project] ?? ''), sort.direction)
      : sortBy(result, p => p.updatedAt.getTime(), 'desc');
  };

  private seedProjects = (): void => {
    const p1 = new Project('Nexus Platform', 'Core product rebuild with new architecture', 'u1', 'product', 'system');
    p1.phase = 'active';
    p1.addMember('u2'); p1.addMember('u3');
    p1.addMilestone('Alpha Release', new Date(Date.now() + 86400000 * 14));
    p1.addMilestone('Beta Launch',   new Date(Date.now() + 86400000 * 45));

    const p2 = new Project('DevOps Revamp', 'Modernize CI/CD and infrastructure', 'u2', 'infrastructure', 'system');
    p2.phase = 'active'; p2.addMember('u1');

    const p3 = new Project('Mobile App', 'React Native companion app', 'u3', 'product', 'system');
    p3.phase = 'planning';

    this.addMany([p1, p2, p3]);
  };
}

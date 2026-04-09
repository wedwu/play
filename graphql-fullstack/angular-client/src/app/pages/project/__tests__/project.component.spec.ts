import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ProjectComponent } from '../project.component';
import { TaskService } from '../../../services/task.service';

const mockUser = { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'ADMIN', avatarUrl: null };
const makeTask = (overrides: any = {}) => ({
  id: 'task-1',
  title: 'Default task',
  status: 'TODO',
  priority: 'MEDIUM',
  tags: [],
  assignee: null,
  ...overrides,
});
const makeProject = (tasks: any[] = [makeTask()]) => ({
  id: 'proj-1',
  name: 'TaskFlow Platform',
  description: 'Core platform',
  status: 'ACTIVE',
  taskCount: tasks.length,
  owner: mockUser,
  members: [mockUser],
  createdAt: '2026-01-01T00:00:00.000Z',
  tasks: {
    edges: tasks.map((t, i) => ({ cursor: `c${i}`, node: t })),
  },
});

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let taskService: jasmine.SpyObj<TaskService>;
  let projectSubject: Subject<any>;
  let subscriptionSubject: Subject<any>;

  beforeEach(async () => {
    projectSubject = new Subject();
    subscriptionSubject = new Subject();

    taskService = jasmine.createSpyObj('TaskService', [
      'getProject',
      'createTask',
      'updateTask',
      'subscribeToTaskUpdates',
    ]);
    taskService.getProject.and.returnValue(projectSubject.asObservable());
    taskService.subscribeToTaskUpdates.and.returnValue(subscriptionSubject.asObservable());
    taskService.createTask.and.returnValue(of(makeTask()));
    taskService.updateTask.and.returnValue(of(makeTask()));

    await TestBed.configureTestingModule({
      imports: [ProjectComponent, RouterTestingModule],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'proj-1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function emitProject(tasks: any[] = [makeTask()]) {
    projectSubject.next(makeProject(tasks));
    fixture.detectChanges();
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  it('calls getProject with the route id', () => {
    expect(taskService.getProject).toHaveBeenCalledWith('proj-1');
  });

  it('calls subscribeToTaskUpdates with the route id', () => {
    expect(taskService.subscribeToTaskUpdates).toHaveBeenCalledWith('proj-1');
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('shows loading template before data arrives', () => {
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('shows project name once data arrives', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TaskFlow Platform');
  }));

  it('renders all five Kanban columns', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Backlog');
    expect(text).toContain('Todo');
    expect(text).toContain('In Progress');
    expect(text).toContain('In Review');
    expect(text).toContain('Done');
  }));

  it('places task in the correct column', fakeAsync(() => {
    emitProject([makeTask({ title: 'In Review task', status: 'IN_REVIEW' })]);
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('In Review task');
  }));

  it('shows task count badge per column', fakeAsync(() => {
    const tasks = [
      makeTask({ id: 't1', status: 'TODO' }),
      makeTask({ id: 't2', status: 'TODO' }),
    ];
    emitProject(tasks);
    tick();
    fixture.detectChanges();

    // Two tasks in Todo column
    const badges = fixture.debugElement
      .queryAll(By.css('.rounded-xl'))
      .map((el) => el.query(By.css('.rounded-full')))
      .filter(Boolean)
      .map((el) => el!.nativeElement.textContent.trim());

    expect(badges).toContain('2');
  }));

  // ─── Add task form ─────────────────────────────────────────────────────────

  it('hides add task form initially', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();
    expect(component.showForm()).toBeFalse();
  }));

  it('shows form on "+ Add Task" click', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();

    const addBtn = fixture.debugElement.queryAll(By.css('button'))
      .find((el) => el.nativeElement.textContent.includes('Add Task'));
    addBtn!.nativeElement.click();
    fixture.detectChanges();

    expect(component.showForm()).toBeTrue();
    expect(fixture.debugElement.query(By.css('input[name="title"]'))).toBeTruthy();
  }));

  it('calls createTask with title and projectId', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();

    component.showForm.set(true);
    fixture.detectChanges();

    component.newTitle = 'My new task';
    component.createTask('proj-1');
    tick();

    expect(taskService.createTask).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'My new task', projectId: 'proj-1' })
    );
    expect(component.showForm()).toBeFalse();
  }));

  it('resets title after task creation', fakeAsync(() => {
    emitProject();
    tick();

    component.newTitle = 'Task to reset';
    component.createTask('proj-1');
    tick();

    expect(component.newTitle).toBe('');
  }));

  // ─── Status advancement ────────────────────────────────────────────────────

  it('advances task to next status', fakeAsync(() => {
    emitProject();
    tick();

    const task = makeTask({ status: 'TODO' });
    component.advanceTask(task);
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith(
      task.id,
      { status: 'IN_PROGRESS' }
    );
  }));

  it('does not advance a DONE task', fakeAsync(() => {
    emitProject();
    tick();

    component.advanceTask(makeTask({ status: 'DONE' }));
    tick();

    expect(taskService.updateTask).not.toHaveBeenCalled();
  }));

  // ─── Live subscription banner ──────────────────────────────────────────────

  it('shows live update banner when subscription fires', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();

    subscriptionSubject.next({
      task: makeTask({ title: 'Updated title' }),
      updatedBy: { name: 'Bob' },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Updated title');
    expect(fixture.nativeElement.textContent).toContain('Bob');
  }));

  it('clears live update banner after 4 seconds', fakeAsync(() => {
    emitProject();
    tick();
    fixture.detectChanges();

    subscriptionSubject.next({
      task: makeTask({ title: 'Temp update' }),
      updatedBy: { name: 'Bob' },
    });
    fixture.detectChanges();
    expect(component.liveUpdate()).not.toBeNull();

    tick(4000);
    fixture.detectChanges();
    expect(component.liveUpdate()).toBeNull();
  }));

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  it('unsubscribes from all observables on destroy', () => {
    const unsubSpy = spyOn<any>(component['subs'][0], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });
});

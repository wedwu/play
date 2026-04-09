import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { signal } from '@angular/core';
import { DashboardComponent } from '../dashboard.component';
import { AuthService } from '../../../services/auth.service';
import { PROJECTS_QUERY } from '../../../graphql/queries';
import { CREATE_PROJECT_MUTATION } from '../../../graphql/mutations';

const mockUser = { id: 'u1', name: 'Alice Admin', email: 'a@a.com', role: 'ADMIN', avatarUrl: null };
const mockProject = {
  id: 'proj-1',
  name: 'TaskFlow Platform',
  description: 'Core platform',
  status: 'ACTIVE',
  taskCount: 5,
  owner: mockUser,
  members: [mockUser],
  createdAt: '2026-01-01T00:00:00.000Z',
  __typename: 'Project',
};

const projectsResponse = {
  projects: {
    edges: [{ cursor: 'c1', node: mockProject, __typename: 'ProjectEdge' }],
    pageInfo: { hasNextPage: false, endCursor: null, __typename: 'PageInfo' },
    totalCount: 1,
    __typename: 'ProjectConnection',
  },
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let controller: ApolloTestingController;
  let authService: any;

  beforeEach(async () => {
    authService = { user: signal(mockUser), logout: jasmine.createSpy('logout') };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, ApolloTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(ApolloTestingController);
    fixture.detectChanges();
  });

  afterEach(() => controller.verify());

  function flushProjects(data = projectsResponse) {
    const op = controller.expectOne(PROJECTS_QUERY);
    op.flushData(data);
    fixture.detectChanges();
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders the header with "TaskFlow"', () => {
    flushProjects();
    const header = fixture.debugElement.query(By.css('header'));
    expect(header.nativeElement.textContent).toContain('TaskFlow');
  });

  it('shows authenticated user name in header', () => {
    flushProjects();
    expect(fixture.nativeElement.textContent).toContain('Alice Admin');
  });

  it('shows user role next to name', () => {
    flushProjects();
    expect(fixture.nativeElement.textContent).toContain('ADMIN');
  });

  it('renders project cards after data loads', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TaskFlow Platform');
  }));

  it('shows total count', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 total');
  }));

  it('shows task count on each project card', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('5 tasks');
  }));

  it('shows ACTIVE status badge', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ACTIVE');
  }));

  // ─── New project form ──────────────────────────────────────────────────────

  it('hides new project form initially', () => {
    flushProjects();
    expect(component.showForm()).toBe(false);
    expect(fixture.debugElement.query(By.css('input[name="name"]'))).toBeNull();
  });

  it('shows form on "+ New Project" click', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();

    const btn = fixture.debugElement.queryAll(By.css('button'))
      .find((el) => el.nativeElement.textContent.includes('New Project'));
    btn!.nativeElement.click();
    fixture.detectChanges();

    expect(component.showForm()).toBe(true);
    expect(fixture.debugElement.query(By.css('input[name="name"]'))).toBeTruthy();
  }));

  it('hides form when Cancel is clicked', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();

    component.showForm.set(true);
    fixture.detectChanges();

    const cancelBtn = fixture.debugElement.queryAll(By.css('button'))
      .find((el) => el.nativeElement.textContent.trim() === 'Cancel');
    cancelBtn!.nativeElement.click();
    fixture.detectChanges();

    expect(component.showForm()).toBe(false);
  }));

  it('calls createProject with input values', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();

    component.showForm.set(true);
    component.newName = 'My New Project';
    component.newDesc = 'A description';
    fixture.detectChanges();

    component.createProject();

    const mutation = controller.expectOne(CREATE_PROJECT_MUTATION);
    expect(mutation.operation.variables).toEqual({
      input: { name: 'My New Project', description: 'A description' },
    });

    mutation.flushData({ createProject: { ...mockProject, name: 'My New Project' } });
    // refetch
    controller.expectOne(PROJECTS_QUERY).flushData(projectsResponse);
    tick();
    fixture.detectChanges();

    expect(component.showForm()).toBe(false);
  }));

  // ─── Logout ────────────────────────────────────────────────────────────────

  it('calls AuthService.logout when Sign out is clicked', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();

    const logoutBtn = fixture.debugElement.queryAll(By.css('button'))
      .find((el) => el.nativeElement.textContent.includes('Sign out'));
    logoutBtn!.nativeElement.click();

    expect(authService.logout).toHaveBeenCalled();
  }));

  // ─── Pagination ────────────────────────────────────────────────────────────

  it('does not show "Load more" when hasNextPage is false', fakeAsync(() => {
    flushProjects();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Load more');
  }));
});

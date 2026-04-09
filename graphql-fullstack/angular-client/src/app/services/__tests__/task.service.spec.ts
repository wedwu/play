import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { TaskService } from '../task.service';
import { PROJECT_QUERY, TASK_UPDATED_SUBSCRIPTION } from '../../graphql/queries';
import {
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  ADD_COMMENT_MUTATION,
} from '../../graphql/mutations';

const mockUser = { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'ADMIN', avatarUrl: null, __typename: 'User' };
const mockTask = {
  id: 'task-1',
  title: 'Test task',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: null,
  estimatedHours: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  assignee: null,
  reporter: mockUser,
  tags: [],
  __typename: 'Task',
};
const mockProject = {
  id: 'proj-1',
  name: 'TaskFlow',
  description: null,
  status: 'ACTIVE',
  taskCount: 1,
  owner: mockUser,
  members: [mockUser],
  createdAt: '2026-01-01T00:00:00.000Z',
  __typename: 'Project',
  tasks: {
    edges: [{ cursor: 'c1', node: mockTask, __typename: 'TaskEdge' }],
    pageInfo: { hasNextPage: false, endCursor: null, __typename: 'PageInfo' },
    totalCount: 1,
    __typename: 'TaskConnection',
  },
};

describe('TaskService', () => {
  let service: TaskService;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [TaskService],
    });
    service = TestBed.inject(TaskService);
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => controller.verify());

  // ─── getProject() ──────────────────────────────────────────────────────────

  describe('getProject()', () => {
    it('emits project data from PROJECT_QUERY', fakeAsync(() => {
      let result: any;
      service.getProject('proj-1').subscribe((p) => (result = p));

      const op = controller.expectOne(PROJECT_QUERY);
      expect(op.operation.variables).toEqual({ id: 'proj-1', first: 100 });
      op.flushData({ project: mockProject });
      tick();

      expect(result.id).toBe('proj-1');
      expect(result.name).toBe('TaskFlow');
    }));

    it('passes custom `first` argument', fakeAsync(() => {
      service.getProject('proj-1', 50).subscribe();
      const op = controller.expectOne(PROJECT_QUERY);
      expect(op.operation.variables['first']).toBe(50);
      op.flushData({ project: mockProject });
      tick();
    }));

    it('emits tasks nested under the project', fakeAsync(() => {
      let project: any;
      service.getProject('proj-1').subscribe((p) => (project = p));
      const op = controller.expectOne(PROJECT_QUERY);
      op.flushData({ project: mockProject });
      tick();

      const tasks = project.tasks.edges.map((e: any) => e.node);
      expect(tasks[0].title).toBe('Test task');
    }));
  });

  // ─── createTask() ──────────────────────────────────────────────────────────

  describe('createTask()', () => {
    it('sends correct variables to CREATE_TASK_MUTATION', fakeAsync(() => {
      service.createTask({ title: 'New task', projectId: 'proj-1', priority: 'HIGH' }).subscribe();
      const op = controller.expectOne(CREATE_TASK_MUTATION);

      expect(op.operation.variables).toEqual({
        input: { title: 'New task', projectId: 'proj-1', priority: 'HIGH' },
      });

      op.flushData({ createTask: { ...mockTask, title: 'New task' } });
      tick();
    }));

    it('emits the created task', fakeAsync(() => {
      let created: any;
      service.createTask({ title: 'New task', projectId: 'proj-1' }).subscribe((t) => (created = t));
      const op = controller.expectOne(CREATE_TASK_MUTATION);
      op.flushData({ createTask: { ...mockTask, title: 'New task' } });
      tick();

      expect(created.title).toBe('New task');
    }));

    it('defaults priority to undefined when not provided', fakeAsync(() => {
      service.createTask({ title: 'No priority', projectId: 'proj-1' }).subscribe();
      const op = controller.expectOne(CREATE_TASK_MUTATION);

      expect(op.operation.variables['input']['priority']).toBeUndefined();
      op.flushData({ createTask: mockTask });
      tick();
    }));
  });

  // ─── updateTask() ──────────────────────────────────────────────────────────

  describe('updateTask()', () => {
    it('sends id and input to UPDATE_TASK_MUTATION', fakeAsync(() => {
      service.updateTask('task-1', { status: 'IN_PROGRESS' }).subscribe();
      const op = controller.expectOne(UPDATE_TASK_MUTATION);

      expect(op.operation.variables).toEqual({
        id: 'task-1',
        input: { status: 'IN_PROGRESS' },
      });

      op.flushData({ updateTask: { ...mockTask, status: 'IN_PROGRESS' } });
      tick();
    }));

    it('emits the updated task', fakeAsync(() => {
      let updated: any;
      service.updateTask('task-1', { status: 'DONE' }).subscribe((t) => (updated = t));
      const op = controller.expectOne(UPDATE_TASK_MUTATION);
      op.flushData({ updateTask: { ...mockTask, status: 'DONE' } });
      tick();

      expect(updated.status).toBe('DONE');
    }));

    it('can update multiple fields at once', fakeAsync(() => {
      service.updateTask('task-1', { status: 'DONE', priority: 'LOW', title: 'Updated' }).subscribe();
      const op = controller.expectOne(UPDATE_TASK_MUTATION);

      expect(op.operation.variables['input']).toEqual({
        status: 'DONE', priority: 'LOW', title: 'Updated',
      });

      op.flushData({ updateTask: mockTask });
      tick();
    }));
  });

  // ─── deleteTask() ──────────────────────────────────────────────────────────

  describe('deleteTask()', () => {
    it('sends correct id to DELETE_TASK_MUTATION', fakeAsync(() => {
      service.deleteTask('task-1').subscribe();
      const op = controller.expectOne(DELETE_TASK_MUTATION);

      expect(op.operation.variables).toEqual({ id: 'task-1' });
      op.flushData({ deleteTask: true });
      tick();
    }));

    it('emits true on success', fakeAsync(() => {
      let result: any;
      service.deleteTask('task-1').subscribe((r) => (result = r));
      const op = controller.expectOne(DELETE_TASK_MUTATION);
      op.flushData({ deleteTask: true });
      tick();

      expect(result).toBe(true);
    }));
  });

  // ─── addComment() ──────────────────────────────────────────────────────────

  describe('addComment()', () => {
    it('sends taskId and content to ADD_COMMENT_MUTATION', fakeAsync(() => {
      service.addComment('task-1', 'Great work!').subscribe();
      const op = controller.expectOne(ADD_COMMENT_MUTATION);

      expect(op.operation.variables).toEqual({ taskId: 'task-1', content: 'Great work!' });
      op.flushData({
        addComment: { id: 'c1', content: 'Great work!', createdAt: '2026-01-01', author: mockUser },
      });
      tick();
    }));

    it('emits the created comment', fakeAsync(() => {
      let comment: any;
      service.addComment('task-1', 'LGTM').subscribe((c) => (comment = c));
      const op = controller.expectOne(ADD_COMMENT_MUTATION);
      op.flushData({
        addComment: { id: 'c2', content: 'LGTM', createdAt: '2026-01-01', author: mockUser },
      });
      tick();

      expect(comment.content).toBe('LGTM');
      expect(comment.author.name).toBe('Alice');
    }));
  });

  // ─── subscribeToTaskUpdates() ──────────────────────────────────────────────

  describe('subscribeToTaskUpdates()', () => {
    it('subscribes to TASK_UPDATED_SUBSCRIPTION with projectId', fakeAsync(() => {
      let payload: any;
      service.subscribeToTaskUpdates('proj-1').subscribe((p) => (payload = p));

      const op = controller.expectOne(TASK_UPDATED_SUBSCRIPTION);
      expect(op.operation.variables).toEqual({ projectId: 'proj-1' });

      op.flush({
        data: { taskUpdated: { task: mockTask, updatedBy: mockUser } },
      });
      tick();

      expect(payload.task.title).toBe('Test task');
      expect(payload.updatedBy.name).toBe('Alice');
    }));

    it('emits each subscription event as it arrives', fakeAsync(() => {
      const payloads: any[] = [];
      service.subscribeToTaskUpdates('proj-1').subscribe((p) => payloads.push(p));

      const op = controller.expectOne(TASK_UPDATED_SUBSCRIPTION);

      op.flush({ data: { taskUpdated: { task: { ...mockTask, title: 'First update' }, updatedBy: mockUser } } });
      tick();
      op.flush({ data: { taskUpdated: { task: { ...mockTask, title: 'Second update' }, updatedBy: mockUser } } });
      tick();

      expect(payloads).toHaveLength(2);
      expect(payloads[0].task.title).toBe('First update');
      expect(payloads[1].task.title).toBe('Second update');
    }));
  });
});

/**
 * ProjectViewPage — unit tests.
 * Apollo hooks and react-router params mocked so no provider is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mockTask, mockProjectWithTasks, mockTag } from '../test/mocks';

// ─── Mock state ───────────────────────────────────────────────────────────────
let projectData: ReturnType<typeof mockProjectWithTasks> | null = mockProjectWithTasks();
let projectLoading = false;
const mockCreateTask  = vi.fn();
const mockUpdateTask  = vi.fn();
const mockTags        = [mockTag];

const { mockUseSubscription } = vi.hoisted(() => ({
  mockUseSubscription: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    useQuery: vi.fn((doc: any) => {
      const name = doc?.definitions?.[0]?.name?.value ?? '';
      if (name === 'Tags') return { data: { tags: mockTags }, loading: false };
      return {
        data: projectData ? { project: projectData } : undefined,
        loading: projectLoading,
      };
    }),
    useMutation: vi.fn((doc: any) => {
      const name = doc?.definitions?.[0]?.name?.value ?? '';
      if (name === 'CreateTask') return [mockCreateTask, { loading: false }];
      return [mockUpdateTask, { loading: false }];
    }),
    useSubscription: mockUseSubscription,
  };
});

import { ProjectViewPage } from '../pages/ProjectView';

function renderProject(projectId = 'proj-1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectViewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  projectData = mockProjectWithTasks();
  projectLoading = false;
  vi.clearAllMocks();
  mockCreateTask.mockResolvedValue({ data: { createTask: mockTask() } });
  mockUpdateTask.mockResolvedValue({ data: { updateTask: mockTask() } });
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('ProjectViewPage', () => {
  describe('rendering', () => {
    it('shows loading state initially', () => {
      projectLoading = true;
      projectData = null;
      renderProject();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the project name', () => {
      renderProject();
      expect(screen.getByText('TaskFlow Platform')).toBeInTheDocument();
    });

    it('shows the dashboard back link', () => {
      renderProject();
      expect(screen.getByText('← Dashboard')).toBeInTheDocument();
    });

    it('shows task count in the sub-header', () => {
      renderProject();
      expect(screen.getByText('3 tasks')).toBeInTheDocument();
    });

    it('renders member avatars', () => {
      renderProject();
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    it('shows "Project not found" for null project', () => {
      projectData = null;
      projectLoading = false;
      renderProject();
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });

    it('renders tasks in the kanban board', () => {
      projectData = mockProjectWithTasks([mockTask({ title: 'My test task', status: 'IN_PROGRESS' })]);
      renderProject();
      expect(screen.getByText('My test task')).toBeInTheDocument();
    });
  });

  describe('add task form', () => {
    it('hides the form initially', () => {
      renderProject();
      expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument();
    });

    it('shows the form when "+ Add Task" is clicked', () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    it('hides the form when Cancel is clicked', () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument();
    });

    it('calls createTask with correct projectId', async () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      fireEvent.change(screen.getByPlaceholderText('Task title'), {
        target: { value: 'New task' },
      });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => expect(mockCreateTask).toHaveBeenCalled());
      const vars = mockCreateTask.mock.calls[0][0].variables.input;
      expect(vars.projectId).toBe('proj-1');
      expect(vars.title).toBe('New task');
    });

    it('renders priority select in the form', () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders tag selection buttons in the form', () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      // Tags appear as buttons in the form; getAllByText handles duplicate tag labels in the board
      const tagButtons = screen.getAllByRole('button', { name: 'Frontend' });
      expect(tagButtons.length).toBeGreaterThan(0);
    });

    it('closes form after successful creation', async () => {
      renderProject();
      fireEvent.click(screen.getByText('+ Add Task'));
      fireEvent.change(screen.getByPlaceholderText('Task title'), {
        target: { value: 'Created task' },
      });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() =>
        expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument()
      );
    });
  });

  describe('task detail drawer', () => {
    beforeEach(() => {
      projectData = mockProjectWithTasks([mockTask({ title: 'Clickable task', status: 'IN_PROGRESS' })]);
    });

    it('opens the drawer when a task card is clicked', () => {
      renderProject();
      fireEvent.click(screen.getByText('Clickable task'));
      // Title appears twice: in the board card and in the drawer header
      expect(screen.getAllByText('Clickable task').length).toBeGreaterThan(1);
    });

    it('shows task status in the drawer', () => {
      renderProject();
      fireEvent.click(screen.getByText('Clickable task'));
      // Status shown in drawer detail
      expect(screen.getAllByText(/IN_PROGRESS/).length).toBeGreaterThan(0);
    });

    it('closes drawer when backdrop is clicked', async () => {
      renderProject();
      fireEvent.click(screen.getByText('Clickable task'));
      // Click the backdrop overlay (the fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
      fireEvent.click(backdrop);
      await waitFor(() =>
        expect(screen.getAllByText('Clickable task').length).toBe(1)
      );
    });

    it('closes drawer when × is clicked', async () => {
      renderProject();
      fireEvent.click(screen.getByText('Clickable task'));
      fireEvent.click(screen.getByText('×'));
      await waitFor(() =>
        expect(screen.getAllByText('Clickable task').length).toBe(1)
      );
    });
  });

  describe('subscriptions', () => {
    it('subscribes to task updates with the project id', () => {
      renderProject('proj-42');
      const projectIds = mockUseSubscription.mock.calls.map(
        (call: unknown[]) => (call[1] as any)?.variables?.projectId
      );
      expect(projectIds).toContain('proj-42');
    });
  });
});

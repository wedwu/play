/**
 * DashboardPage — unit tests.
 * Apollo hooks mocked at module level; useAuth stubbed via its module.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockUser, mockProject, mockProjectsConnection } from '../test/mocks';

// ─── Mock state ───────────────────────────────────────────────────────────────
let projectsData: ReturnType<typeof mockProjectsConnection> | null = mockProjectsConnection();
let projectsLoading = false;
const mockCreateProject = vi.fn();
const mockFetchMore    = vi.fn();

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: projectsData ? { projects: projectsData } : undefined,
      loading: projectsLoading,
      fetchMore: mockFetchMore,
    })),
    useMutation: vi.fn(() => [mockCreateProject, { loading: false }]),
  };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));

import { DashboardPage } from '../pages/Dashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  projectsData = mockProjectsConnection();
  projectsLoading = false;
  vi.clearAllMocks();
  mockCreateProject.mockResolvedValue({ data: { createProject: mockProject() } });
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('DashboardPage', () => {
  describe('rendering', () => {
    it('renders the TaskFlow header', () => {
      renderDashboard();
      expect(screen.getByText('TaskFlow')).toBeInTheDocument();
    });

    it('shows the authenticated user name', () => {
      renderDashboard();
      expect(screen.getByText(/Alice Admin/)).toBeInTheDocument();
    });

    it('shows the user role', () => {
      renderDashboard();
      expect(screen.getByText(/ADMIN/)).toBeInTheDocument();
    });

    it('shows total project count', () => {
      renderDashboard();
      expect(screen.getByText('1 total')).toBeInTheDocument();
    });

    it('renders a project card for each project', () => {
      renderDashboard();
      expect(screen.getByText('TaskFlow Platform')).toBeInTheDocument();
    });

    it('shows project description on the card', () => {
      renderDashboard();
      expect(screen.getByText('The core platform')).toBeInTheDocument();
    });

    it('shows task count on each card', () => {
      renderDashboard();
      expect(screen.getByText('3 tasks')).toBeInTheDocument();
    });

    it('shows ACTIVE status badge', () => {
      renderDashboard();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('renders member avatars', () => {
      renderDashboard();
      expect(screen.getByAltText(mockUser.name)).toBeInTheDocument();
    });

    it('shows loading state while fetching', () => {
      projectsLoading = true;
      projectsData = null;
      renderDashboard();
      expect(screen.getByText(/Loading projects/)).toBeInTheDocument();
    });
  });

  describe('new project form', () => {
    it('hides form initially', () => {
      renderDashboard();
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument();
    });

    it('shows form when "+ New Project" is clicked', () => {
      renderDashboard();
      fireEvent.click(screen.getByText('+ New Project'));
      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
    });

    it('hides form when Cancel is clicked', () => {
      renderDashboard();
      fireEvent.click(screen.getByText('+ New Project'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument();
    });

    it('calls createProject mutation with input values', async () => {
      renderDashboard();
      fireEvent.click(screen.getByText('+ New Project'));
      fireEvent.change(screen.getByPlaceholderText('Project name'), {
        target: { value: 'My New Project' },
      });
      fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
        target: { value: 'A description' },
      });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => expect(mockCreateProject).toHaveBeenCalled());
    });

    it('closes form after successful creation', async () => {
      renderDashboard();
      fireEvent.click(screen.getByText('+ New Project'));
      fireEvent.change(screen.getByPlaceholderText('Project name'), {
        target: { value: 'New Project' },
      });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() =>
        expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument()
      );
    });
  });

  describe('pagination', () => {
    it('hides "Load more" when hasNextPage is false', () => {
      projectsData = mockProjectsConnection([mockProject()], false);
      renderDashboard();
      expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    });

    it('shows "Load more" when hasNextPage is true', () => {
      projectsData = mockProjectsConnection([mockProject()], true);
      renderDashboard();
      expect(screen.getByText('Load more')).toBeInTheDocument();
    });

    it('calls fetchMore when "Load more" is clicked', () => {
      projectsData = mockProjectsConnection([mockProject()], true);
      renderDashboard();
      fireEvent.click(screen.getByText('Load more'));
      expect(mockFetchMore).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows 0 total when no projects', () => {
      projectsData = mockProjectsConnection([], false);
      renderDashboard();
      expect(screen.getByText('0 total')).toBeInTheDocument();
    });
  });
});

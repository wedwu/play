/**
 * TaskBoard — unit tests.
 * Apollo hooks mocked so no provider or network is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { mockTask } from '../test/mocks';
import type { Task } from '../types';

const { mockUseSubscription } = vi.hoisted(() => ({
  mockUseSubscription: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    useSubscription: mockUseSubscription,
    useMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  };
});

import { TaskBoard } from '../components/TaskBoard';

beforeEach(() => vi.clearAllMocks());

function renderBoard(tasks: Task[], projectId = 'proj-1') {
  const onTaskSelect = vi.fn();
  render(<TaskBoard projectId={projectId} tasks={tasks} onTaskSelect={onTaskSelect} />);
  return { onTaskSelect };
}

describe('TaskBoard', () => {
  describe('column rendering', () => {
    it('renders all five status columns', () => {
      renderBoard([]);
      ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'].forEach((label) =>
        expect(screen.getByText(label)).toBeInTheDocument()
      );
    });

    it('shows "No tasks" placeholder in every empty column', () => {
      renderBoard([]);
      expect(screen.getAllByText('No tasks')).toHaveLength(5);
    });

    it('does not render a Cancelled column', () => {
      renderBoard([]);
      expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    });
  });

  describe('task placement', () => {
    it('places each task in the correct column', () => {
      const tasks: Task[] = [
        mockTask({ id: 't1', title: 'Backlog item',    status: 'BACKLOG' }),
        mockTask({ id: 't2', title: 'Todo item',       status: 'TODO' }),
        mockTask({ id: 't3', title: 'Progress item',   status: 'IN_PROGRESS' }),
        mockTask({ id: 't4', title: 'Review item',     status: 'IN_REVIEW' }),
        mockTask({ id: 't5', title: 'Done item',       status: 'DONE' }),
      ];
      renderBoard(tasks);
      tasks.forEach((t) => expect(screen.getByText(t.title)).toBeInTheDocument());
    });

    it('does not render CANCELLED tasks (not a board column)', () => {
      renderBoard([mockTask({ id: 't1', title: 'Cancelled task', status: 'CANCELLED' })]);
      expect(screen.queryByText('Cancelled task')).not.toBeInTheDocument();
    });

    it('renders multiple tasks in the same column', () => {
      const tasks = Array.from({ length: 4 }, (_, i) =>
        mockTask({ id: `t${i}`, title: `Task ${i}`, status: 'BACKLOG' })
      );
      renderBoard(tasks);
      tasks.forEach((t) => expect(screen.getByText(t.title)).toBeInTheDocument());
    });
  });

  describe('column count badges', () => {
    it('shows correct count in a populated column', () => {
      const tasks = [
        mockTask({ id: 't1', status: 'TODO' }),
        mockTask({ id: 't2', status: 'TODO' }),
        mockTask({ id: 't3', status: 'IN_PROGRESS' }),
      ];
      renderBoard(tasks);

      // getAllByText handles columns that share a heading word with task text
      const todoHeading = screen.getAllByText('Todo')[0];
      const todoCol = todoHeading.closest('.rounded-xl') as HTMLElement;
      expect(within(todoCol).getByText('2')).toBeInTheDocument();

      const inProgressHeading = screen.getAllByText('In Progress')[0];
      const inProgressCol = inProgressHeading.closest('.rounded-xl') as HTMLElement;
      expect(within(inProgressCol).getByText('1')).toBeInTheDocument();
    });

    it('shows 0 in empty columns', () => {
      renderBoard([]);
      const backlogHeading = screen.getAllByText('Backlog')[0];
      const backlogCol = backlogHeading.closest('.rounded-xl') as HTMLElement;
      expect(within(backlogCol).getByText('0')).toBeInTheDocument();
    });
  });

  describe('subscriptions', () => {
    it('subscribes to taskUpdated with the given projectId', () => {
      renderBoard([], 'my-project');
      const projectIds = mockUseSubscription.mock.calls.map(
        (call: any[]) => call[1]?.variables?.projectId
      );
      expect(projectIds).toContain('my-project');
    });

    it('subscribes to taskCreated with the given projectId', () => {
      renderBoard([], 'proj-abc');
      const projectIds = mockUseSubscription.mock.calls.map(
        (call: any[]) => call[1]?.variables?.projectId
      );
      expect(projectIds).toContain('proj-abc');
    });
  });
});

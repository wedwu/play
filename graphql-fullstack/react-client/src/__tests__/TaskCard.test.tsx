/**
 * TaskCard — unit tests.
 * Mocks useMutation so tests never need a real Apollo provider or network.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockTask, mockUser } from '../test/mocks';

// ─── Mock Apollo ──────────────────────────────────────────────────────────────
const mockMutate = vi.fn().mockResolvedValue({ data: {} });

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return { ...actual, useMutation: vi.fn() };
});

import { useMutation } from '@apollo/client';
import { TaskCard } from '../components/TaskCard';

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.mocked(useMutation).mockReturnValue([mockMutate, { loading: false } as any]);
  mockMutate.mockClear();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderCard(overrides = {}) {
  const task = mockTask(overrides);
  const onSelect = vi.fn();
  render(<TaskCard task={task} onSelect={onSelect} />);
  return { task, onSelect };
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('TaskCard', () => {
  describe('rendering', () => {
    it('renders title and priority badge', () => {
      renderCard({ title: 'Fix the bug', priority: 'URGENT' });
      expect(screen.getByText('Fix the bug')).toBeInTheDocument();
      expect(screen.getByText('URGENT')).toBeInTheDocument();
    });

    it('renders all tags', () => {
      renderCard({ tags: [
        { id: 't1', name: 'Backend', color: '#10B981' },
        { id: 't2', name: 'Bug', color: '#EF4444' },
      ]});
      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.getByText('Bug')).toBeInTheDocument();
    });

    it('renders no tags when array is empty', () => {
      renderCard({ tags: [] });
      // Priority badge still renders, but no tag spans
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    });

    it('shows assignee avatar when assigned', () => {
      renderCard({ assignee: mockUser });
      expect(screen.getByAltText(mockUser.name)).toBeInTheDocument();
    });

    it('shows "Unassigned" when no assignee', () => {
      renderCard({ assignee: undefined });
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('renders due date when provided', () => {
      renderCard({ dueDate: '2026-06-15T00:00:00.000Z' });
      expect(screen.getByText(/Due/)).toBeInTheDocument();
    });

    it('does not render due date when absent', () => {
      renderCard({ dueDate: undefined });
      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });

    it('shows current status label', () => {
      renderCard({ status: 'IN_REVIEW' });
      expect(screen.getByText('In Review')).toBeInTheDocument();
    });
  });

  describe('"Move →" button', () => {
    it('is visible for actionable statuses', () => {
      const actionable = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'] as const;
      for (const status of actionable) {
        const { unmount } = render(<TaskCard task={mockTask({ id: status, status })} />);
        expect(screen.getByText('Move →')).toBeInTheDocument();
        unmount();
      }
    });

    it('is hidden when status is DONE', () => {
      renderCard({ status: 'DONE' });
      expect(screen.queryByText('Move →')).not.toBeInTheDocument();
    });

    it('is hidden when status is CANCELLED', () => {
      renderCard({ status: 'CANCELLED' });
      expect(screen.queryByText('Move →')).not.toBeInTheDocument();
    });

    it('does not propagate click to card when clicked', () => {
      const { onSelect } = renderCard({ status: 'TODO' });
      fireEvent.click(screen.getByText('Move →'));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('calls onSelect with the task when card body is clicked', () => {
      const { onSelect, task } = renderCard();
      fireEvent.click(screen.getByText(task.title));
      expect(onSelect).toHaveBeenCalledWith(task);
    });

    it('calls UPDATE_TASK_MUTATION with next status on "Move →" click', async () => {
      const task = mockTask({ id: 'task-move', status: 'TODO' });
      render(<TaskCard task={task} />);
      fireEvent.click(screen.getByText('Move →'));
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { id: 'task-move', input: { status: 'IN_PROGRESS' } },
          })
        );
      });
    });

    it('advances BACKLOG → TODO', async () => {
      const task = mockTask({ id: 't-bl', status: 'BACKLOG' });
      render(<TaskCard task={task} />);
      fireEvent.click(screen.getByText('Move →'));
      await waitFor(() => expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't-bl', input: { status: 'TODO' } } })
      ));
    });

    it('advances IN_PROGRESS → IN_REVIEW', async () => {
      const task = mockTask({ id: 't-ip', status: 'IN_PROGRESS' });
      render(<TaskCard task={task} />);
      fireEvent.click(screen.getByText('Move →'));
      await waitFor(() => expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't-ip', input: { status: 'IN_REVIEW' } } })
      ));
    });

    it('includes an optimistic response in the mutation call', async () => {
      const task = mockTask({ id: 't-opt', status: 'TODO' });
      render(<TaskCard task={task} />);
      fireEvent.click(screen.getByText('Move →'));
      await waitFor(() => {
        const call = mockMutate.mock.calls[0][0];
        expect(call.optimisticResponse).toBeDefined();
        expect(call.optimisticResponse.updateTask.status).toBe('IN_PROGRESS');
      });
    });
  });
});

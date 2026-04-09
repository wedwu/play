import React from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_TASK_MUTATION } from '../gql';
import { Task, TaskStatus, PRIORITY_COLORS, STATUS_LABELS } from '../types';

interface Props {
  task: Task;
  onSelect?: (task: Task) => void;
}

const STATUS_ORDER: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export function TaskCard({ task, onSelect }: Props) {
  const [updateTask] = useMutation(UPDATE_TASK_MUTATION);

  const moveToNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(task.status);
    if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
    await updateTask({
      variables: { id: task.id, input: { status: STATUS_ORDER[idx + 1] } },
      optimisticResponse: {
        updateTask: { ...task, status: STATUS_ORDER[idx + 1], __typename: 'Task' },
      },
    });
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow"
      onClick={() => onSelect?.(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h3>
        <span
          className="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded"
          style={{
            color: PRIORITY_COLORS[task.priority],
            backgroundColor: PRIORITY_COLORS[task.priority] + '20',
          }}
        >
          {task.priority}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <img
              src={task.assignee.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee.name}`}
              alt={task.assignee.name}
              className="w-6 h-6 rounded-full"
              title={task.assignee.name}
            />
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
          <span className="text-xs text-gray-500">{STATUS_LABELS[task.status]}</span>
        </div>

        {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
          <button
            onClick={moveToNext}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Move →
          </button>
        )}
      </div>

      {task.dueDate && (
        <p className="mt-2 text-xs text-gray-400">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

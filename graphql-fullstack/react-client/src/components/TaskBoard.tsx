import React from 'react';
import { useSubscription } from '@apollo/client';
import { TASK_UPDATED_SUBSCRIPTION, TASK_CREATED_SUBSCRIPTION } from '../gql';
import { TaskCard } from './TaskCard';
import { Task, TaskStatus, STATUS_LABELS } from '../types';

interface Props {
  projectId: string;
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
}

const COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const COLUMN_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-gray-100',
  TODO: 'bg-blue-50',
  IN_PROGRESS: 'bg-yellow-50',
  IN_REVIEW: 'bg-purple-50',
  DONE: 'bg-green-50',
  CANCELLED: 'bg-red-50',
};

export function TaskBoard({ projectId, tasks, onTaskSelect }: Props) {
  // Live subscription — updates reflected in Apollo cache automatically
  useSubscription(TASK_UPDATED_SUBSCRIPTION, {
    variables: { projectId },
    onData: ({ data }) => {
      const payload = data.data?.taskUpdated;
      if (payload) {
        console.info(`Task "${payload.task.title}" updated by ${payload.updatedBy.name}`);
      }
    },
  });

  useSubscription(TASK_CREATED_SUBSCRIPTION, { variables: { projectId } });

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const col = byStatus(status);
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className={`rounded-xl p-3 ${COLUMN_COLORS[status]}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
                <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium">
                  {col.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.map((task) => (
                  <TaskCard key={task.id} task={task} onSelect={onTaskSelect} />
                ))}
                {col.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

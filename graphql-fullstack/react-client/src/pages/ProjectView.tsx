import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { PROJECT_QUERY, CREATE_TASK_MUTATION, TAGS_QUERY } from '../gql';
import { TaskBoard } from '../components/TaskBoard';
import { Task, TaskPriority } from '../types';

export function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useQuery(PROJECT_QUERY, { variables: { id, first: 100 } });
  const { data: tagsData } = useQuery(TAGS_QUERY);
  const [createTask] = useMutation(CREATE_TASK_MUTATION, { refetchQueries: ['Project'] });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const project = data?.project;
  const tasks: Task[] = project?.tasks.edges.map((e: { node: Task }) => e.node) ?? [];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({
      variables: {
        input: { title, projectId: id!, priority, tagIds: selectedTagIds },
      },
    });
    setTitle('');
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  if (!project) return <div className="p-8 text-gray-500">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-gray-900">{project.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
            project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {project.status}
          </span>
        </div>
        {project.description && (
          <p className="text-sm text-gray-500 mt-1 ml-0">{project.description}</p>
        )}
      </header>

      <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-200 bg-white">
        <div className="flex -space-x-2">
          {project.members.map((m: { id: string; name: string; avatarUrl?: string }) => (
            <img
              key={m.id}
              src={m.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
              alt={m.name}
              className="w-8 h-8 rounded-full border-2 border-white"
              title={m.name}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">{project.taskCount} tasks</span>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <form onSubmit={handleCreateTask} className="flex items-start gap-3 flex-wrap">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Task title"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="flex gap-1 flex-wrap">
              {tagsData?.tags.map((tag: { id: string; name: string; color: string }) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((ids) =>
                      ids.includes(tag.id) ? ids.filter((id) => id !== tag.id) : [...ids, tag.id]
                    )
                  }
                  className="text-xs px-2 py-1 rounded-full border font-medium transition-opacity"
                  style={{
                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'white',
                    color: selectedTagIds.includes(tag.id) ? 'white' : tag.color,
                    borderColor: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-3 py-2 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="flex-1 p-6 overflow-auto">
        <TaskBoard projectId={id!} tasks={tasks} onTaskSelect={setSelectedTask} />
      </main>

      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-end z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white h-full w-full max-w-lg overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div><span className="font-medium">Status:</span> {selectedTask.status}</div>
              <div><span className="font-medium">Priority:</span> {selectedTask.priority}</div>
              {selectedTask.assignee && (
                <div><span className="font-medium">Assignee:</span> {selectedTask.assignee.name}</div>
              )}
              {selectedTask.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-gray-500">{selectedTask.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTask.tags.map((tag) => (
                  <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

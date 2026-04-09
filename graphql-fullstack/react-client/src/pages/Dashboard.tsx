import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { PROJECTS_QUERY, CREATE_PROJECT_MUTATION } from '../gql';
import { useAuth } from '../hooks/useAuth';
import { Project } from '../types';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data, loading, fetchMore } = useQuery(PROJECTS_QUERY, {
    variables: { first: 12 },
  });

  const [createProject] = useMutation(CREATE_PROJECT_MUTATION, {
    refetchQueries: ['Projects'],
  });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const projects: Project[] = data?.projects.edges.map((e: { node: Project }) => e.node) ?? [];
  const pageInfo = data?.projects.pageInfo;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject({ variables: { input: { name: newName, description: newDesc } } });
    setNewName('');
    setNewDesc('');
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name} <span className="text-xs text-gray-400">({user?.role})</span>
          </span>
          <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-500 text-sm mt-1">
              {data?.projects.totalCount ?? 0} total
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">New Project</h3>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Project name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && <div className="text-center py-12 text-gray-400">Loading projects...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {p.status}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {p.members.slice(0, 4).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                      alt={m.name}
                      className="w-7 h-7 rounded-full border-2 border-white"
                      title={m.name}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{p.taskCount} tasks</span>
              </div>
            </Link>
          ))}
        </div>

        {pageInfo?.hasNextPage && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchMore({ variables: { after: pageInfo.endCursor } })}
              className="text-blue-600 text-sm hover:underline"
            >
              Load more
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

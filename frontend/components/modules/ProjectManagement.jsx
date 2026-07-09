'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import ModulePage from '../ui/ModulePage';
import Button from '../ui/Button';
import SearchInput from '../ui/SearchInput';
import Card from '../ui/Card';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import Tooltip from '../ui/Tooltip';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function ProjectManagementModule({ goHome, showToast }) {
  const [pmProjects, setPmProjects] = useState([]);
  const [pmLoaded, setPmLoaded] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [pmProjectConfirmDelete, setPmProjectConfirmDelete] = useState(null);
  const [pmProjectDeleting, setPmProjectDeleting] = useState(false);
  const [pmTaskConfirmDelete, setPmTaskConfirmDelete] = useState(null);
  const [pmTaskDeleting, setPmTaskDeleting] = useState(false);
  const [pmSearch, setPmSearch] = useState('');

  async function loadPm() {
    const data = await apiFetch('/api/v1/pm/projects');
    setPmProjects(data.projects);
    setPmLoaded(true);
  }

  useEffect(() => {
    loadPm().catch(() => showToast());
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await apiFetch('/api/v1/pm/projects', {
      method: 'POST',
      body: JSON.stringify({ name: newProjectName }),
    });
    setNewProjectName('');
    setShowProjectForm(false);
    await loadPm();
  }

  function startEditProject(project) {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
  }

  async function handleSaveProjectName(e) {
    e.preventDefault();
    await apiFetch(`/api/v1/pm/projects/${editingProjectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: editProjectName }),
    });
    setEditingProjectId(null);
    await loadPm();
  }

  function handleDeleteProject(id) {
    setPmProjectConfirmDelete({ id });
  }

  async function confirmPmProjectDelete() {
    if (!pmProjectConfirmDelete) return;
    setPmProjectDeleting(true);
    try {
      await apiFetch(`/api/v1/pm/projects/${pmProjectConfirmDelete.id}`, { method: 'DELETE' });
      showToast('Project deleted.');
      await loadPm();
    } finally {
      setPmProjectDeleting(false);
      setPmProjectConfirmDelete(null);
    }
  }

  function startEditTask(task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
  }

  async function handleSaveTaskTitle(e) {
    e.preventDefault();
    await apiFetch(`/api/v1/pm/tasks/${editingTaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTaskTitle }),
    });
    setEditingTaskId(null);
    await loadPm();
  }

  function handleDeleteTask(id) {
    setPmTaskConfirmDelete({ id });
  }

  async function confirmPmTaskDelete() {
    if (!pmTaskConfirmDelete) return;
    setPmTaskDeleting(true);
    try {
      await apiFetch(`/api/v1/pm/tasks/${pmTaskConfirmDelete.id}`, { method: 'DELETE' });
      showToast('Task deleted.');
      await loadPm();
    } finally {
      setPmTaskDeleting(false);
      setPmTaskConfirmDelete(null);
    }
  }

  async function handleAddTask(e, projectId) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await apiFetch('/api/v1/pm/tasks', {
      method: 'POST',
      body: JSON.stringify({ projectId, title: newTaskTitle, status: 'todo' }),
    });
    setNewTaskTitle('');
    setShowTaskForm(false);
    await loadPm();
  }

  async function handleMoveTask(taskId, status) {
    await apiFetch(`/api/v1/pm/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadPm();
  }

  return (
    <ModulePage
      back={{ label: 'Workspace', onClick: goHome }}
      title="Project Management"
      description="Boards for every active piece of work. Part of Business."
      primaryAction={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setShowProjectForm((v) => !v)}>+ New project</Button>
          <Button onClick={() => setShowTaskForm((v) => !v)}>+ New task</Button>
        </div>
      }
      stats={pmLoaded && pmProjects.length > 0 ? [
        { label: 'Projects', value: pmProjects.length },
        { label: 'To Do', value: pmProjects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'todo').length, 0) },
        { label: 'In Progress', value: pmProjects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'in_progress').length, 0) },
        { label: 'Done', value: pmProjects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'done').length, 0) },
      ] : null}
      toolbar={pmLoaded && pmProjects.length > 0 ? (
        <SearchInput value={pmSearch} onChange={(e) => setPmSearch(e.target.value)} placeholder="Search tasks across all projects…" />
      ) : null}
    >
      {showProjectForm && (
        <Card style={{ marginBottom: 18 }}>
          <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label className="field-label">Project name</label>
              <input className="field-input" placeholder="e.g. Website Redesign" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} autoFocus required />
            </div>
            <Button type="submit">Create project</Button>
            <Button type="button" variant="ghost" onClick={() => setShowProjectForm(false)}>Cancel</Button>
          </form>
        </Card>
      )}

      {!pmLoaded ? (
        <Card><SkeletonRows rows={4} /></Card>
      ) : pmProjects.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No projects yet"
            description="Create your first project to start organising work into a kanban board."
            action={<Button onClick={() => setShowProjectForm(true)}>+ New project</Button>}
          />
        </Card>
      ) : (
        pmProjects.map((project) => {
          const columns = [
            { key: 'todo', label: 'To do' },
            { key: 'in_progress', label: 'In progress' },
            { key: 'done', label: 'Done' },
          ];
          const q = pmSearch.trim().toLowerCase();
          const visibleTasks = (col) => project.tasks.filter((t) => t.status === col && (!q || t.title.toLowerCase().includes(q)));
          return (
            <div key={project.id} style={{ marginBottom: 28 }}>
              {editingProjectId === project.id ? (
                <form onSubmit={handleSaveProjectName} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                  <input className="field-input" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} autoFocus required style={{ maxWidth: 280 }} />
                  <Button type="submit" size="sm">Save</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingProjectId(null)}>Cancel</Button>
                </form>
              ) : (
                <h2 className="section-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {project.name}
                  <Tooltip label="Rename project">
                    <button className="ctag" onClick={() => startEditProject(project)}>Rename</button>
                  </Tooltip>
                  <Tooltip label="Delete project and all its tasks">
                    <button className="ctag danger" onClick={() => handleDeleteProject(project.id)}>Delete</button>
                  </Tooltip>
                </h2>
              )}

              {showTaskForm && (
                <form onSubmit={(e) => handleAddTask(e, project.id)} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
                  <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="field-label">Task title</label>
                    <input className="field-input" placeholder="New task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} autoFocus required />
                  </div>
                  <Button type="submit" size="sm">Add to To do</Button>
                </form>
              )}

              <div className="board">
                {columns.map((col, colIdx) => (
                  <div key={col.key}>
                    <div className="col-head">
                      <span>{col.label}</span>
                      <span>{visibleTasks(col.key).length}</span>
                    </div>
                    {visibleTasks(col.key).length === 0 && (
                      <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                        {q ? 'No matches' : 'Empty'}
                      </div>
                    )}
                    {visibleTasks(col.key).map((t) => (
                      <div className="card" key={t.id}>
                        {editingTaskId === t.id ? (
                          <form onSubmit={handleSaveTaskTitle} style={{ display: 'flex', gap: 6 }}>
                            <input className="field-input" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} autoFocus required style={{ flex: 1, fontSize: 13 }} />
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTaskId(null)}>×</Button>
                          </form>
                        ) : (
                          <>
                            <div className="ctitle">{t.title}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                              {colIdx > 0 && (
                                <Tooltip label={`Move to ${columns[colIdx - 1].label}`}>
                                  <button className="ctag" onClick={() => handleMoveTask(t.id, columns[colIdx - 1].key)}>← Back</button>
                                </Tooltip>
                              )}
                              {colIdx < columns.length - 1 && (
                                <Tooltip label={`Move to ${columns[colIdx + 1].label}`}>
                                  <button className="ctag" onClick={() => handleMoveTask(t.id, columns[colIdx + 1].key)}>Next →</button>
                                </Tooltip>
                              )}
                              <Tooltip label="Edit task title">
                                <button className="ctag" onClick={() => startEditTask(t)}>Edit</button>
                              </Tooltip>
                              <Tooltip label="Delete task">
                                <button className="ctag danger" onClick={() => handleDeleteTask(t.id)}>Delete</button>
                              </Tooltip>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <ConfirmDialog
        isOpen={!!pmProjectConfirmDelete}
        onClose={() => setPmProjectConfirmDelete(null)}
        onConfirm={confirmPmProjectDelete}
        danger
        loading={pmProjectDeleting}
        title="Delete this project?"
        description="All tasks inside this project will be deleted too. This cannot be undone."
        confirmLabel="Delete project"
      />
      <ConfirmDialog
        isOpen={!!pmTaskConfirmDelete}
        onClose={() => setPmTaskConfirmDelete(null)}
        onConfirm={confirmPmTaskDelete}
        danger
        loading={pmTaskDeleting}
        title="Delete this task?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
    </ModulePage>
  );
}

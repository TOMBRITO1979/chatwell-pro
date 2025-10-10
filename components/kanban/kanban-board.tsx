'use client';

import { useState, useEffect } from 'react';
import { Columns3, Plus, Edit, Trash2, AlertCircle, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskForm } from '@/components/tarefas/task-form';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'em_tratativa' | 'iniciado' | 'pendente' | 'cancelado' | 'concluido';
  priority: 'low' | 'medium' | 'high';
  client_name: string | null;
  project_name: string | null;
  contract_id?: string | null;
}

interface Column {
  id: 'em_tratativa' | 'iniciado' | 'pendente' | 'concluido' | 'cancelado';
  title: string;
  color: string;
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: Column[] = [
    { id: 'em_tratativa', title: 'Em Tratativa', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'iniciado', title: 'Em Andamento', color: 'bg-blue-100 border-blue-300' },
    { id: 'pendente', title: 'Pendente', color: 'bg-orange-100 border-orange-300' },
    { id: 'concluido', title: 'Concluído', color: 'bg-green-100 border-green-300' },
    { id: 'cancelado', title: 'Cancelado', color: 'bg-red-100 border-red-300' }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadTasks();
      } else {
        alert(data.message || 'Erro ao deletar tarefa');
      }
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      alert('Erro ao deletar tarefa');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
    loadTasks();
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTask) return;

    try {
      const token = localStorage.getItem('token');

      // Atualizar a tarefa
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...draggedTask,
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        // Se a tarefa está associada a um contrato, atualizar o status do contrato também
        if (draggedTask.contract_id) {
          await fetch(`/api/service-contracts/${draggedTask.contract_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: newStatus
            })
          });
        }

        loadTasks();
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return '';
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'cancelado') return false;
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Columns3 className="w-8 h-8 text-chatwell-blue" />
            Kanban
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e organize suas tarefas em colunas
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando tarefas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <Card className={`mb-4 ${column.color} border-2`}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>{column.title}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Tasks */}
                <div className="space-y-3 flex-1 min-h-[200px]">
                  {columnTasks.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Nenhuma tarefa
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={`cursor-move hover:shadow-lg transition-all ${getPriorityColor(task.priority)} ${
                          draggedTask?.id === task.id ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm flex-1 line-clamp-2">
                              {task.title}
                            </h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(task)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 items-center text-xs">
                            {isOverdue(task) && (
                              <span className="flex items-center gap-1 text-red-600 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Vencida
                              </span>
                            )}
                            {task.due_date && (
                              <span className={`${isOverdue(task) ? 'text-red-600' : 'text-gray-500'}`}>
                                📅 {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>

                          {(task.client_name || task.project_name) && (
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                              {task.client_name && (
                                <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <User className="w-3 h-3" />
                                  {task.client_name}
                                </span>
                              )}
                              {task.project_name && (
                                <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <Briefcase className="w-3 h-3" />
                                  {task.project_name}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

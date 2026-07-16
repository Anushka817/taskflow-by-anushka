/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStats, User, TaskStatus, TaskPriority, TaskCategory } from '../types';
import { api } from '../lib/api';
import { Navbar } from './Navbar';
import { StatsSection } from './StatsSection';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { CalendarView } from './CalendarView';
import { VisualCharts } from './VisualCharts';
import { 
  Search, SlidersHorizontal, FolderKanban, Loader2, RefreshCw, Plus, 
  LayoutGrid, Calendar as CalendarIcon, PieChart as ChartIcon, 
  AlertCircle, Bell, ArrowRight, Sparkles, HelpCircle, CheckSquare, Clock, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'complete';
  message: string;
  timestamp: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onShowToast, theme, onThemeToggle }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active workspace tab view state: 'list' | 'kanban' | 'calendar' | 'charts'
  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'calendar' | 'charts'>('kanban');

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Recent activity log tracking state
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'init-sync',
      type: 'update',
      message: 'Workspace synchronized successfully',
      timestamp: 'Just now',
    }
  ]);

  const addActivity = useCallback((type: 'create' | 'update' | 'delete' | 'complete', message: string) => {
    setActivities((prev) => [
      {
        id: `act-${Math.random().toString(36).substring(2, 9)}`,
        type,
        message,
        timestamp: 'Just now',
      },
      ...prev,
    ].slice(0, 8));
  }, []);

  const isDark = theme === 'dark';

  // Fetch all tasks and stats
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const apiPriority = priorityFilter === 'all' ? undefined : priorityFilter;
      const apiStatus = statusFilter === 'all' ? undefined : statusFilter;

      // Get latest tasks and statistics from server
      const [tasksData, statsData] = await Promise.all([
        api.getTasks({
          status: apiStatus,
          priority: apiPriority,
          q: searchQuery || undefined,
          sortBy,
          sortOrder,
        }),
        api.getStats(),
      ]);

      // Apply category filter client-side if selected
      let filteredTasks = tasksData;
      if (categoryFilter !== 'all') {
        filteredTasks = tasksData.filter(t => t.category === categoryFilter);
      }

      setTasks(filteredTasks);
      setStats(statsData);
    } catch (err: any) {
      onShowToast(err.message || 'Error pulling workspace data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy, sortOrder, onShowToast]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy, sortOrder, fetchData]);

  // Dynamically seed initial activities once tasks are loaded
  useEffect(() => {
    if (tasks.length > 0 && activities.length <= 1) {
      const seeded: Activity[] = tasks.slice(0, 5).map((task, index) => {
        const timeLabels = ['2 minutes ago', '12 minutes ago', '1 hour ago', '2 hours ago', 'Yesterday'];
        const typeMap: Record<TaskStatus, 'create' | 'update' | 'complete'> = {
          completed: 'complete',
          in_progress: 'update',
          pending: 'create',
        };
        const actionTextMap: Record<TaskStatus, string> = {
          completed: `Completed "${task.title}"`,
          in_progress: `Began progress on "${task.title}"`,
          pending: `Logged task outline for "${task.title}"`,
        };
        return {
          id: `seed-${task.id}`,
          type: typeMap[task.status] || 'update',
          message: actionTextMap[task.status] || `Updated "${task.title}"`,
          timestamp: timeLabels[index] || 'Earlier this week',
        };
      });
      setActivities((prev) => {
        const combined = [...prev, ...seeded];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        return unique.slice(0, 8);
      });
    }
  }, [tasks]);

  // Handle Create or Update task saving
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    attachment?: any;
  }) => {
    try {
      if (taskToEdit) {
        await api.updateTask(taskToEdit.id, taskData);
        onShowToast('Task specification successfully saved', 'success');
        addActivity('update', `Updated task details for "${taskData.title}"`);
      } else {
        await api.createTask(taskData);
        onShowToast('New task successfully created', 'success');
        addActivity('create', `Created new task "${taskData.title}"`);
      }
      fetchData(true);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save task specifications', 'error');
    }
  };

  // Update status (e.g., drag and drop, or toggle checkmark)
  const handleUpdateStatus = async (task: Task, nextStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );

      await api.updateTask(task.id, { status: nextStatus });
      onShowToast(`Task status updated to ${nextStatus.replace('_', ' ')}`, 'success');
      
      const statusLabels: Record<string, string> = {
        completed: 'Completed',
        in_progress: 'Started working on',
        pending: 'Moved back to pending',
      };
      addActivity(
        nextStatus === 'completed' ? 'complete' : 'update',
        `${statusLabels[nextStatus] || 'Updated status of'} "${task.title}"`
      );

      fetchData(true);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update task progress', 'error');
      fetchData(true); // Revert on failure
    }
  };

  // Toggle complete/pending checkbox (for list card convenience)
  const handleToggleStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    handleUpdateStatus(task, nextStatus);
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    try {
      const deletedTask = tasks.find(t => t.id === id);
      // Optimistic delete
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await api.deleteTask(id);
      onShowToast('Task successfully removed', 'success');
      if (deletedTask) {
        addActivity('delete', `Deleted task "${deletedTask.title}"`);
      }
      fetchData(true);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete task', 'error');
      fetchData(true); // Revert
    }
  };

  // Drag and Drop Column handlers for Kanban Board
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== status) {
        handleUpdateStatus(task, status);
      }
    }
  };

  // Open modal for editing
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Open modal for new creation
  const handleNewTask = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // Calculate Urgent Reminders (Due Today, Tomorrow, or Overdue)
  const getDueReminders = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return t.dueDate <= tomorrowStr; // Overdue, due today, or tomorrow
    });
  };

  const urgentReminders = getDueReminders();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'
    }`}>
      {/* Interactive Navigation Bar */}
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        onOpenNewTaskModal={handleNewTask} 
        theme={theme}
        onThemeToggle={onThemeToggle}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Urgent Reminder Alerts Notification Banner */}
        {urgentReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-rose-500/15' : 'bg-rose-100'}`}>
                <Bell className="h-4.5 w-4.5 text-rose-500 shrink-0 animate-swing" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Action Items Reminder</p>
                <p className="text-xs opacity-80 mt-0.5">
                  You have {urgentReminders.length} urgent task{urgentReminders.length === 1 ? '' : 's'} that are due soon or overdue!
                </p>
              </div>
            </div>
            
            {/* Quick reminder mini list */}
            <div className="flex items-center gap-2 max-w-sm truncate text-xs self-end sm:self-auto">
              <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 uppercase">
                Urgent Actions
              </span>
              <span className="truncate opacity-95">"{urgentReminders[0].title}"</span>
              {urgentReminders.length > 1 && (
                <span className="text-[10px] opacity-60 font-bold shrink-0">+{urgentReminders.length - 1} more</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Dynamic Analytics & Statistics Overview */}
        {stats && <StatsSection stats={stats} theme={theme} />}

        {/* Navigation Tabs Control */}
        <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6 ${
          isDark ? 'border-white/5' : 'border-zinc-200'
        }`}>
          {/* Main workspace navigation tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'kanban', label: 'Kanban Board', icon: FolderKanban },
              { id: 'list', label: 'Task List', icon: LayoutGrid },
              { id: 'calendar', label: 'Calendar View', icon: CalendarIcon },
              { id: 'charts', label: 'Visual Metrics', icon: ChartIcon },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sync Refresh and action triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white' 
                  : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950'
              }`}
              title="Sync Workspace with server DB"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            <button
              onClick={handleNewTask}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-3.5 py-2 shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Unified Search, Filter and Sorter Row */}
        <div className={`rounded-2xl border p-4 backdrop-blur-xl mb-6 ${
          isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/70'
        }`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            {/* Instant Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search matching tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  isDark 
                    ? 'border-white/5 bg-zinc-950/60 text-zinc-100 placeholder-zinc-500' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>

            {/* Filters Stack */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Category Filter dropdown */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                    isDark ? 'border-white/5 bg-zinc-950/60 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <option value="all">📁 All Categories</option>
                  <option value="work">🏢 Work</option>
                  <option value="personal">🏠 Personal</option>
                  <option value="health">❤️ Health</option>
                  <option value="finance">💰 Finance</option>
                  <option value="other">🔮 Other</option>
                </select>
              </div>

              {/* Priority Filter dropdown */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                    isDark ? 'border-white/5 bg-zinc-950/60 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <option value="all">⚡ All Priorities</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
              </div>

              {/* Sorter Selection */}
              <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${
                isDark ? 'border-white/5 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'
              }`}>
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-zinc-500 uppercase focus:outline-none cursor-pointer"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority Tier</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="ml-1 text-[10px] text-indigo-500 font-extrabold hover:underline cursor-pointer transition-colors"
                  title="Toggle order direction"
                >
                  {sortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Premium Pulsing Skeleton Loading Layout with Spinner */}
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 py-2 animate-pulse">
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Synchronizing TaskFlow Workspace...
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((colIndex) => (
                <div key={colIndex} className={`rounded-2xl border p-4 space-y-4 ${
                  isDark ? 'bg-zinc-900/10 border-white/5' : 'bg-zinc-100/30 border-zinc-200'
                }`}>
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-500/5">
                    <div className="h-3 w-16 rounded bg-zinc-500/20 animate-pulse" />
                    <div className="h-4 w-4 rounded-full bg-zinc-500/20 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className={`p-4 rounded-xl border border-dashed animate-pulse space-y-3 ${
                      isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/60'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-4 w-4 rounded bg-zinc-500/20" />
                          <div className="h-4.5 w-2/3 rounded bg-zinc-500/20" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-full rounded bg-zinc-500/10" />
                        <div className="h-3 w-4/5 rounded bg-zinc-500/10" />
                      </div>
                      <div className="flex gap-1.5 pt-2">
                        <div className="h-4.5 w-12 rounded-full bg-zinc-500/15" />
                        <div className="h-4.5 w-16 rounded-full bg-zinc-500/15" />
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border border-dashed animate-pulse space-y-3 ${
                      isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/60'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-4 w-4 rounded bg-zinc-500/20" />
                          <div className="h-4.5 w-1/2 rounded bg-zinc-500/20" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-full rounded bg-zinc-500/10" />
                      </div>
                      <div className="flex gap-1.5 pt-2">
                        <div className="h-4.5 w-14 rounded-full bg-zinc-500/15" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            {['kanban', 'list'].includes(activeTab) ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-9 space-y-6">
                  {/* View Tab 1: KANBAN BOARD */}
                  {activeTab === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      
                      {/* COLUMN: PENDING */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'pending')}
                        className={`rounded-2xl border p-4 flex flex-col min-h-[450px] transition-all ${
                          isDark ? 'bg-zinc-900/10 border-white/5' : 'bg-zinc-100/30 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                            <span className="text-xs font-extrabold uppercase tracking-widest">Pending</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {tasks.filter(t => t.status === 'pending').length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                          {tasks.filter(t => t.status === 'pending').length > 0 ? (
                            tasks.filter(t => t.status === 'pending').map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onToggleStatus={handleToggleStatus}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                theme={theme}
                              />
                            ))
                          ) : (
                            <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center border border-dashed border-zinc-500/10 rounded-xl h-full">
                              <Inbox className="h-6 w-6 opacity-30 mb-2" />
                              <span className="text-[11px] font-semibold">Column empty</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* COLUMN: IN PROGRESS */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'in_progress')}
                        className={`rounded-2xl border p-4 flex flex-col min-h-[450px] transition-all ${
                          isDark ? 'bg-zinc-900/10 border-white/5' : 'bg-zinc-100/30 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/10">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                            <span className="text-xs font-extrabold uppercase tracking-widest">In Progress</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {tasks.filter(t => t.status === 'in_progress').length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                          {tasks.filter(t => t.status === 'in_progress').length > 0 ? (
                            tasks.filter(t => t.status === 'in_progress').map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onToggleStatus={handleToggleStatus}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                theme={theme}
                              />
                            ))
                          ) : (
                            <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center border border-dashed border-zinc-500/10 rounded-xl h-full">
                              <Inbox className="h-6 w-6 opacity-30 mb-2" />
                              <span className="text-[11px] font-semibold">Column empty</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* COLUMN: COMPLETED */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'completed')}
                        className={`rounded-2xl border p-4 flex flex-col min-h-[450px] transition-all ${
                          isDark ? 'bg-zinc-900/10 border-white/5' : 'bg-zinc-100/30 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/10">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span className="text-xs font-extrabold uppercase tracking-widest">Completed</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {tasks.filter(t => t.status === 'completed').length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                          {tasks.filter(t => t.status === 'completed').length > 0 ? (
                            tasks.filter(t => t.status === 'completed').map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onToggleStatus={handleToggleStatus}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                theme={theme}
                              />
                            ))
                          ) : (
                            <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center border border-dashed border-zinc-500/10 rounded-xl h-full">
                              <Inbox className="h-6 w-6 opacity-30 mb-2" />
                              <span className="text-[11px] font-semibold">Column empty</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* View Tab 2: TASK LIST GRID */}
                  {activeTab === 'list' && (
                    <AnimatePresence mode="popLayout">
                      {tasks.length > 0 ? (
                        <motion.div
                          layout
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {tasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggleStatus={handleToggleStatus}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              theme={theme}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed rounded-3xl relative overflow-hidden ${
                            isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/40'
                          }`}
                        >
                          {/* Visual glowing background blur */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

                          <div className="relative mb-6">
                            <div className={`relative flex items-center justify-center h-16 w-16 rounded-2xl border shadow-xl ${
                              isDark ? 'bg-zinc-950 border-white/5 text-indigo-400 shadow-indigo-950/20' : 'bg-white border-zinc-200 text-indigo-500 shadow-indigo-100/30'
                            }`}>
                              <FolderKanban className="h-8 w-8 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                              <CheckSquare className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            Operational Queue Empty
                          </h3>
                          <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed font-semibold">
                            No active tasks matched your filters. Create a new task or adjust filters to resume work synchronization.
                          </p>
                          <button
                            onClick={handleNewTask}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Plus className="h-4.5 w-4.5" />
                            <span>Create New Task</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                {/* Sidebar Recent Activity Timeline */}
                <div className="xl:col-span-3 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`rounded-3xl border p-5 backdrop-blur-xl ${
                      isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-500/10">
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          Recent Activity
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-500/10 px-2.5 py-0.5 rounded-full uppercase font-bold">
                        Live Feed
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                      {activities.map((activity, idx) => {
                        const activityIcons = {
                          create: <Plus className="h-3 w-3 text-emerald-500" />,
                          update: <RefreshCw className="h-3 w-3 text-indigo-500" />,
                          delete: <AlertCircle className="h-3 w-3 text-rose-500" />,
                          complete: <CheckSquare className="h-3 w-3 text-emerald-500" />,
                        };
                        const activityColors = {
                          create: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10',
                          update: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/10',
                          delete: 'bg-rose-500/10 text-rose-500 border border-rose-500/10',
                          complete: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10',
                        };

                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="flex gap-3 text-xs"
                          >
                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ${activityColors[activity.type]}`}>
                              {activityIcons[activity.type]}
                            </div>
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <p className={`font-semibold leading-relaxed break-words ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                {activity.message}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500">
                                {activity.timestamp}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* View Tab 3: INTERACTIVE CALENDAR VIEW */}
                {activeTab === 'calendar' && (
                  <CalendarView 
                    tasks={tasks} 
                    onTaskClick={handleEditTask} 
                    theme={theme} 
                  />
                )}

                {/* View Tab 4: VISUAL ANALYTICS CHARTS */}
                {activeTab === 'charts' && stats && (
                  <VisualCharts 
                    stats={stats} 
                    theme={theme} 
                  />
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Professional Footer block */}
      <footer className={`mt-auto border-t py-8 text-center text-xs transition-colors ${
        isDark 
          ? 'border-white/5 bg-zinc-950/40 text-zinc-500' 
          : 'border-zinc-200 bg-white/60 text-zinc-400'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold uppercase tracking-widest text-[10px]">
          <p className="text-zinc-500 font-extrabold">
            Developed by <span className="text-indigo-500">Anushka Tomar</span> | Full Stack Developer
          </p>
          <div className="flex items-center gap-4 text-zinc-500 font-semibold">
            <span>TaskFlow Workspace &copy; {new Date().getFullYear()}</span>
            <span className="h-3 w-px bg-zinc-500/20" />
            <span className="hover:text-indigo-500 transition-colors">v1.1.0</span>
          </div>
        </div>
      </footer>

      {/* Reusable Modal Specification Layer */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        theme={theme}
      />

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 xl:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewTask}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl transition-all cursor-pointer"
          aria-label="Create new task"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

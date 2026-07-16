/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, TaskPriority, TaskStatus, TaskStats, User } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('task_manager_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'An unexpected error occurred');
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => request<{ user: User }>('/auth/user'),

  // Tasks
  getTasks: (filters: {
    status?: string;
    priority?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') {
      if (filters.priority === 'high-priority') {
        params.append('priority', 'high');
      } else {
        params.append('priority', filters.priority);
      }
    }
    if (filters.q) params.append('q', filters.q);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryStr = params.toString();
    return request<Task[]>(`/tasks${queryStr ? `?${queryStr}` : ''}`);
  },

  createTask: (task: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    category?: string;
    attachment?: { name: string; size: string; dataUrl?: string };
  }) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (
    id: string,
    updates: {
      title?: string;
      description?: string;
      dueDate?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      category?: string;
      attachment?: { name: string; size: string; dataUrl?: string } | null;
    }
  ) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTask: (id: string) =>
    request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  getStats: () => request<TaskStats>('/tasks/stats'),
};

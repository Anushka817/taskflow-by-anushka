/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskCategory = 'work' | 'personal' | 'health' | 'finance' | 'other';

export interface TaskAttachment {
  name: string;
  size: string;
  dataUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  attachment?: TaskAttachment;
  userId: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarSeed?: string; // Seed for premium dynamic SVG avatar
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  overdueCount: number;
  categoryDistribution: {
    work: number;
    personal: number;
    health: number;
    finance: number;
    other: number;
  };
}

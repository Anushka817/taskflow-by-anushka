/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { readDB, writeDB, authenticateUser } from './_db';

export default async function handler(req: Request, res: Response) {
  // Validate authentication first
  const user = authenticateUser(req, res);
  if (!user) {
    // authenticateUser already sent 401 response
    return;
  }

  const userId = user.id;
  const { action, id } = req.query;

  try {
    // 1. STATS ACTION: GET /api/tasks/stats
    if (req.method === 'GET' && action === 'stats') {
      const db = readDB();
      const userTasks = db.tasks.filter((t) => t.userId === userId);

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
      const inProgressTasks = userTasks.filter((t) => t.status === 'in_progress').length;
      const pendingTasks = userTasks.filter((t) => t.status === 'pending').length;

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const highPriorityCount = userTasks.filter((t) => t.priority === 'high').length;
      const mediumPriorityCount = userTasks.filter((t) => t.priority === 'medium').length;
      const lowPriorityCount = userTasks.filter((t) => t.priority === 'low').length;

      const todayStr = new Date().toISOString().split('T')[0];
      const overdueCount = userTasks.filter((t) => {
        return t.status !== 'completed' && t.dueDate && t.dueDate < todayStr;
      }).length;

      const categoryDistribution = {
        work: userTasks.filter((t) => t.category === 'work').length,
        personal: userTasks.filter((t) => t.category === 'personal').length,
        health: userTasks.filter((t) => t.category === 'health').length,
        finance: userTasks.filter((t) => t.category === 'finance').length,
        other: userTasks.filter((t) => t.category === 'other').length,
      };

      res.status(200).json({
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        highPriorityCount,
        mediumPriorityCount,
        lowPriorityCount,
        overdueCount,
        categoryDistribution,
      });
      return;
    }

    // 2. SPECIFIC TASK ACTIONS (By ID)
    if (id) {
      const taskId = String(id);

      if (req.method === 'PUT') {
        const { title, description, dueDate, priority, status, category, attachment } = req.body;
        const db = readDB();
        const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.userId === userId);

        if (taskIndex === -1) {
          res.status(404).json({ error: 'Task not found or access denied' });
          return;
        }

        const existingTask = db.tasks[taskIndex];
        const updatedTask = {
          ...existingTask,
          title: title !== undefined ? title : existingTask.title,
          description: description !== undefined ? description : existingTask.description,
          dueDate: dueDate !== undefined ? dueDate : existingTask.dueDate,
          priority: priority !== undefined ? (priority as 'low' | 'medium' | 'high') : existingTask.priority,
          status: status !== undefined ? (status as 'pending' | 'in_progress' | 'completed') : existingTask.status,
          category: category !== undefined ? (category as 'work' | 'personal' | 'health' | 'finance' | 'other') : existingTask.category,
          attachment: attachment !== undefined ? attachment : existingTask.attachment,
        };

        db.tasks[taskIndex] = updatedTask;
        writeDB(db);

        res.status(200).json(updatedTask);
        return;
      }

      if (req.method === 'DELETE') {
        const db = readDB();
        const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.userId === userId);

        if (taskIndex === -1) {
          res.status(404).json({ error: 'Task not found or access denied' });
          return;
        }

        db.tasks.splice(taskIndex, 1);
        writeDB(db);

        res.status(200).json({ success: true, message: 'Task deleted successfully' });
        return;
      }

      res.setHeader('Allow', 'PUT, DELETE');
      res.status(405).json({ error: `Method ${req.method} Not Allowed on specific task` });
      return;
    }

    // 3. GENERAL TASK ACTIONS
    if (req.method === 'GET') {
      const db = readDB();
      let userTasks = db.tasks.filter((t) => t.userId === userId);

      const { status, priority, q, sortBy, sortOrder } = req.query;

      if (status && status !== 'all') {
        userTasks = userTasks.filter((t) => t.status === status);
      }

      if (priority && priority !== 'all') {
        userTasks = userTasks.filter((t) => t.priority === priority);
      }

      if (q) {
        const searchStr = String(q).toLowerCase();
        userTasks = userTasks.filter(
          (t) =>
            t.title.toLowerCase().includes(searchStr) ||
            t.description.toLowerCase().includes(searchStr)
        );
      }

      // Sort tasks
      const orderMultiplier = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'dueDate') {
        userTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate) * orderMultiplier;
        });
      } else if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        userTasks.sort((a, b) => {
          return (priorityWeight[a.priority] - priorityWeight[b.priority]) * orderMultiplier;
        });
      } else {
        // Default sort: createdAt desc
        userTasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }

      res.status(200).json(userTasks);
      return;
    }

    if (req.method === 'POST') {
      const { title, description, dueDate, priority, status, category, attachment } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Task title is required' });
        return;
      }

      const db = readDB();

      const newTask = {
        id: crypto.randomUUID(),
        title,
        description: description || '',
        dueDate: dueDate || '',
        priority: (priority as 'low' | 'medium' | 'high') || 'medium',
        status: (status as 'pending' | 'in_progress' | 'completed') || 'pending',
        category: (category as 'work' | 'personal' | 'health' | 'finance' | 'other') || 'work',
        attachment: attachment || undefined,
        userId,
        createdAt: new Date().toISOString(),
      };

      db.tasks.push(newTask);
      writeDB(db);

      res.status(201).json(newTask);
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

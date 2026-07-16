/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Extend Express Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'tasks_db.json');

// Interface for DB tables (emulating SQLite)
interface DBData {
  users: Array<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    salt: string;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    category: 'work' | 'personal' | 'health' | 'finance' | 'other';
    attachment?: { name: string; size: string; dataUrl?: string };
    userId: string;
    createdAt: string;
  }>;
  sessions: Array<{
    token: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

// Ensure database file exists
function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBData = { users: [], tasks: [], sessions: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DBData;
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.map((task: any) => {
        let status = task.status;
        if (status !== 'completed' && status !== 'in_progress' && status !== 'pending') {
          status = 'pending';
        }
        return {
          id: task.id,
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate || '',
          priority: task.priority || 'medium',
          status: status,
          category: task.category || 'work',
          attachment: task.attachment,
          userId: task.userId,
          createdAt: task.createdAt || new Date().toISOString(),
        };
      });
    } else {
      parsed.tasks = [];
    }
    return parsed;
  } catch (error) {
    console.error('Error reading DB, resetting database:', error);
    return { users: [], tasks: [], sessions: [] };
  }
}

function writeDB(data: DBData): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// Password cryptography functions
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Simple Request Logging Middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Authentication Middleware
  const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }

    const db = readDB();
    const session = db.sessions.find((s) => s.token === token);

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    if (new Date(session.expiresAt) < new Date()) {
      // Remove expired session
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDB(db);
      res.status(401).json({ error: 'Session has expired' });
      return;
    }

    const user = db.users.find((u) => u.id === session.userId);
    if (!user) {
      res.status(401).json({ error: 'User associated with session not found' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    next();
  };

  // --- Auth Endpoints ---

  // User Signup (Register)
  app.post('/api/auth/register', (req: Request, res: Response): void => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required' });
      return;
    }

    const db = readDB();

    // Check if user already exists
    const userExists = db.users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );

    if (userExists) {
      res.status(400).json({ error: 'Username or email already registered' });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = crypto.randomUUID();

    const newUser = {
      id: userId,
      username,
      email,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Session valid for 7 days

    const newSession = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    db.users.push(newUser);
    db.sessions.push(newSession);
    writeDB(db);

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
      },
    });
  });

  // User Login
  app.post('/api/auth/login', (req: Request, res: Response): void => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newSession = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    db.sessions.push(newSession);
    writeDB(db);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  });

  // User Logout
  app.post('/api/auth/logout', (req: Request, res: Response): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const db = readDB();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDB(db);
    }

    res.status(200).json({ message: 'Successfully logged out' });
  });

  // Fetch Current User Profile
  app.get('/api/auth/user', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    res.status(200).json({ user: req.user });
  });

  // --- Task Endpoints ---

  // Get User's Tasks (with Filtering, Searching, and Sorting)
  app.get('/api/tasks', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user!.id;
    const db = readDB();

    // Filter user specific tasks
    let userTasks = db.tasks.filter((t) => t.userId === userId);

    // Apply Query Parameter Filters
    const { status, priority, q, sortBy, sortOrder } = req.query;

    if (status) {
      userTasks = userTasks.filter((t) => t.status === status);
    }

    if (priority) {
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

    // Sort Tasks
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
      // Default: sort by createdAt desc
      userTasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    res.status(200).json(userTasks);
  });

  // Create Task
  app.post('/api/tasks', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user!.id;
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
  });

  // Update Task
  app.put('/api/tasks/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user!.id;
    const taskId = req.params.id;
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
  });

  // Delete Task
  app.delete('/api/tasks/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user!.id;
    const taskId = req.params.id;

    const db = readDB();
    const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.userId === userId);

    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found or access denied' });
      return;
    }

    db.tasks.splice(taskIndex, 1);
    writeDB(db);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  });

  // Fetch Summary statistics
  app.get('/api/tasks/stats', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user!.id;
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
  });

  // --- Vite & Production Static File Serving Setup ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Server listening at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});

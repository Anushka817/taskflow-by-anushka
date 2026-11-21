/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface DBData {
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

const DB_FILE_PROD = '/tmp/tasks_db.json';
const DB_FILE_DEV = path.join(process.cwd(), 'tasks_db.json');

// On Vercel, process.cwd() is read-only, so we write to /tmp/tasks_db.json
const DB_FILE = process.env.VERCEL || process.env.NODE_ENV === 'production' ? DB_FILE_PROD : DB_FILE_DEV;

export function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const srcPath = path.join(process.cwd(), 'tasks_db.json');
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(DB_FILE, content, 'utf-8');
      } else {
        const initialData: DBData = { users: [], tasks: [], sessions: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      }
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

export function writeDB(data: DBData): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function authenticateUser(req: any, res: any): User | null {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return null;
  }

  const db = readDB();
  const session = db.sessions.find((s) => s.token === token);

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  if (new Date(session.expiresAt) < new Date()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDB(db);
    res.status(401).json({ error: 'Session has expired' });
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'User associated with session not found' });
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

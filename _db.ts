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

async function kvGet<T>(key: string): Promise<T | null> {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url) return null;

  try {
    const isUpstashREST = url.startsWith('http://') || url.startsWith('https://');
    if (isUpstashREST && token) {
      const res = await fetch(`${url}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        console.error(`KV Get failed: ${res.status} ${res.statusText}`);
        return null;
      }
      const data = await res.json() as { result: string | null };
      if (!data || data.result === null) return null;
      return JSON.parse(data.result) as T;
    }
  } catch (err) {
    console.error('Error fetching from KV:', err);
  }
  return null;
}

async function kvSet<T>(key: string, value: T): Promise<boolean> {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url) return false;

  try {
    const isUpstashREST = url.startsWith('http://') || url.startsWith('https://');
    if (isUpstashREST && token) {
      const res = await fetch(`${url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(value))
      });
      if (!res.ok) {
        console.error(`KV Set failed: ${res.status} ${res.statusText}`);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error('Error writing to KV:', err);
  }
  return false;
}

export async function readDB(): Promise<DBData> {
  try {
    // Attempt Vercel KV first
    if (process.env.KV_REST_API_URL) {
      const data = await kvGet<DBData>('tasks_db');
      if (data) {
        if (!data.users) data.users = [];
        if (!data.tasks) data.tasks = [];
        if (!data.sessions) data.sessions = [];
        return data;
      }
    }

    // Fallback to local /tmp or current file path
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
    if (!parsed.users) parsed.users = [];
    if (!parsed.sessions) parsed.sessions = [];
    return parsed;
  } catch (error) {
    console.error('Error reading DB, resetting database:', error);
    return { users: [], tasks: [], sessions: [] };
  }
}

export async function writeDB(data: DBData): Promise<void> {
  try {
    if (process.env.KV_REST_API_URL) {
      const success = await kvSet('tasks_db', data);
      if (success) return;
    }
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

export async function authenticateUser(req: any, res: any): Promise<User | null> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return null;
  }

  const db = await readDB();
  const session = db.sessions.find((s) => s.token === token);

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  if (new Date(session.expiresAt) < new Date()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    await writeDB(db);
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

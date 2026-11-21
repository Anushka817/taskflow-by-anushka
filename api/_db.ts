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
  if (!url || !token) return null;

  try {
    const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json() as { result: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch (error) {
    console.error('KV get failed:', error);
    return null;
  }
}

async function kvSet<T>(key: string, value: T): Promise<boolean> {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;

  try {
    const encodedValue = encodeURIComponent(JSON.stringify(value));
    const response = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodedValue}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      console.error('KV set failed:', await response.text());
    }
    return response.ok;
  } catch (error) {
    console.error('KV set failed:', error);
    return false;
  }
}

export async function readDB(): Promise<DBData> {
  const kvData = await kvGet<DBData>('tasks_db');
  if (kvData) {
    return {
      users: Array.isArray(kvData.users) ? kvData.users : [],
      tasks: Array.isArray(kvData.tasks) ? kvData.tasks : [],
      sessions: Array.isArray(kvData.sessions) ? kvData.sessions : [],
    };
  }

  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBData = { users: [], tasks: [], sessions: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DBData;
    parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
    parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    parsed.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    return parsed;
  } catch {
    return { users: [], tasks: [], sessions: [] };
  }
}

export async function writeDB(data: DBData): Promise<void> {
  if (await kvSet('tasks_db', data)) return;
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
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

  return { id: user.id, username: user.username, email: user.email };
}

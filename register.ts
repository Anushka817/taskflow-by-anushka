/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { readDB, writeDB, generateSalt, hashPassword, generateToken } from '../_db';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email and password are required' });
    return;
  }

  try {
    const db = await readDB();

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
    await writeDB(db);

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

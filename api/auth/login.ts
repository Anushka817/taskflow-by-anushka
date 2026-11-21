/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import {
  readDB,
  writeDB,
  hashPassword,
  generateToken,
  generateSalt,
} from '../_db.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const firebaseUid = typeof req.body.firebaseUid === 'string' ? req.body.firebaseUid.trim() : '';
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : email.split('@')[0];

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const db = await readDB();
    if (!db.users) db.users = [];
    if (!db.sessions) db.sessions = [];

    let user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      if (!firebaseUid) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
      }

      const salt = generateSalt();
      user = {
        id: firebaseUid,
        username,
        email,
        passwordHash: hashPassword(password, salt),
        salt,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    if (!firebaseUid) {
      const computedHash = hashPassword(password, user.salt);
      if (computedHash !== user.passwordHash) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
      }
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Session valid for 7 days

    const newSession = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    db.sessions.push(newSession);
    await writeDB(db);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

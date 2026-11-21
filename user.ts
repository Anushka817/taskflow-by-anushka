/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { authenticateUser } from '../_db';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  try {
    const user = await authenticateUser(req, res);
    if (!user) {
      // authenticateUser already responded with status 401
      return;
    }

    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

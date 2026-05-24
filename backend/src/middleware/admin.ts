import type { Request, Response, NextFunction } from 'express';
import type { Env } from '../config/env';

export function createAdminMiddleware(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-admin-key'];
    if (env.ADMIN_API_KEY && apiKey === env.ADMIN_API_KEY) {
      next();
      return;
    }
    if (req.user?.isAdmin) {
      next();
      return;
    }
    res.status(403).json({ error: 'Admin access required' });
  };
}

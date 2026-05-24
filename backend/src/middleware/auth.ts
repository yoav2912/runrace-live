import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Env } from '../config/env';

export interface AuthUser {
  id: string;
  username: string;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthMiddleware(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function createOptionalAuth(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
      } catch {
        // ignore
      }
    }
    next();
  };
}

export function signToken(env: Env, user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

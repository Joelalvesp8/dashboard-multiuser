import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/config';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role_id: number;
    permissions: string[];
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role_id: number;
    };

    // Buscar permissões do usuário
    const permissionsResult = await pool.query(
      `SELECT p.name
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [decoded.role_id]
    );

    req.user = {
      ...decoded,
      permissions: permissionsResult.rows.map((row) => row.name),
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

export const requirePermission = (permissionName: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!req.user.permissions.includes(permissionName)) {
      return res.status(403).json({
        error: 'Sem permissão para acessar este recurso',
        required: permissionName
      });
    }

    next();
  };
};

export const requireAnyPermission = (permissionNames: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const hasPermission = permissionNames.some(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Sem permissão para acessar este recurso',
        required: permissionNames
      });
    }

    next();
  };
};

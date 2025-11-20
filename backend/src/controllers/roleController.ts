import { Response } from 'express';
import pool from '../database/config';
import { AuthRequest } from '../middleware/auth';

export const getAllRoles = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM roles ORDER BY name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Erro ao buscar roles' });
  }
};

export const getRoleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const roleResult = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrada' });
    }

    // Buscar permissões associadas
    const permissionsResult = await pool.query(
      `SELECT p.*
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.name`,
      [id]
    );

    res.json({
      ...roleResult.rows[0],
      permissions: permissionsResult.rows,
    });
  } catch (error) {
    console.error('Get role by id error:', error);
    res.status(500).json({ error: 'Erro ao buscar role' });
  }
};

export const getAllPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM permissions ORDER BY resource, action'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verificar se role já existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(400).json({ error: 'Role com este nome já existe' });
    }

    // Criar role
    const roleResult = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    const newRole = roleResult.rows[0];

    // Associar permissões se fornecidas
    if (permissions && Array.isArray(permissions)) {
      for (const permissionId of permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [newRole.id, permissionId]
        );
      }
    }

    res.status(201).json({
      message: 'Role criada com sucesso',
      role: newRole,
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Erro ao criar role' });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Verificar se role existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrada' });
    }

    // Atualizar role
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    // Atualizar permissões se fornecidas
    if (permissions && Array.isArray(permissions)) {
      // Remover permissões antigas
      await pool.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [id]
      );

      // Adicionar novas permissões
      for (const permissionId of permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, permissionId]
        );
      }
    }

    res.json({ message: 'Role atualizada com sucesso' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se há usuários usando esta role
    const usersWithRole = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
      [id]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar role com usuários associados',
      });
    }

    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrada' });
    }

    res.json({ message: 'Role deletada com sucesso' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Erro ao deletar role' });
  }
};

export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissões devem ser um array' });
    }

    // Verificar se role existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrada' });
    }

    // Remover permissões antigas
    await pool.query(
      'DELETE FROM role_permissions WHERE role_id = $1',
      [id]
    );

    // Adicionar novas permissões
    for (const permissionId of permissions) {
      await pool.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, permissionId]
      );
    }

    res.json({ message: 'Permissões atualizadas com sucesso' });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Erro ao atualizar permissões' });
  }
};

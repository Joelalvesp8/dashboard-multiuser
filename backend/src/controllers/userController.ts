import { Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../database/config';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_active, u.created_at,
              r.id as role_id, r.name as role_name, r.description as role_description
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_active, u.created_at,
              r.id as role_id, r.name as role_name, r.description as role_description
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar permissões do usuário
    const permissionsResult = await pool.query(
      `SELECT p.name, p.description, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [result.rows[0].role_id]
    );

    res.json({
      ...result.rows[0],
      permissions: permissionsResult.rows,
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role_id } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Definir role padrão como 'user' se não fornecido
    let finalRoleId = role_id;
    if (!finalRoleId) {
      const defaultRole = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        ['user']
      );
      finalRoleId = defaultRole.rows[0].id;
    }

    // Criar usuário
    const result = await pool.query(
      `INSERT INTO users (email, password, name, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role_id, is_active, created_at`,
      [email, hashedPassword, name, finalRoleId]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, role_id, is_active } = req.body;

    // Verificar se usuário existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email já está em uso por outro usuário
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    // Construir query dinamicamente
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (role_id !== undefined) {
      updates.push(`role_id = $${paramCount}`);
      values.push(role_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, role_id, is_active, updated_at`,
      values
    );

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário
    if (req.user?.id.toString() === id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'Nova senha é obrigatória' });
    }

    // Se não é admin, verificar senha atual
    const isAdmin = req.user?.permissions.includes('manage_users');
    const isSelfUpdate = req.user?.id.toString() === id;

    if (!isAdmin && isSelfUpdate && !currentPassword) {
      return res.status(400).json({ error: 'Senha atual é obrigatória' });
    }

    // Buscar usuário
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual se necessário
    if (isSelfUpdate && currentPassword) {
      const validPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );

      if (!validPassword) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
};

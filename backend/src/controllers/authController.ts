import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/config';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Buscar permissões
    const permissionsResult = await pool.query(
      `SELECT p.name, p.description, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role_name,
        permissions: permissionsResult.rows,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const register = async (req: Request, res: Response) => {
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
       RETURNING id, email, name, role_id, created_at`,
      [email, hashedPassword, name, finalRoleId]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role_id: newUser.role_id,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_active, u.created_at, r.name as role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    // Buscar permissões
    const permissionsResult = await pool.query(
      `SELECT p.name, p.description, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_name,
      is_active: user.is_active,
      created_at: user.created_at,
      permissions: permissionsResult.rows,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

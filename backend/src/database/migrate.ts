import pool from './config';
import bcrypt from 'bcrypt';

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Tabela de Roles (Papéis)
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Permissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES roles(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de relacionamento Role-Permission (muitos para muitos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    // Inserir roles padrão
    await client.query(`
      INSERT INTO roles (name, description) VALUES
        ('admin', 'Administrador com acesso total'),
        ('manager', 'Gerente com acesso a relatórios e usuários'),
        ('user', 'Usuário padrão com acesso ao dashboard')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Inserir permissões padrão
    await client.query(`
      INSERT INTO permissions (name, description, resource, action) VALUES
        ('view_dashboard', 'Visualizar dashboard', 'dashboard', 'read'),
        ('manage_users', 'Gerenciar usuários', 'users', 'manage'),
        ('create_users', 'Criar usuários', 'users', 'create'),
        ('edit_users', 'Editar usuários', 'users', 'update'),
        ('delete_users', 'Deletar usuários', 'users', 'delete'),
        ('view_users', 'Visualizar usuários', 'users', 'read'),
        ('manage_roles', 'Gerenciar roles e permissões', 'roles', 'manage'),
        ('view_analytics', 'Visualizar analytics avançados', 'analytics', 'read'),
        ('export_data', 'Exportar dados', 'data', 'export')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Associar permissões aos roles
    const adminRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const managerRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'manager'`);
    const userRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'user'`);

    const adminRoleId = adminRoleResult.rows[0].id;
    const managerRoleId = managerRoleResult.rows[0].id;
    const userRoleId = userRoleResult.rows[0].id;

    // Admin tem todas as permissões
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions
      ON CONFLICT DO NOTHING;
    `, [adminRoleId]);

    // Manager tem permissões de visualizar e gerenciar usuários
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions WHERE name IN (
        'view_dashboard', 'view_users', 'view_analytics', 'export_data'
      )
      ON CONFLICT DO NOTHING;
    `, [managerRoleId]);

    // User tem apenas visualização do dashboard
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions WHERE name IN ('view_dashboard')
      ON CONFLICT DO NOTHING;
    `, [userRoleId]);

    // Criar usuário admin padrão
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role_id)
      VALUES ('admin@dashboard.com', $1, 'Administrador', $2)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword, adminRoleId]);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully!');
    console.log('📧 Default admin user: admin@dashboard.com');
    console.log('🔑 Default admin password: admin123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

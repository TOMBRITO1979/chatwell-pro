import { db } from '../lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { hashPassword } from '../lib/auth';

async function runMigration() {
  try {
    console.log('Iniciando migração de super admin...');

    // Criar tabela super_admins
    await db.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✓ Tabela super_admins criada');

    // Criar índices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
      CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
      CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);
    `);

    console.log('✓ Índices criados');

    // Criar trigger
    await db.query(`
      CREATE TRIGGER update_super_admins_updated_at
        BEFORE UPDATE ON super_admins
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Trigger criado');

    // Criar super admin padrão
    // Gera uma senha aleatória e segura
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || generateSecurePassword();
    const passwordHash = await hashPassword(defaultPassword);

    const result = await db.query(`
      INSERT INTO super_admins (username, password_hash, name, email)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, ['admin', passwordHash, 'Super Administrador', 'admin@chatwell.com']);

    console.log('✓ Super admin padrão criado');
    console.log('\n==============================================');
    console.log('MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('==============================================');

    if (result.rows.length > 0) {
      // Nova conta criada, mostrar senha
      console.log('Credenciais de acesso (ANOTE ESTAS INFORMAÇÕES):');
      console.log('Usuário: admin');
      console.log(`Senha: ${defaultPassword}`);
    } else {
      // Conta já existia
      console.log('Super admin já existia no banco de dados.');
      console.log('Use a senha que foi gerada na primeira execução.');
    }

    console.log('\nAcesse: /super-admin/login');
    console.log('IMPORTANTE: Guarde esta senha em local seguro!');
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();

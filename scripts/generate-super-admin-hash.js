// Script para gerar hash da senha do super admin
const bcrypt = require('bcryptjs');

const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@2025';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  }

  console.log('\n==============================================');
  console.log('HASH GERADO COM SUCESSO!');
  console.log('==============================================');
  console.log('Senha:', password);
  console.log('Hash:', hash);
  console.log('\nUse este SQL no PostgreSQL:');
  console.log('==============================================\n');

  const sql = `
-- Criar tabela super_admins
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);

-- Criar trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_super_admins_updated_at'
  ) THEN
    CREATE TRIGGER update_super_admins_updated_at
      BEFORE UPDATE ON super_admins
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Inserir super admin
INSERT INTO super_admins (username, password_hash, name, email)
VALUES (
  'admin',
  '${hash}',
  'Super Administrador',
  'admin@chatwell.com'
)
ON CONFLICT (username) DO NOTHING;
`;

  console.log(sql);
  console.log('\n==============================================');
  console.log('CREDENCIAIS DE ACESSO:');
  console.log('==============================================');
  console.log('Usuário: admin');
  console.log('Senha:', password);
  console.log('URL: https://app.chatwell.pro/super-admin/login');
  console.log('==============================================\n');

  process.exit(0);
});

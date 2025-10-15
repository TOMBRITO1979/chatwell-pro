-- ===========================================
-- MIGRATION: Add Super Admin Table
-- ===========================================

-- Tabela para super administradores
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);

-- Trigger de updated_at
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

-- ===========================================
-- CRIAR SUPER ADMIN PADRÃO
-- ===========================================
-- Hash bcrypt para senha: Admin@2025
-- IMPORTANTE: Altere a senha após o primeiro login!

INSERT INTO super_admins (username, password_hash, name, email)
VALUES (
  'admin',
  '$2a$10$YQZj5XM7LhzJfXK4xGv0KuLxQpZQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
  'Super Administrador',
  'admin@chatwell.com'
)
ON CONFLICT (username) DO NOTHING;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Credenciais de acesso:';
  RAISE NOTICE 'Usuário: admin';
  RAISE NOTICE 'Senha: Admin@2025';
  RAISE NOTICE '';
  RAISE NOTICE 'Acesse: /super-admin/login';
  RAISE NOTICE 'IMPORTANTE: Altere a senha após o primeiro login!';
  RAISE NOTICE '==============================================';
END
$$;

-- Migration: Reset Super Admin
-- Cria ou atualiza super admin e gera token de reset de senha

-- Extensão para gerar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para gerar token aleatório
CREATE OR REPLACE FUNCTION generate_random_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insere ou atualiza super admin
DO $$
DECLARE
  v_reset_token TEXT;
  v_reset_token_hash TEXT;
  v_reset_expires TIMESTAMP;
  v_temp_password TEXT;
  v_password_hash TEXT;
  v_username TEXT;
  v_email TEXT;
  v_name TEXT;
BEGIN
  -- Gera token de reset
  v_reset_token := generate_random_token(64);
  v_reset_token_hash := encode(digest(v_reset_token, 'sha256'), 'hex');
  v_reset_expires := NOW() + INTERVAL '24 hours';

  -- Senha temporária aleatória (será resetada via link)
  v_temp_password := generate_random_token(40);
  v_password_hash := crypt(v_temp_password, gen_salt('bf', 10));

  -- Credenciais configuradas (não expostas publicamente)
  v_username := 'wasolutionscorp';
  v_email := 'wasolutionscorp@gmail.com';
  v_name := 'WA Solutions Corp';

  -- Insere ou atualiza super admin
  INSERT INTO super_admins (
    username,
    email,
    name,
    password_hash,
    password_reset_token,
    password_reset_expires,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_username,
    v_email,
    v_name,
    v_password_hash,
    v_reset_token_hash,
    v_reset_expires,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email)
  DO UPDATE SET
    username = v_username,
    name = v_name,
    password_hash = v_password_hash,
    password_reset_token = v_reset_token_hash,
    password_reset_expires = v_reset_expires,
    is_active = true,
    updated_at = NOW();

  -- Exibe o token de reset (NÃO o hash)
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SUPER ADMIN RESETADO COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email: %', v_email;
  RAISE NOTICE '👤 Username: %', v_username;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Link de redefinição de senha (válido por 24h):';
  RAISE NOTICE '';
  RAISE NOTICE 'https://app.chatwell.pro/super-admin/reset-password?token=%', v_reset_token;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '1. Acesse o link acima para definir uma nova senha';
  RAISE NOTICE '2. O link expira em 24 horas';
  RAISE NOTICE '3. Após definir a senha, você poderá fazer login normalmente';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

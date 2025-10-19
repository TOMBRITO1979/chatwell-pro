# 🔐 Reset de Super Admin com SUAS Credenciais

## ⚠️ IMPORTANTE: Não Exponha Suas Credenciais

Este guia mostra como resetar o super admin **SEM expor suas credenciais** publicamente.

---

## 🎯 Opção 1: Comando Inline (Recomendado)

Execute este comando no **Console do Portainer** do container `chatwell_chatwell`:

```bash
psql $DATABASE_URL <<'EOF'
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para gerar token
CREATE OR REPLACE FUNCTION generate_random_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS \$\$
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
\$\$ LANGUAGE plpgsql;

-- Reset do Super Admin
DO \$\$
DECLARE
  v_reset_token TEXT;
  v_reset_token_hash TEXT;
  v_reset_expires TIMESTAMP;
  v_temp_password TEXT;
  v_password_hash TEXT;
  v_username TEXT := 'SEU_USERNAME_AQUI';      -- ← EDITE AQUI
  v_email TEXT := 'seu-email@exemplo.com';     -- ← EDITE AQUI
  v_name TEXT := 'Seu Nome Completo';          -- ← EDITE AQUI
BEGIN
  -- Gera token
  v_reset_token := generate_random_token(64);
  v_reset_token_hash := encode(digest(v_reset_token, 'sha256'), 'hex');
  v_reset_expires := NOW() + INTERVAL '24 hours';
  v_temp_password := generate_random_token(40);
  v_password_hash := crypt(v_temp_password, gen_salt('bf', 10));

  -- Insere ou atualiza
  INSERT INTO super_admins (
    username, email, name, password_hash,
    password_reset_token, password_reset_expires, is_active
  ) VALUES (
    v_username, v_email, v_name, v_password_hash,
    v_reset_token_hash, v_reset_expires, true
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

  -- Exibe link
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SUPER ADMIN RESETADO COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Username: %', v_username;
  RAISE NOTICE '';
  RAISE NOTICE 'Link de reset (valido 24h):';
  RAISE NOTICE 'https://app.chatwell.pro/super-admin/reset-password?token=%', v_reset_token;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END \$\$;
EOF
```

**Antes de executar:**
1. ✏️ Substitua `SEU_USERNAME_AQUI` pelo seu username
2. ✏️ Substitua `seu-email@exemplo.com` pelo seu email
3. ✏️ Substitua `Seu Nome Completo` pelo seu nome
4. ✅ Execute o comando
5. ✅ Copie o link exibido

---

## 🎯 Opção 2: Usar Arquivo SQL com Variáveis de Ambiente

### 1. Defina suas credenciais como variáveis de ambiente:

```bash
export SUPER_ADMIN_USERNAME="seu_username"
export SUPER_ADMIN_EMAIL="seu-email@exemplo.com"
export SUPER_ADMIN_NAME="Seu Nome Completo"
```

### 2. Execute o comando SQL substituindo as variáveis:

```bash
psql $DATABASE_URL <<EOF
DO \$\$
DECLARE
  v_reset_token TEXT;
  v_reset_token_hash TEXT;
  v_reset_expires TIMESTAMP;
  v_temp_password TEXT;
  v_password_hash TEXT;
  v_username TEXT := '${SUPER_ADMIN_USERNAME}';
  v_email TEXT := '${SUPER_ADMIN_EMAIL}';
  v_name TEXT := '${SUPER_ADMIN_NAME}';
BEGIN
  v_reset_token := (SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random()*62)::integer, 1), '') FROM generate_series(1, 64));
  v_reset_token_hash := encode(digest(v_reset_token, 'sha256'), 'hex');
  v_reset_expires := NOW() + INTERVAL '24 hours';
  v_temp_password := (SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random()*62)::integer, 1), '') FROM generate_series(1, 40));
  v_password_hash := crypt(v_temp_password, gen_salt('bf', 10));

  INSERT INTO super_admins (
    username, email, name, password_hash,
    password_reset_token, password_reset_expires, is_active
  ) VALUES (
    v_username, v_email, v_name, v_password_hash,
    v_reset_token_hash, v_reset_expires, true
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

  RAISE NOTICE 'Link de reset: https://app.chatwell.pro/super-admin/reset-password?token=%', v_reset_token;
END \$\$;
EOF
```

---

## 🎯 Opção 3: Usar o Arquivo Padrão (SE NÃO SE IMPORTAR)

Se você está OK com as credenciais padrão (`wasolutionscorp@gmail.com`):

```bash
psql $DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql
```

---

## ✅ Após Executar Qualquer Opção:

1. **Copie o link** exibido no terminal
2. **Cole no navegador**
3. **Defina sua nova senha** (mín. 8 caracteres, use letras, números e símbolos)
4. **Faça login** em `https://app.chatwell.pro/super-admin`

---

## 🔒 Segurança:

- ✅ O link de reset **expira em 24 horas**
- ✅ A senha temporária **nunca é exibida** (é aleatória e descartada)
- ✅ O token é **único e criptografado** (SHA-256)
- ✅ Suas credenciais **NÃO ficam no código** (você define no momento de executar)

---

## 🆘 Problemas?

### Link expirou?
Execute o comando novamente - um novo link será gerado.

### Esqueceu a senha novamente?
Execute o comando novamente sempre que precisar resetar.

### Email não chegou?
- O script **NÃO envia email** automaticamente
- Use o **link do terminal** diretamente

---

**Chatwell Pro** - Sistema Seguro de Gestão 🔒

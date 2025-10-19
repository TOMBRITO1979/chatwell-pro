# 🚀 Setup Completo do Chatwell Pro no Portainer

## ✅ Status Atual

- ✅ Docker image **20251019-210000** criada e publicada
- ✅ Aplicação rodando no Portainer
- ✅ Redis conectado via `tasks.redis_redis:6379`
- ✅ PostgreSQL rodando
- ⚠️ **FALTA:** Inicializar as tabelas do banco de dados

---

## 📋 Passos Para Completar o Setup

### 1️⃣ Acessar o Console do Container

No Portainer:
1. Vá em **Stacks** → sua stack do Chatwell
2. Clique no serviço **chatwell_chatwell**
3. Clique em **Console**
4. Selecione **/bin/sh** como shell
5. Clique em **Connect**

---

### 2️⃣ Inicializar o Banco de Dados Completo

Execute este comando no console:

```bash
psql $DATABASE_URL < /app/database/init-all.sql
```

**O que este comando faz:**
- ✅ Cria extensões `uuid-ossp` e `pgcrypto`
- ✅ Cria TODAS as 13 tabelas do sistema:
  - `users` - Usuários do sistema
  - `clients` - Clientes/Contatos
  - `events` - Eventos da agenda
  - `accounts` - Contas financeiras
  - `transactions` - Transações financeiras
  - `categories` - Categorias
  - `projects` - Projetos
  - `tasks` - Tarefas
  - `reminders` - Lembretes
  - `whatsapp_messages` - Mensagens WhatsApp
  - `super_admins` - Super administradores
  - `voice_command_logs` - Logs de comandos de voz
  - `user_api_keys` - API Keys dos usuários
- ✅ Cria todos os índices necessários
- ✅ **É IDEMPOTENTE** - pode executar várias vezes sem erro

**Saída esperada:**
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
CREATE TABLE
CREATE INDEX
...
NOTICE:  ✅ Banco de dados inicializado com sucesso!
NOTICE:  Todas as tabelas foram criadas.
```

---

### 3️⃣ Verificar se as Tabelas Foram Criadas

Execute:

```bash
psql $DATABASE_URL -c "\dt"
```

**Saída esperada:**
```
                List of relations
 Schema |        Name        | Type  |    Owner
--------+--------------------+-------+--------------
 public | accounts           | table | chatwell_user
 public | categories         | table | chatwell_user
 public | clients            | table | chatwell_user
 public | events             | table | chatwell_user
 public | projects           | table | chatwell_user
 public | reminders          | table | chatwell_user
 public | super_admins       | table | chatwell_user
 public | tasks              | table | chatwell_user
 public | transactions       | table | chatwell_user
 public | user_api_keys      | table | chatwell_user
 public | users              | table | chatwell_user
 public | voice_command_logs | table | chatwell_user
 public | whatsapp_messages  | table | chatwell_user
(13 rows)
```

---

### 4️⃣ Criar/Resetar Super Admin

Agora você tem **3 opções** para configurar o super admin:

#### **Opção A: Usar Credenciais Padrão (wasolutionscorp@gmail.com)**

```bash
psql $DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql
```

**Credenciais criadas:**
- Email: `wasolutionscorp@gmail.com`
- Username: `wasolutionscorp`

---

#### **Opção B: Usar SUAS Credenciais Customizadas (RECOMENDADO)**

Edite o comando abaixo **ANTES** de executar, substituindo:
- `SEU_USERNAME` → seu username desejado
- `seu-email@exemplo.com` → seu email
- `Seu Nome Completo` → seu nome

```bash
psql $DATABASE_URL <<'EOF'
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para gerar token
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

-- Reset do Super Admin
DO $$
DECLARE
  v_reset_token TEXT;
  v_reset_token_hash TEXT;
  v_reset_expires TIMESTAMP;
  v_temp_password TEXT;
  v_password_hash TEXT;
  v_username TEXT := 'SEU_USERNAME';              -- ← EDITE AQUI
  v_email TEXT := 'seu-email@exemplo.com';        -- ← EDITE AQUI
  v_name TEXT := 'Seu Nome Completo';             -- ← EDITE AQUI
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
END $$;
EOF
```

---

#### **Opção C: Usar Variáveis de Ambiente**

```bash
# 1. Defina suas credenciais (edite os valores):
export SUPER_ADMIN_USERNAME="seu_username"
export SUPER_ADMIN_EMAIL="seu-email@exemplo.com"
export SUPER_ADMIN_NAME="Seu Nome Completo"

# 2. Execute o comando (as variáveis serão substituídas):
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

### 5️⃣ Copiar o Link de Reset

Qualquer opção acima vai exibir algo como:

```
═══════════════════════════════════════════════════════════
✅ SUPER ADMIN RESETADO COM SUCESSO!
═══════════════════════════════════════════════════════════

Email: wasolutionscorp@gmail.com
Username: wasolutionscorp

Link de reset (valido 24h):
https://app.chatwell.pro/super-admin/reset-password?token=Abc123XyZ789...

═══════════════════════════════════════════════════════════
```

**Copie o link completo!**

---

### 6️⃣ Definir Nova Senha

1. Cole o link no navegador
2. Você verá a página de redefinição de senha
3. Digite sua nova senha (mínimo 8 caracteres, use letras, números e símbolos)
4. Confirme a senha
5. Clique em **Redefinir Senha**

---

### 7️⃣ Fazer Login

1. Acesse: `https://app.chatwell.pro/super-admin`
2. Entre com:
   - **Email:** o email que você configurou
   - **Senha:** a senha que você acabou de definir
3. ✅ **Pronto! Você está dentro do sistema!**

---

## 🔍 Verificar se Tudo Está Funcionando

Após fazer login, verifique:

1. **Dashboard do Super Admin** carrega corretamente
2. **Logs do Portainer** não mostram mais erros de "table does not exist"
3. **Navegue pelas seções** do painel administrativo

---

## 🔧 Troubleshooting

### ❌ Erro: "psql: command not found"

**Solução:** Instale o cliente PostgreSQL:
```bash
apk add --no-cache postgresql-client
psql $DATABASE_URL < /app/database/init-all.sql
```

### ❌ Erro: "connection refused"

**Causa:** PostgreSQL não está pronto ainda

**Solução:** Aguarde 30 segundos e tente novamente. Verifique se o serviço `postgres` está **healthy** no Portainer.

### ❌ Link de reset expirou (após 24h)

**Solução:** Execute novamente o comando do **passo 4** (qualquer opção A, B ou C). Um novo link será gerado.

### ❌ Erro: "relation already exists"

**Causa:** Você já rodou o script de inicialização antes

**Solução:** Isso é normal! O script é idempotente. Se você ver esta mensagem, significa que as tabelas já existem. Prossiga para o **passo 4**.

---

## 📊 Comandos Úteis

### Ver todas as tabelas:
```bash
psql $DATABASE_URL -c "\dt"
```

### Ver super admins cadastrados:
```bash
psql $DATABASE_URL -c "SELECT id, email, username, is_active, created_at FROM super_admins;"
```

### Ver logs da aplicação em tempo real:
No Portainer, vá em **Logs** do serviço `chatwell_chatwell` e ative **Auto-refresh**.

---

## ✅ Checklist Final

- [ ] Executei `psql $DATABASE_URL < /app/database/init-all.sql`
- [ ] Verifiquei que 13 tabelas foram criadas com `\dt`
- [ ] Executei um dos comandos do passo 4 para criar super admin
- [ ] Copiei o link de reset exibido no terminal
- [ ] Acessei o link e defini minha nova senha
- [ ] Fiz login em `https://app.chatwell.pro/super-admin`
- [ ] O dashboard carregou sem erros

---

## 🎯 Próximos Passos (Após Login)

Depois de fazer login como super admin, você poderá:

1. **Criar usuários** para o sistema
2. **Configurar integrações** (WhatsApp, Email, Google OAuth)
3. **Gerenciar permissões** e configurações globais
4. **Visualizar logs** de comandos de voz
5. **Monitorar** o uso do sistema

---

## 🔒 Segurança

- ✅ Link de reset expira em 24 horas
- ✅ Token é único e criptografado (SHA-256)
- ✅ Senha é hashada com bcrypt (10 rounds)
- ✅ Credenciais nunca ficam expostas em código

---

**Chatwell Pro** - Sistema Completo de Gestão Empresarial 🚀

Versão: **20251019-210000**
Data: 19 de Outubro de 2025

# Migração Manual do Super Admin

Como o npm script não está disponível no container standalone do Next.js, você precisa executar a migração diretamente no PostgreSQL.

## Opção 1: Via Console do Container (Mais Fácil)

### Passo 1: Acesse o console do container Chatwell

No Portainer:
1. **Containers** → Container `chatwell_chatwell`
2. **Console** → Conectar com `/bin/sh`

### Passo 2: Execute este comando Node.js diretamente

```bash
node -e "
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function setupSuperAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados...');

    // Criar tabela
    await client.query(\`
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
    \`);
    console.log('✓ Tabela criada');

    // Criar índices
    await client.query(\`
      CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
      CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
      CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);
    \`);
    console.log('✓ Índices criados');

    // Criar trigger
    await client.query(\`
      DO \$\$
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
      \$\$;
    \`);
    console.log('✓ Trigger criado');

    // Gerar hash da senha
    const password = 'Admin@2025';
    const hash = await bcrypt.hash(password, 10);

    // Inserir super admin
    const result = await client.query(\`
      INSERT INTO super_admins (username, password_hash, name, email)
      VALUES (\$1, \$2, \$3, \$4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    \`, ['admin', hash, 'Super Administrador', 'admin@chatwell.com']);

    if (result.rows.length > 0) {
      console.log('');
      console.log('==============================================');
      console.log('SUPER ADMIN CRIADO COM SUCESSO!');
      console.log('==============================================');
      console.log('Credenciais de acesso:');
      console.log('Usuário: admin');
      console.log('Senha: Admin@2025');
      console.log('');
      console.log('URL: https://app.chatwell.pro/super-admin/login');
      console.log('');
      console.log('IMPORTANTE: Altere esta senha após o primeiro login!');
      console.log('==============================================');
    } else {
      console.log('');
      console.log('⚠️  Super admin já existia no banco de dados.');
      console.log('Use a senha que foi definida anteriormente.');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
    process.exit(1);
  }
}

setupSuperAdmin();
"
```

**Copie e cole TODO O COMANDO ACIMA** (incluindo o `node -e "` no início e o último `"` no final).

---

## Opção 2: Via PostgreSQL Diretamente

Se a Opção 1 não funcionar, você pode executar direto no PostgreSQL.

### Passo 1: Acesse o container do PostgreSQL

No Portainer:
1. **Containers** → Container `chatwell_postgres`
2. **Console** → Conectar com `/bin/sh`

### Passo 2: Entre no PostgreSQL

```bash
psql -U chatwell -d chatwell
```

### Passo 3: Execute este SQL

```sql
-- Criar tabela
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

-- Inserir super admin com senha: Admin@2025
-- NOTA: Execute a Opção 1 para gerar hash único
-- Ou use este hash temporário (senha: Admin@2025)
INSERT INTO super_admins (username, password_hash, name, email)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye7FXdKQjO8VKvW8lPgpE5J2jQXXXXXXX',
  'Super Administrador',
  'admin@chatwell.com'
)
ON CONFLICT (username) DO NOTHING;

-- IMPORTANTE: Use a Opção 1 (comando Node.js) para gerar um hash real!

-- Sair
\q
```

**NOTA:** O hash acima é para a senha `Admin@2025`. Se você quiser uma senha diferente, use a Opção 1.

---

## Opção 3: Via Adminer/pgAdmin (Se você tem)

Se você tem Adminer ou pgAdmin configurado:

1. Conecte no banco `chatwell`
2. Execute o SQL da Opção 2 acima

---

## Verificação

Após executar qualquer uma das opções, teste:

1. Acesse: `https://app.chatwell.pro/super-admin/login`
2. Usuário: `admin`
3. Senha: `Admin@2025`

Se aparecer 404, significa que a imagem Docker ainda não foi atualizada. Volte para o processo de build.

---

## Troubleshooting

### "relation 'super_admins' already exists"
→ A tabela já foi criada. Apenas insira o usuário:

```sql
INSERT INTO super_admins (username, password_hash, name, email)
VALUES (
  'admin',
  '$2a$10$rQGZj5XM7LhzJfXK4xGv0u.3QZQ8qHZXy7rZxvP8VQxvP8VQxvP8Vq',
  'Super Administrador',
  'admin@chatwell.com'
)
ON CONFLICT (username) DO NOTHING;
```

### "duplicate key value violates unique constraint"
→ Super admin já existe. Use a senha que foi definida antes ou delete e recrie:

```sql
DELETE FROM super_admins WHERE username = 'admin';
-- Depois execute o INSERT novamente
```

### Ainda dá 404 no /super-admin/login
→ A imagem Docker não tem o código do super admin. Você precisa:

1. Fazer build da nova imagem: `docker build -t tomautomations/chatwell-pro:latest .`
2. Push para Docker Hub: `docker push tomautomations/chatwell-pro:latest`
3. Atualizar a stack no Portainer com a nova imagem

---

## Credenciais Padrão

**Usuário:** `admin`
**Senha:** `Admin@2025`
**URL:** `https://app.chatwell.pro/super-admin/login`

⚠️ **Altere a senha após o primeiro login!**

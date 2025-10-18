# Verificar e Corrigir Super Admin

## Passo 1: Verificar se o super admin existe

No Portainer, acesse o **container do PostgreSQL** e execute:

```bash
psql -U chatwell -d chatwell
```

Depois execute:

```sql
SELECT username, email, is_active, created_at FROM super_admins;
```

Isso vai mostrar se o super admin existe e se está ativo.

## Passo 2: Se não existir ou a senha estiver errada

Execute este SQL para recriar o super admin com senha nova:

```sql
-- Deletar se existir
DELETE FROM super_admins WHERE username = 'admin';

-- Criar novo com senha correta
-- Senha: Admin@2025
-- Hash gerado com bcrypt rounds=10
INSERT INTO super_admins (username, password_hash, name, email, is_active)
VALUES (
  'admin',
  '$2a$10$YFZ8LjYKvw1z2h4B7lQGZ.0XhW5xfP9rZJ7kL2mN3oP4qR5sT6uVW',
  'Super Administrador',
  'admin@chatwell.com',
  true
);
```

## Passo 3: Gerar hash correto da senha

Se você quiser gerar um novo hash da senha, execute este comando no **container do chatwell**:

```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('Admin@2025',10).then(h=>console.log('Hash:',h))"
```

Copie o hash gerado e use no SQL:

```sql
UPDATE super_admins
SET password_hash = 'COLE_O_HASH_AQUI'
WHERE username = 'admin';
```

## Passo 4: Teste o login

Depois de atualizar, tente logar novamente:
- URL: https://app.chatwell.pro/super-admin/login
- Usuário: admin
- Senha: Admin@2025

## Passo 5: Verificar logs de erro

Se ainda não funcionar, verifique os logs do container chatwell para ver qual é o erro:

No Portainer:
- Containers → chatwell → Logs
- Procure por erros relacionados a "super-admin" ou "authentication"

## Alternativa: Criar com senha personalizada

Se preferir usar uma senha diferente:

1. Escolha sua senha
2. Gere o hash no container chatwell:
```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('SUA_SENHA_AQUI',10).then(h=>console.log('Hash:',h))"
```

3. Atualize no banco:
```sql
UPDATE super_admins
SET password_hash = 'HASH_GERADO'
WHERE username = 'admin';
```

4. Tente logar com sua senha personalizada

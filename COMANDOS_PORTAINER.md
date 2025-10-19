# 🚀 Comandos para Executar no Portainer

## ✅ SOLUÇÃO DEFINITIVA - Comandos SQL Diretos

Execute estes comandos no **Console do container `chatwell_chatwell`** após fazer deploy da stack.

---

## 1️⃣ Inicializar Banco de Dados Completo

```bash
psql $DATABASE_URL < /app/database/init-all.sql
```

**O que faz:**
- ✅ Cria TODAS as tabelas (users, clients, events, accounts, etc.)
- ✅ Cria índices e constraints
- ✅ Cria tabela super_admins
- ✅ Cria tabela voice_command_logs
- ✅ Cria funções necessárias
- ✅ **Idempotente** - pode executar múltiplas vezes sem erro!

---

## 2️⃣ Resetar Super Admin

```bash
psql $DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql
```

**O que faz:**
- ✅ Cria/atualiza super admin com email `wasolutionscorp@gmail.com`
- ✅ Gera token de redefinição de senha (válido 24h)
- ✅ **EXIBE O LINK DE RESET NO TERMINAL**

**Saída esperada:**
```
═══════════════════════════════════════════════════════════
✅ SUPER ADMIN RESETADO COM SUCESSO!
═══════════════════════════════════════════════════════════

📧 Email: wasolutionscorp@gmail.com
👤 Username: wasolutionscorp

🔐 Link de redefinição de senha (válido por 24h):

https://app.chatwell.pro/super-admin/reset-password?token=ABC123...

═══════════════════════════════════════════════════════════
```

---

## 🎯 Sequência Completa de Deploy:

```bash
# 1. Faça deploy da stack no Portainer com chatwell-stack-fixed.yml

# 2. Aguarde todos os serviços ficarem healthy (2-3 minutos)

# 3. Acesse o Console do container chatwell_chatwell

# 4. Execute o comando de inicialização:
psql $DATABASE_URL < /app/database/init-all.sql

# 5. Execute o comando de reset do super admin:
psql $DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql

# 6. Copie o link exibido no terminal

# 7. Acesse o link no navegador

# 8. Defina sua nova senha segura

# 9. Faça login em https://app.chatwell.pro/super-admin
```

---

## ⚠️ Notas Importantes:

1. **psql já está instalado** no container chatwell (vem no node:20-alpine + postgresql-client)
2. **$DATABASE_URL** já está configurado nas variáveis de ambiente
3. Os scripts SQL são **idempotentes** - não dão erro se executados várias vezes
4. O link de reset **expira em 24 horas** - se expirar, execute o comando 2 novamente

---

## 🔧 Troubleshooting:

### Erro: "psql: command not found"

**Solução:** Instale o cliente PostgreSQL:
```bash
apk add --no-cache postgresql-client
psql $DATABASE_URL < /app/database/init-all.sql
```

### Erro: "connection refused"

**Causa:** PostgreSQL não está rodando ou DATABASE_URL incorreta

**Solução:**
```bash
# Verifique se o serviço postgres está healthy no Portainer
# Verifique a variável:
echo $DATABASE_URL
```

### Link de reset expirou

**Solução:** Execute novamente:
```bash
psql $DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql
```

Um novo link será gerado.

---

## 📊 Verificar se o Banco Está Criado:

```bash
psql $DATABASE_URL -c "\dt"
```

**Saída esperada:**
```
                List of relations
 Schema |        Name        | Type  |    Owner
--------+--------------------+-------+--------------
 public | accounts           | table | chatwell_user
 public | clients            | table | chatwell_user
 public | events             | table | chatwell_user
 public | projects           | table | chatwell_user
 public | super_admins       | table | chatwell_user
 public | tasks              | table | chatwell_user
 public | users              | table | chatwell_user
 public | voice_command_logs | table | chatwell_user
```

---

## ✅ Pronto!

Agora você pode:
- Acessar `https://app.chatwell.pro/super-admin`
- Fazer login com sua nova senha
- Gerenciar usuários e configurações do sistema

---

**Chatwell Pro** - Sistema Seguro de Gestão 🔒

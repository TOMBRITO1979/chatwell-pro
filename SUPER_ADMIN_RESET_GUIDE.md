# 🔐 Guia de Reset do Super Admin

## 🎯 Cenário: Perdeu a senha do Super Admin?

Este guia mostra como resetar o Super Admin e definir uma nova senha.

---

## ⚡ Método Rápido (Recomendado)

### Via Container Docker (Produção):

```bash
# 1. Acessar container do Chatwell
docker exec -it $(docker ps -qf "name=chatwell_chatwell") sh

# 2. Executar script de reset
npm run super-admin:reset

# 3. Copiar o link de redefinição exibido
# 4. Acessar o link no navegador
# 5. Definir nova senha
```

### Via Local (Desenvolvimento):

```bash
# 1. Ir para pasta do projeto
cd C:\Users\scrap\chatwell_pro\chatwell-pro-main\chatwell-pro-main

# 2. Configurar DATABASE_URL
export DATABASE_URL="postgresql://chatwell:SENHA@localhost:5432/chatwell"

# 3. Executar script
npm run super-admin:reset

# 4. Acessar o link exibido
```

---

## 📧 Credenciais Configuradas

O script irá configurar/atualizar para:

- **Email:** (email será exibido ao executar o script)
- **Username:** (username será exibido ao executar o script)
- **Senha:** Será definida através do link de redefinição

**⚠️ IMPORTANTE:** As credenciais reais não são exibidas publicamente por segurança.

---

## 🔄 O que o script faz?

1. ✅ Conecta no banco de dados
2. ✅ Cria ou atualiza o super admin com o email especificado
3. ✅ Gera token de redefinição de senha (válido por 24h)
4. ✅ Exibe link de redefinição
5. ✅ Tenta enviar email automaticamente (se configurado)

---

## 📝 Exemplo de Saída

```
🔄 Conectando ao banco de dados...
✅ Super Admin atualizado com sucesso!

═══════════════════════════════════════════════════════════
✅ SUPER ADMIN RESETADO COM SUCESSO!
═══════════════════════════════════════════════════════════

📧 Email: [seu-email-configurado]
👤 Username: [seu-username-configurado]

🔐 Link de redefinição de senha (válido por 24h):

https://app.chatwell.pro/super-admin/reset-password?token=abc123...

═══════════════════════════════════════════════════════════

⚠️  IMPORTANTE:
1. Acesse o link acima para definir uma nova senha
2. O link expira em 24 horas
3. Após definir a senha, você poderá fazer login normalmente

═══════════════════════════════════════════════════════════
```

---

## 🌐 Acessar Link de Redefinição

1. **Copie o link** exibido no terminal
2. **Cole no navegador**
3. **Defina uma nova senha segura:**
   - Mínimo 8 caracteres
   - Letras maiúsculas e minúsculas
   - Números
   - Caracteres especiais

4. **Faça login** em `https://app.chatwell.pro/super-admin`

---

## 📧 Email Automático

Se você tiver configurado SMTP, o email será enviado automaticamente para o endereço configurado.

### Verificar Configuração de Email:

```bash
# No container
echo $EMAIL_HOST
echo $EMAIL_USER

# Ou verificar no Portainer:
# Stacks → chatwell → Environment variables
```

### Configurar Email (se não estiver):

No Portainer, adicione:

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = seu-email@gmail.com
EMAIL_PASS = senha-de-app-gmail
```

---

## 🆘 Troubleshooting

### Erro: "Tabela super_admins não existe"

**Solução:**
```bash
# Criar tabela primeiro
npm run super-admin:setup
```

### Erro: "Connection refused"

**Causa:** DATABASE_URL incorreta

**Solução:**
```bash
# Verificar conexão
echo $DATABASE_URL

# Ou definir manualmente
export DATABASE_URL="postgresql://chatwell:SENHA@HOST:5432/chatwell"
```

### Link expirou (24h)

**Solução:**
```bash
# Execute novamente para gerar novo link
npm run super-admin:reset
```

### Email não chegou

**Soluções:**
1. Verifique spam/lixeira
2. Verifique configurações SMTP
3. Use o link do terminal diretamente

---

## 🔒 Segurança

### ✅ Boas Práticas:

- ✅ Nunca compartilhe o link de redefinição
- ✅ Não salve senhas em texto plano
- ✅ Use senhas fortes e únicas
- ✅ Troque senhas periodicamente (90 dias)
- ✅ Ative 2FA quando disponível

### ⚠️ Se o link vazar:

1. **Execute o script novamente** - isso invalida links anteriores
2. **Troque a senha imediatamente** após definir
3. **Verifique logs** de acesso

---

## 🔄 Método Alternativo (Manual)

Se o script não funcionar, você pode resetar manualmente:

### Via PostgreSQL:

```bash
# 1. Acessar PostgreSQL
docker exec -it $(docker ps -qf "name=postgres") psql -U chatwell -d chatwell

# 2. Gerar hash de senha
# (use outro terminal para gerar)
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('SuaNovaSenha',10).then(h=>console.log(h));"

# 3. Atualizar no banco
UPDATE super_admins
SET password_hash = 'HASH_GERADO_ACIMA',
    updated_at = NOW()
WHERE email = 'seu-email@exemplo.com';

# 4. Verificar
SELECT username, email, is_active FROM super_admins;
```

---

## 📊 Verificar Super Admins Existentes

```bash
# Via container
docker exec -it $(docker ps -qf "name=postgres") \
  psql -U chatwell -d chatwell \
  -c "SELECT id, username, email, is_active, created_at FROM super_admins;"
```

---

## 🎯 Resumo Rápido

```bash
# Resetar super admin (Produção)
docker exec -it $(docker ps -qf "name=chatwell_chatwell") npm run super-admin:reset

# Resetar super admin (Local)
npm run super-admin:reset
```

**Pronto!** Acesse o link exibido e defina sua nova senha. ✅

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique logs: `docker logs chatwell_chatwell`
2. Verifique banco: Logs do PostgreSQL
3. Consulte: `SUPER_ADMIN_COMPLETE.md`

---

**Chatwell Pro** - Sistema Seguro de Gestão 🔒

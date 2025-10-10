# 🔐 Security Notice - Configuração de Credenciais

## ⚠️ IMPORTANTE: NÃO COMMITAR SENHAS REAIS!

Este repositório contém arquivos `.example` que devem ser copiados e preenchidos com suas credenciais reais localmente.

## 📋 Arquivos de Configuração

### Arquivos para copiar localmente:

```bash
# Copiar e preencher com suas credenciais:
cp docker-compose-stack.yml.example docker-compose-stack.yml
```

### Arquivos que NÃO devem ser commitados:

- `docker-compose-stack.yml` (use `.example`)
- `DEPLOY_PORTAINER.md` (documentação local)
- `README_v3.*.md` (documentação local)
- `.env` (sempre ignorado)

## 🔑 Credenciais Necessárias

Você precisa configurar as seguintes credenciais em `docker-compose-stack.yml`:

### 1. PostgreSQL
```env
POSTGRES_PASSWORD: SUA_SENHA_POSTGRES_AQUI
DATABASE_URL: postgresql://chatwell:SUA_SENHA_POSTGRES_AQUI@postgres:5432/chatwell
```

### 2. JWT Secret
```env
JWT_SECRET: SEU_JWT_SECRET_AQUI
```
> Gere com: `openssl rand -base64 32`

### 3. Gmail SMTP
```env
DEFAULT_SMTP_USER: "seu-email@gmail.com"
DEFAULT_SMTP_PASS: "sua-app-password-aqui"
DEFAULT_FROM_EMAIL: "seu-email@gmail.com"
```
> Como obter: https://support.google.com/mail/answer/185833

### 4. WAHA (WhatsApp)
```env
WAHA_BASE_URL: "https://sua-instancia-waha.com"
WAHA_API_KEY: "sua-api-key-waha"
WAHA_SESSION_NAME: "seu-session-name"
WAHA_DEFAULT_PHONE: "5511999999999@c.us"
```

### 5. Cron Secret
```env
CRON_SECRET: "seu-cron-secret-aqui"
```
> Gere com: `openssl rand -base64 24`

### 6. Google OAuth (Opcional)
```env
GOOGLE_CLIENT_ID: "seu-google-client-id"
GOOGLE_CLIENT_SECRET: "seu-google-client-secret"
```

## 📝 Instruções de Setup

1. **Copiar arquivo example:**
   ```bash
   cp docker-compose-stack.yml.example docker-compose-stack.yml
   ```

2. **Editar com suas credenciais:**
   ```bash
   nano docker-compose-stack.yml
   # ou use seu editor preferido
   ```

3. **Nunca commitar o arquivo real:**
   ```bash
   # Verificar se está no .gitignore:
   git status
   # docker-compose-stack.yml NÃO deve aparecer
   ```

4. **Deploy no Portainer:**
   - Copie o conteúdo de `docker-compose-stack.yml` (com suas credenciais)
   - Cole no Portainer
   - Deploy

## 🚨 Se Você Já Commitou Senhas

Se você acidentalmente commitou senhas, faça:

1. **Trocar TODAS as senhas imediatamente:**
   - PostgreSQL
   - JWT Secret
   - Gmail App Password
   - WAHA API Key
   - Cron Secret

2. **Remover do histórico do Git:**
   ```bash
   # Cuidado! Isso reescreve o histórico
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch docker-compose-stack.yml' \
     --prune-empty --tag-name-filter cat -- --all

   git push origin --force --all
   ```

3. **Atualizar .gitignore e usar .example**

## 📞 Suporte

Se você tem dúvidas sobre segurança:
- GitHub Issues: https://github.com/TOMBRITO1979/chatwell-pro/issues
- Documentação: Ver arquivos .example

---

**Nunca compartilhe suas credenciais reais!**

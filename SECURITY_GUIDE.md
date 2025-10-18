# 🔒 Guia de Segurança - Chatwell Pro

## ✅ LIMPEZA DE SENHAS REALIZADA

Todos os arquivos com senhas hardcoded foram corrigidos!

---

## 📝 RESUMO DAS ALTERAÇÕES

### ✅ Arquivos Corrigidos

#### 1. `generate_hash.py`
**Antes:** Senha hardcoded no código
```python
password = '9CBDxgsdlAvKKkc1F9apu7S3dMO9hM...'  ❌
```

**Depois:** Usa variável de ambiente
```python
password = os.getenv('SUPER_ADMIN_PASSWORD')  ✅
```

**Como usar:**
```bash
export SUPER_ADMIN_PASSWORD="sua_senha_segura"
python generate_hash.py [username]
```

---

#### 2. `generate-hash.js`
**Antes:** Senha hardcoded
```javascript
const password = 'Admin@2025';  ❌
```

**Depois:** Usa variável de ambiente
```javascript
const password = process.env.SUPER_ADMIN_PASSWORD;  ✅
```

**Como usar:**
```bash
export SUPER_ADMIN_PASSWORD="sua_senha_segura"
node generate-hash.js
```

---

#### 3. `update-super-admin.js`
**Antes:** Credenciais hardcoded
```javascript
const username = 'wasolutionscorpleo';  ❌
const password = '9CBDxgsdlAvKKkc1F9apu7S3dMO9hM...';  ❌
```

**Depois:** Usa variáveis de ambiente
```javascript
const username = process.env.SUPER_ADMIN_USERNAME || 'admin';  ✅
const password = process.env.SUPER_ADMIN_PASSWORD;  ✅
```

**Como usar:**
```bash
export SUPER_ADMIN_USERNAME="seu_usuario"
export SUPER_ADMIN_PASSWORD="sua_senha_segura"
node update-super-admin.js
```

---

#### 4. `chatwell-stack.yml`
**Já estava correto!** ✅

Usa variáveis de ambiente:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
WAHA_API_KEY: ${WAHA_API_KEY}
JWT_SECRET: ${JWT_SECRET}
```

---

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Para Produção (Docker/Portainer)

Configure estas variáveis no Portainer ou crie um arquivo `.env` (NÃO commitar!):

```bash
# Database
POSTGRES_PASSWORD=senha_super_segura_aqui
REDIS_PASSWORD=outra_senha_segura

# JWT
JWT_SECRET=chave_jwt_minimo_32_caracteres_aleatoria

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_app_gmail

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret

# WhatsApp API (opcional)
WAHA_BASE_URL=https://sua-waha-url.com
WAHA_API_KEY=sua_api_key_waha

# Domain
DOMAIN=app.chatwell.pro
```

### Para Desenvolvimento Local

Crie `.env.local` (já está no .gitignore):

```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

---

## 🚫 NUNCA COMMITAR

### ❌ Arquivos proibidos no Git:

- `.env`
- `.env.local`
- `docker-compose.override.yml`
- Qualquer arquivo com senhas reais
- `chatwell-stack.yml` com valores hardcoded
- Backups de banco com dados reais
- Certificados SSL (*.pem, *.key)

### ✅ Pode commitar:

- `.env.example` (com valores de exemplo)
- `chatwell-stack.yml` (com variáveis `${VAR}`)
- Código fonte
- Documentação
- Scripts que usam variáveis de ambiente
- Arquivos de configuração template

---

## 🔒 BOAS PRÁTICAS

### 1. Senhas Fortes

```bash
# Gerar senha segura
openssl rand -base64 32

# Ou
head -c 32 /dev/urandom | base64
```

### 2. Rotação de Senhas

- ✅ Trocar senhas a cada 90 dias
- ✅ Nunca reusar senhas antigas
- ✅ Usar senhas diferentes para cada serviço

### 3. Secrets no Docker

Use Docker Secrets ao invés de variáveis de ambiente:

```bash
# Criar secret
echo "minha_senha_super_segura" | docker secret create postgres_password -

# Usar no stack
services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

### 4. API Keys

- ✅ Cada usuário tem sua própria API Key
- ✅ API Keys podem ser revogadas
- ✅ Use HTTPS sempre
- ✅ Implemente rate limiting

---

## 🔍 VERIFICAR SE HÁ SENHAS EXPOSTAS

### Antes de commitar:

```bash
# Procurar por senhas no código
grep -r "password.*=.*['\"]" . --exclude-dir=node_modules --exclude-dir=.next

# Procurar por API keys
grep -r "api_key.*=.*['\"]" . --exclude-dir=node_modules --exclude-dir=.next

# Procurar por secrets
grep -r "secret.*=.*['\"]" . --exclude-dir=node_modules --exclude-dir=.next
```

### Verificar histórico do Git:

```bash
# Procurar senhas no histórico
git log -S"password" --all

# Se encontrar, remover do histórico:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ARQUIVO_COM_SENHA" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🚀 SETUP SEGURO NO PORTAINER

### 1. Criar Stack Variables

No Portainer, vá em **Stacks** → **chatwell** → **Environment variables**:

```
POSTGRES_PASSWORD = (senha gerada)
REDIS_PASSWORD = (senha gerada)
JWT_SECRET = (chave aleatória longa)
EMAIL_PASS = (senha de app Gmail)
WAHA_API_KEY = (sua chave WAHA)
DOMAIN = app.chatwell.pro
```

### 2. Deploy

```bash
docker stack deploy -c chatwell-stack.yml chatwell
```

As variáveis do Portainer serão injetadas automaticamente!

---

## 📊 CHECKLIST DE SEGURANÇA

Antes de fazer deploy:

- [ ] Todas as senhas estão em variáveis de ambiente
- [ ] Arquivo `.env` está no `.gitignore`
- [ ] Nenhuma senha hardcoded no código
- [ ] Senhas fortes (min 20 caracteres)
- [ ] JWT_SECRET tem min 32 caracteres
- [ ] HTTPS configurado (Let's Encrypt)
- [ ] Firewall configurado (só portas 80/443)
- [ ] Backups automáticos do banco
- [ ] Rate limiting configurado
- [ ] Logs de auditoria ativados

---

## 🆘 SE VOCÊ COMMITOU UMA SENHA

### Ação Imediata:

1. **TROQUE A SENHA IMEDIATAMENTE**
   ```bash
   # Gerar nova senha
   NEW_PASSWORD=$(openssl rand -base64 32)
   echo $NEW_PASSWORD

   # Atualizar no sistema
   export SUPER_ADMIN_PASSWORD="$NEW_PASSWORD"
   node update-super-admin.js
   ```

2. **Remova do histórico Git**
   ```bash
   # Remover arquivo
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch ARQUIVO" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (CUIDADO!)
   git push origin --force --all
   ```

3. **Revogue API Keys comprometidas**
   ```bash
   curl -X DELETE https://app.chatwell.pro/api/user/api-key \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Notifique a equipe**
   - Avise sobre o incidente
   - Documente o que aconteceu
   - Implemente medidas preventivas

---

## 📚 RECURSOS

### Ferramentas de Segurança

- **git-secrets**: Previne commits com senhas
  ```bash
  git secrets --install
  git secrets --register-aws
  ```

- **truffleHog**: Encontra segredos no Git
  ```bash
  truffleHog --regex --entropy=False .
  ```

- **gitleaks**: Detector de segredos
  ```bash
  gitleaks detect --source . --verbose
  ```

### Links Úteis

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [GitHub Security Advisories](https://docs.github.com/en/code-security)

---

## 📞 CONTATO

Em caso de incidente de segurança:

1. **NÃO IGNORE**
2. Avise a equipe imediatamente
3. Documente o ocorrido
4. Siga os passos de mitigação acima
5. Revise os processos para evitar reincidência

---

**Lembre-se:** Segurança não é opcional, é essencial! 🔒

_Atualizado: 2025-10-18_

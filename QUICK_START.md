# Quick Start - Deploy Super Admin em 5 Minutos

## 🚀 Comandos Rápidos

### 1️⃣ Fazer Login no Docker Hub
```bash
docker login
# Username: tomautomations
# Password: <sua senha>
```

### 2️⃣ Build e Push (Execute o script)
```bash
# Método mais fácil - Execute o script:
build-and-push.bat

# Ou manualmente:
docker build -t tomautomations/chatwell-pro:latest .
docker push tomautomations/chatwell-pro:latest
```

### 3️⃣ Atualizar Stack no Portainer

Edite sua stack e mude a linha da imagem para:
```yaml
chatwell:
  image: tomautomations/chatwell-pro:latest  # Mudou aqui!
```

Clique em **"Update the stack"** com **"Pull latest image"** marcado.

### 4️⃣ Executar Migração

No console do container (via Portainer):
```bash
npm run super-admin:setup
```

**⚠️ ANOTE AS CREDENCIAIS QUE APARECERÃO!**

### 5️⃣ Acessar

```
https://app.chatwell.pro/super-admin/login
```

Usuário: `admin`
Senha: `<a que foi exibida na migração>`

---

## 📝 Detalhes da Sua Stack

Sua stack atual usa:
- **Imagem atual:** `tomautomations/chatwell-pro:20251014-233500`
- **Precisa mudar para:** `tomautomations/chatwell-pro:latest`

### Localização dos arquivos do super admin:
```
app/super-admin/login/page.tsx           → Página de login
app/super-admin/dashboard/page.tsx       → Dashboard
app/api/super-admin/auth/login/route.ts  → API de login
app/api/super-admin/users/route.ts       → API de usuários
app/api/super-admin/stats/route.ts       → API de estatísticas
```

---

## ❓ Troubleshooting Rápido

### 404 no /super-admin/login?
→ A imagem não foi atualizada. Certifique-se de:
1. Fazer build com código mais recente (`git pull`)
2. Push para Docker Hub
3. Atualizar stack com "Pull latest image"

### Migração diz "já existe"?
→ Super admin já foi criado. Use a senha da primeira execução.

### Esqueceu a senha?
→ Entre no PostgreSQL e delete o super admin:
```bash
docker exec -it chatwell_postgres psql -U chatwell -d chatwell
DELETE FROM super_admins WHERE username = 'admin';
\q
```
Depois execute `npm run super-admin:setup` novamente.

---

## 🔒 Segurança

✅ **O que está seguro:**
- Senha gerada aleatoriamente (16 caracteres)
- Não há senhas hardcoded no código
- Token JWT expira em 24h
- HTTPS via Traefik (já configurado)

---

## 📞 Próximos Passos

Após login bem-sucedido, você pode:
- Ver quantos usuários estão cadastrados
- Ver lista com nome, email, telefone de cada usuário
- Ativar contas
- Desativar contas (usuário não conseguirá mais logar)
- Ver estatísticas do sistema

---

**Documentação completa:** Veja `DEPLOY_SUPER_ADMIN.md`

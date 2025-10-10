# 🚀 Deploy Chatwell Pro v3.3 no Portainer (Docker Swarm)

## 📋 Pré-requisitos

- Docker Swarm configurado
- Portainer instalado
- Rede `network_public` criada
- Stack Redis rodando (redis_redis)
- Stack Traefik rodando

## 🔄 Atualização da Stack

### Passo 1: Acessar Portainer

1. Acesse seu Portainer: `https://seu-portainer.com`
2. Vá em **Stacks**
3. Localize a stack **chatwell** (ou crie uma nova se não existir)

### Passo 2: Atualizar Stack

Se a stack **já existe**:
1. Clique na stack **chatwell**
2. Clique em **Editor**
3. Cole o conteúdo do arquivo `docker-compose-stack.yml`
4. Clique em **Update the stack**

Se a stack **não existe**:
1. Clique em **+ Add stack**
2. Nome: `chatwell`
3. Build method: **Web editor**
4. Cole o conteúdo do arquivo `docker-compose-stack.yml`
5. Clique em **Deploy the stack**

### Passo 3: Aguardar Deploy

- O Portainer irá baixar a imagem `tomautomations/chatwell-pro:v3.3`
- Aguarde os containers ficarem **green/running**
- Isso pode levar 2-3 minutos

## 🗄️ Executar Migrations

**IMPORTANTE:** Antes de usar o sistema, execute as migrations no banco de dados.

### Opção 1: Via Container (Recomendado)

```bash
# 1. Encontrar o container do chatwell
docker ps | grep chatwell

# 2. Acessar o container (substitua CONTAINER_ID)
docker exec -it CONTAINER_ID sh

# 3. Dentro do container, executar migrations
cd /app
node scripts/run-migration.js database/migrations/001_add_service_contracts.sql
node scripts/run-migration.js database/migrations/002_add_event_contact_fields.sql

# 4. Sair do container
exit
```

### Opção 2: Via PostgreSQL direto

```bash
# Conectar ao container do PostgreSQL
docker exec -it $(docker ps -q -f name=chatwell_postgres) sh

# Executar comandos SQL
psql -U chatwell -d chatwell

# Copiar e colar o conteúdo dos arquivos:
# - database/migrations/001_add_service_contracts.sql
# - database/migrations/002_add_event_contact_fields.sql

\q
exit
```

## ⚙️ Configurar Cron Jobs

As notificações automáticas precisam de cron jobs configurados.

### No servidor VPS:

```bash
# Editar crontab
crontab -e

# Adicionar as seguintes linhas:

# Lembretes de agendamentos - 18h todos os dias
0 18 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-events -H "Authorization: Bearer chatwell-cron-secret-2025" >> /var/log/chatwell-events.log 2>&1

# Lembretes de contas a vencer - 20h todos os dias
0 20 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-accounts -H "Authorization: Bearer chatwell-cron-secret-2025" >> /var/log/chatwell-accounts.log 2>&1
```

### Verificar logs dos cron jobs:

```bash
tail -f /var/log/chatwell-events.log
tail -f /var/log/chatwell-accounts.log
```

## ✅ Verificar Deploy

### 1. Health Check

Acesse: https://app.chatwell.pro/api/health

Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T...",
  "database": "connected"
}
```

### 2. Verificar Logs

No Portainer:
1. Vá em **Stacks** → **chatwell**
2. Clique no serviço **chatwell_chatwell**
3. Clique em **Logs**
4. Verifique se não há erros

### 3. Testar Acesso

Acesse: https://app.chatwell.pro

Deve abrir a tela de login normalmente.

## 🔧 Troubleshooting

### Problema: Container não inicia

**Solução:**
```bash
# Verificar logs
docker service logs chatwell_chatwell --tail 100

# Reiniciar serviço
docker service update --force chatwell_chatwell
```

### Problema: Erro de conexão com banco

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker service ps chatwell_postgres

# Verificar se está na mesma rede
docker network inspect network_public

# Testar conexão
docker exec $(docker ps -q -f name=chatwell_postgres) pg_isready -U chatwell
```

### Problema: Erro 502 Bad Gateway

**Solução:**
1. Verificar se Traefik está rodando
2. Verificar labels do Traefik na stack
3. Verificar se porta 3000 está aberta no container

```bash
# Ver status do Traefik
docker service ps traefik_traefik

# Verificar configuração
docker service inspect chatwell_chatwell --pretty
```

### Problema: Notificações não funcionam

**Solução:**
1. Verificar se as variáveis de ambiente estão corretas
2. Testar Gmail SMTP:
   ```bash
   curl -X POST https://app.chatwell.pro/api/smtp/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer SEU_TOKEN" \
     -d '{"to":"seu@email.com"}'
   ```
3. Verificar configuração WAHA

## 📊 Monitoramento

### Verificar recursos:

```bash
# CPU e Memória dos containers
docker stats $(docker ps -q -f name=chatwell)

# Espaço em disco
df -h

# Logs em tempo real
docker service logs -f chatwell_chatwell
```

### Métricas importantes:

- **CPU**: Deve ficar < 50% em uso normal
- **RAM**: ~200-300MB por réplica
- **Disco**: Volume postgres_data cresce com uso

## 🔄 Rollback (se necessário)

Se algo der errado, voltar para versão anterior:

```bash
# Via Portainer:
# 1. Editar stack
# 2. Mudar imagem para: tomautomations/chatwell-pro:v3.2
# 3. Update the stack

# Ou via CLI:
docker service update --image tomautomations/chatwell-pro:v3.2 chatwell_chatwell
```

## 📝 Variáveis de Ambiente Atualizadas

### ✅ Tarefa 6 - Gmail SMTP (ATUALIZADO):
```env
DEFAULT_SMTP_USER: "chatwellpro@gmail.com"
DEFAULT_SMTP_PASS: "xoru ncif szdv brjc"
DEFAULT_FROM_EMAIL: "chatwellpro@gmail.com"
```

### ✅ Tarefa 5 - WAHA (ATUALIZADO):
```env
WAHA_BASE_URL: "https://zap.joinerchat.net"
WAHA_API_KEY: "CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM"
WAHA_SESSION_NAME: "chatwell-pro"
WAHA_DEFAULT_PHONE: "380947105869@c.us"
```

### 🔐 Senhas Mantidas:
```env
POSTGRES_PASSWORD: RuGc2mfJ8oJW6giog3RiJCBd5qZmWp
JWT_SECRET: RuGc2mfJ8oJW6giog3RiJCBd5qZmWpSD
```

## 🆕 Novidades da v3.3

1. ✅ Sistema de Gerenciamento de Serviços (/servicos)
2. ✅ Sincronização bidirecional do Kanban
3. ✅ Notificações automáticas por Email/WhatsApp
4. ✅ Campos de contato na agenda
5. ✅ Lembretes diários de agendamentos (18h)
6. ✅ Lembretes diários de contas (20h)
7. ✅ WAHA como conexão padrão
8. ✅ Gmail SMTP como padrão

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs: `docker service logs chatwell_chatwell`
2. Consulte `CRON_JOBS_SETUP.md` para configuração de notificações
3. Verifique `TROUBLESHOOTING.md` para problemas comuns

---

**Versão:** v3.3
**Data:** 2025-10-10
**Deploy:** Portainer + Docker Swarm

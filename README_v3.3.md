# 🎉 Chatwell Pro v3.3 - Guia Rápido de Deploy

## 📦 O que há de novo na v3.3?

### ✅ 6 Tarefas Implementadas:

1. **Sistema de Gerenciamento de Serviços**
   - Nova aba "Serviços" (substitui Projetos)
   - Contratos de serviços na aba Cliente
   - Caixa "Em Andamento" sincronizada

2. **Kanban Sincronizado**
   - Novos status: Em Tratativa, Em Andamento, Pendente, Cancelado
   - Sincronização bidirecional com contratos

3. **Notificações Automáticas**
   - Confirmação de agendamento (Email/WhatsApp)
   - Lembretes diários de agendamentos (18h)
   - Lembretes diários de contas (20h)

4. **WAHA como Padrão**
   - WhatsApp configurado globalmente
   - Não precisa configurar por usuário

5. **Gmail SMTP como Padrão**
   - Email configurado globalmente
   - chatwellpro@gmail.com

## 🚀 Deploy Rápido (Portainer)

### 1. Atualizar Stack

No Portainer:
- Editar stack "chatwell"
- Colar conteúdo de `docker-compose-stack.yml`
- Atualizar stack

### 2. Executar Migrations

```bash
# Acessar container
docker exec -it $(docker ps -q -f name=chatwell_chatwell | head -1) sh

# Rodar migrations
node scripts/run-migration.js database/migrations/001_add_service_contracts.sql
node scripts/run-migration.js database/migrations/002_add_event_contact_fields.sql

exit
```

### 3. Configurar Cron Jobs

```bash
crontab -e
```

Adicionar:
```
0 18 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-events -H "Authorization: Bearer chatwell-cron-secret-2025"
0 20 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-accounts -H "Authorization: Bearer chatwell-cron-secret-2025"
```

## ✅ Verificar Funcionamento

1. **Health Check:** https://app.chatwell.pro/api/health
2. **Login:** https://app.chatwell.pro
3. **Nova aba:** Serviços (no menu)

## 📚 Documentação Completa

- `DEPLOY_PORTAINER.md` - Deploy completo no Portainer
- `CRON_JOBS_SETUP.md` - Configuração de notificações
- `docker-compose-stack.yml` - Stack atualizada

## 🔧 Variáveis Atualizadas

### Gmail SMTP:
- Email: chatwellpro@gmail.com
- Senha: xoru ncif szdv brjc

### WAHA:
- URL: https://zap.joinerchat.net
- API Key: CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM
- Sessão: chatwell-pro
- Telefone: 380947105869@c.us

## 🐛 Problemas?

```bash
# Ver logs
docker service logs chatwell_chatwell --tail 100

# Reiniciar serviço
docker service update --force chatwell_chatwell

# Rollback se necessário
docker service update --image tomautomations/chatwell-pro:v3.2 chatwell_chatwell
```

## 📊 Imagens Docker

- **Latest:** tomautomations/chatwell-pro:latest
- **v3.3:** tomautomations/chatwell-pro:v3.3
- **Digest:** sha256:e70185d629928871b3992a29cb5a510c87050f1c0ef1691eb6228113ac8a0f7f

---

**Versão:** v3.3
**Build:** 2025-10-10
**Status:** ✅ Pronto para produção

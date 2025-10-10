# 📅 Configuração de Cron Jobs - Chatwell Pro

Este documento descreve como configurar os cron jobs para notificações automáticas no Chatwell Pro.

## 🎯 Funcionalidades Implementadas

### 1. Confirmação de Agendamento (Tarefa 4.1)
✅ **Automático ao criar evento**
- Envia confirmação por email e/ou WhatsApp quando um evento é criado
- Campos adicionados na agenda: `phone` e `email`

### 2. Lembretes Diários de Agendamentos (Tarefa 4.2)
⏰ **Deve rodar às 18h todos os dias**
- Endpoint: `POST /api/notifications/daily-events`
- Envia lista de agendamentos do dia seguinte para o telefone cadastrado no perfil do usuário

### 3. Lembretes Diários de Contas a Vencer (Tarefa 4.3)
⏰ **Deve rodar às 20h todos os dias**
- Endpoint: `POST /api/notifications/daily-accounts`
- Envia lista de contas que vencem no dia seguinte via WhatsApp e/ou email

## 🔧 Configuração dos Cron Jobs

### Opção 1: Usando cron do Linux

Edite o crontab:
```bash
crontab -e
```

Adicione as seguintes linhas:

```bash
# Lembretes de agendamentos - 18h todos os dias
0 18 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-events -H "Authorization: Bearer chatwell-cron-secret-2025"

# Lembretes de contas a vencer - 20h todos os dias
0 20 * * * curl -X POST https://app.chatwell.pro/api/notifications/daily-accounts -H "Authorization: Bearer chatwell-cron-secret-2025"
```

### Opção 2: Usando EasyCron (Web-based)

1. Acesse: https://www.easycron.com
2. Crie duas tarefas:

**Tarefa 1 - Agendamentos:**
- URL: `https://app.chatwell.pro/api/notifications/daily-events`
- Method: POST
- Headers: `Authorization: Bearer chatwell-cron-secret-2025`
- Schedule: `0 18 * * *` (18h todos os dias)

**Tarefa 2 - Contas:**
- URL: `https://app.chatwell.pro/api/notifications/daily-accounts`
- Method: POST
- Headers: `Authorization: Bearer chatwell-cron-secret-2025`
- Schedule: `0 20 * * *` (20h todos os dias)

### Opção 3: Usando GitHub Actions

Crie `.github/workflows/notifications.yml`:

```yaml
name: Daily Notifications

on:
  schedule:
    # Agendamentos às 18h UTC-3 (21h UTC)
    - cron: '0 21 * * *'
    # Contas às 20h UTC-3 (23h UTC)
    - cron: '0 23 * * *'

jobs:
  send-event-reminders:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 21 * * *'
    steps:
      - name: Send Event Reminders
        run: |
          curl -X POST https://app.chatwell.pro/api/notifications/daily-events \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  send-account-reminders:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 23 * * *'
    steps:
      - name: Send Account Reminders
        run: |
          curl -X POST https://app.chatwell.pro/api/notifications/daily-accounts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🔐 Segurança

O secret `CRON_SECRET` está configurado em `.env`:
```
CRON_SECRET=chatwell-cron-secret-2025
```

**IMPORTANTE:** Mantenha este secret privado e não compartilhe publicamente.

## ✅ Configurações Padrão Aplicadas

### Tarefa 5: WAHA como Conexão Padrão
```env
WAHA_BASE_URL=https://zap.joinerchat.net
WAHA_API_KEY=CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM
WAHA_SESSION_NAME=chatwell-pro
WAHA_DEFAULT_PHONE=380947105869@c.us
```

### Tarefa 6: Gmail SMTP como Padrão
```env
DEFAULT_SMTP_HOST=smtp.gmail.com
DEFAULT_SMTP_PORT=587
DEFAULT_SMTP_USER=chatwellpro@gmail.com
DEFAULT_SMTP_PASS=xoru ncif szdv brjc
DEFAULT_FROM_EMAIL=chatwellpro@gmail.com
```

## 🧪 Testando as Notificações

### Teste em Desenvolvimento

Os endpoints GET estão disponíveis apenas em desenvolvimento para testes:

```bash
# Testar lembretes de agendamentos
curl http://localhost:3000/api/notifications/daily-events

# Testar lembretes de contas
curl http://localhost:3000/api/notifications/daily-accounts
```

### Teste em Produção

Use o método POST com autenticação:

```bash
# Testar lembretes de agendamentos
curl -X POST https://app.chatwell.pro/api/notifications/daily-events \
  -H "Authorization: Bearer chatwell-cron-secret-2025"

# Testar lembretes de contas
curl -X POST https://app.chatwell.pro/api/notifications/daily-accounts \
  -H "Authorization: Bearer chatwell-cron-secret-2025"
```

## 📊 Logs e Monitoramento

Os logs das notificações podem ser visualizados em:
- Docker: `docker logs chatwell-chatwell-1`
- Aplicação: Verifique os logs do container

## 🔄 Migração do Banco de Dados

Execute as migrations necessárias:

```bash
# Migration para adicionar campos phone e email na tabela events
node scripts/run-migration.js database/migrations/002_add_event_contact_fields.sql

# Se necessário, migration para service_contracts (já deve estar aplicada)
node scripts/run-migration.js database/migrations/001_add_service_contracts.sql
```

## 📝 Notas Importantes

1. **Fuso Horário:** Ajuste os horários dos cron jobs conforme seu fuso horário
2. **Telefone do Usuário:** Os usuários devem ter o campo `phone` preenchido no perfil para receber notificações
3. **Email do Usuário:** O campo `email` no perfil é usado para notificações por email
4. **WhatsApp:** Números devem estar no formato internacional com `@c.us` (ex: `5511999999999@c.us`)

## ❓ Solução de Problemas

### Notificações não estão sendo enviadas

1. Verifique se os cron jobs estão executando
2. Verifique os logs do container
3. Teste os endpoints manualmente
4. Verifique as credenciais do Gmail e WAHA

### Emails não chegam

1. Verifique se o email está correto no `.env`
2. Teste a senha do app do Gmail
3. Verifique se o SMTP do Gmail está liberado

### WhatsApp não envia

1. Verifique se a sessão WAHA está ativa
2. Teste a conexão com a API WAHA
3. Verifique se o número está no formato correto

## 📞 Suporte

Para mais informações, consulte a documentação do Chatwell Pro ou entre em contato com o suporte.

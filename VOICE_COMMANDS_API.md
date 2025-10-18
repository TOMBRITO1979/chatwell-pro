# 🎙️ Chatwell Pro - API de Comandos de Voz

Sistema de integração com n8n para criar eventos e contas através de comandos de voz via Telegram ou WhatsApp.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração Inicial](#configuração-inicial)
- [Endpoints](#endpoints)
- [Fluxo n8n](#fluxo-n8n)
- [Exemplos de Comandos](#exemplos-de-comandos)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A API de Comandos de Voz permite que usuários criem **eventos** e **contas** no Chatwell Pro enviando mensagens de áudio via Telegram ou WhatsApp. O fluxo funciona assim:

```
[Usuário envia áudio]
  → [Telegram/WhatsApp]
  → [n8n converte áudio em texto]
  → [n8n chama API Chatwell]
  → [Chatwell cria evento/conta]
  → [Retorna confirmação]
  → [n8n envia confirmação ao usuário]
```

---

## 🔧 Configuração Inicial

### 1. Aplicar Migration no Banco de Dados

Execute a migration para adicionar suporte a comandos de voz:

```bash
psql -U chatwell -d chatwell < database/migrations/add_voice_commands_support.sql
```

Ou, se estiver usando Docker:

```bash
docker exec -i $(docker ps -qf "name=postgres") psql -U chatwell -d chatwell < database/migrations/add_voice_commands_support.sql
```

### 2. Obter sua API Key

Cada usuário precisa de uma API Key única para autenticar requisições.

#### Via API (para frontend):

```bash
# Primeiro, faça login e obtenha o token JWT
curl -X POST https://app.chatwell.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha"
  }'

# Depois, obtenha a API Key
curl -X GET https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### Gerar nova API Key:

```bash
curl -X POST https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 3. Configurar n8n

Você precisará do seguinte workflow no n8n:

1. **Trigger**: Telegram/WhatsApp webhook para receber áudios
2. **Node**: Converter áudio em texto (usando OpenAI Whisper, Google Speech-to-Text, etc)
3. **Node**: HTTP Request para Chatwell Pro
4. **Node**: Enviar confirmação de volta ao usuário

---

## 🔌 Endpoints

### 1. Criar Evento ou Conta via Voz

**Endpoint:** `POST /api/webhooks/voice-commands`

**Headers:**
```http
Content-Type: application/json
X-API-Key: sua_api_key_aqui
```

**Body:**
```json
{
  "transcription": "Agendar reunião com cliente amanhã às 15 horas",
  "type": "auto",
  "source": "telegram",
  "metadata": {
    "audio_url": "https://exemplo.com/audio.ogg",
    "timestamp": "2025-10-18T10:30:00Z",
    "chat_id": "123456789",
    "message_id": "987654321"
  }
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `transcription` | string | Sim | Texto do áudio convertido |
| `type` | string | Não | `"auto"`, `"event"` ou `"account"`. Padrão: `"auto"` (detecta automaticamente) |
| `source` | string | Não | `"telegram"`, `"whatsapp"`, etc |
| `metadata` | object | Não | Dados adicionais para logging |

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "type": "event",
  "data": {
    "id": "uuid-do-evento",
    "title": "Reunião com cliente",
    "start_time": "2025-10-19T15:00:00Z",
    "end_time": "2025-10-19T16:00:00Z",
    "location": null,
    "event_type": "meeting",
    "created_at": "2025-10-18T10:30:00Z"
  },
  "message": "✅ Evento agendado com sucesso!\n\n📅 Reunião com cliente\n🕒 sábado, 19 de outubro, 15:00\n\nID: abc-123",
  "parsed_info": {
    "title": "Reunião com cliente",
    "date": "19/10/2025",
    "time": "15:00",
    "location": null,
    "event_type": "meeting"
  }
}
```

**Resposta de Erro (400):**

```json
{
  "success": false,
  "message": "Não consegui identificar a data/hora. Tente falar algo como 'amanhã às 15 horas'",
  "transcription": "agendar reunião",
  "suggestion": "Tente falar algo como: \"Agendar reunião com cliente amanhã às 15 horas\""
}
```

---

### 2. Gerenciar API Key

#### Obter API Key atual

```bash
GET /api/user/api-key
Authorization: Bearer {jwt_token}
```

#### Gerar nova API Key

```bash
POST /api/user/api-key
Authorization: Bearer {jwt_token}
```

#### Revogar API Key

```bash
DELETE /api/user/api-key
Authorization: Bearer {jwt_token}
```

---

## 🤖 Fluxo n8n

### Template de Workflow n8n

```json
{
  "nodes": [
    {
      "name": "Telegram Trigger",
      "type": "n8n-nodes-base.telegramTrigger",
      "webhookId": "seu-webhook-id"
    },
    {
      "name": "Verificar se é áudio",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.message.voice }}",
              "operation": "exists"
            }
          ]
        }
      }
    },
    {
      "name": "Download áudio",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "operation": "getFile",
        "fileId": "={{ $json.message.voice.file_id }}"
      }
    },
    {
      "name": "Converter áudio para texto",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "transcription",
        "model": "whisper-1",
        "binaryData": true
      }
    },
    {
      "name": "Enviar para Chatwell",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://app.chatwell.pro/api/webhooks/voice-commands",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headers": {
          "parameters": {
            "parameter": [
              {
                "name": "X-API-Key",
                "value": "SUA_API_KEY_AQUI"
              }
            ]
          }
        },
        "body": {
          "transcription": "={{ $json.text }}",
          "type": "auto",
          "source": "telegram",
          "metadata": {
            "chat_id": "={{ $json.message.chat.id }}",
            "message_id": "={{ $json.message.message_id }}",
            "timestamp": "={{ $json.message.date }}"
          }
        }
      }
    },
    {
      "name": "Enviar confirmação",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{ $json.message.chat.id }}",
        "text": "={{ $json.message }}"
      }
    }
  ]
}
```

---

## 💬 Exemplos de Comandos

### Criar Eventos

| Comando de Voz | Resultado |
|----------------|-----------|
| "Agendar reunião com cliente amanhã às 15 horas" | Evento às 15h de amanhã |
| "Marcar consulta dia 25 às 10h30" | Evento dia 25 às 10h30 |
| "Compromisso hoje às 14h no escritório" | Evento hoje às 14h |
| "Reunião online sexta-feira às 9h" | Evento sexta às 9h (com link Jitsi) |
| "Call com fornecedor dia 20 de novembro às 16h" | Evento tipo "call" no dia especificado |

### Criar Contas

| Comando de Voz | Resultado |
|----------------|-----------|
| "Conta de energia vence dia 25 no valor de 350 reais" | Conta a pagar de R$ 350,00 |
| "Pagar boleto de internet dia 15 de 120 reais" | Conta a pagar de R$ 120,00 |
| "Receber pagamento do cliente dia 30 de 5000 reais" | Conta a receber de R$ 5.000,00 |
| "Fatura do cartão vence dia 10 valor 2500" | Conta a pagar de R$ 2.500,00 |
| "Conta de água para o dia 5 no valor de R$ 85,50" | Conta a pagar de R$ 85,50 |

---

## 🎨 Detecção Inteligente

O parser possui detecção inteligente baseada em:

### Para Eventos:
- **Palavras-chave**: agendar, reunião, meeting, compromisso, consulta, encontro, marcar
- **Data**: hoje, amanhã, dia X, dia X de Y, semana que vem
- **Hora**: 15h, 15:30, às 15, 14h30
- **Tipo**: reunião, call, consulta, online
- **Duração**: padrão 1 hora, detecta "2 horas", etc

### Para Contas:
- **Palavras-chave**: conta, pagar, pagamento, boleto, fatura, receber, vencimento
- **Valor**: R$ 350, 350 reais, valor de 350
- **Data**: dia X, vence dia X, dia X de Y
- **Categoria**: energia, água, internet, aluguel, etc (auto-detectado)
- **Tipo**: "pagar" = despesa, "receber" = receita

---

## 🔍 Troubleshooting

### Erro 401: "API Key inválida"

**Causa**: API Key incorreta ou usuário inativo

**Solução**:
```bash
# Gerar nova API Key
curl -X POST https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### Erro 400: "Não consegui identificar a data/hora"

**Causa**: Comando de voz não contém data/hora clara

**Solução**: Use formatos mais explícitos:
- ✅ "amanhã às 15 horas"
- ✅ "dia 25 às 10h"
- ❌ "daqui a pouco"
- ❌ "mais tarde"

### Erro 400: "Não consegui identificar o valor"

**Causa**: Valor monetário não foi reconhecido

**Solução**: Use formatos claros:
- ✅ "350 reais"
- ✅ "R$ 1500"
- ✅ "valor de 250"
- ❌ "trezentos e cinquenta"

### Parser não identifica se é evento ou conta

**Causa**: Comando ambíguo

**Solução**: Use palavras-chave específicas:
- Para eventos: "agendar", "reunião", "marcar"
- Para contas: "conta", "pagar", "boleto", "receber"

Ou especifique o `type` no payload:
```json
{
  "transcription": "...",
  "type": "event"  // ou "account"
}
```

---

## 📊 Logs e Auditoria

Todos os comandos de voz são registrados na tabela `voice_command_logs`:

```sql
SELECT
  vcl.transcription,
  vcl.parsed_type,
  vcl.source,
  vcl.created_at,
  u.name as user_name
FROM voice_command_logs vcl
JOIN users u ON vcl.user_id = u.id
ORDER BY vcl.created_at DESC
LIMIT 50;
```

---

## 🔐 Segurança

- ✅ **API Key única** por usuário
- ✅ **Validação de usuário ativo**
- ✅ **Rate limiting** (configurável via nginx/traefik)
- ✅ **Logs de auditoria**
- ✅ **Revogação de chaves** a qualquer momento

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs: `docker logs chatwell_chatwell`
2. Consulte a documentação do n8n
3. Abra um issue no GitHub

---

## 🚀 Próximos Passos

Recursos planejados:

- [ ] Suporte a múltiplos idiomas
- [ ] Parser com IA (GPT-4) para comandos complexos
- [ ] Edição de eventos/contas por voz
- [ ] Consultas por voz ("quais minhas contas do mês?")
- [ ] Lembretes automáticos via Telegram/WhatsApp

---

**Chatwell Pro** - Gestão empresarial por comando de voz 🎙️

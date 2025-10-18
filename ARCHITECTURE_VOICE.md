# 🏗️ Arquitetura - Sistema de Comandos de Voz

Documentação técnica da arquitetura do sistema de comandos de voz.

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO                                  │
│                    (Telegram/WhatsApp)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Envia áudio
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                          N8N                                     │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Telegram   │ →  │   Whisper    │ →  │ HTTP Request │     │
│  │   Trigger    │    │  (STT AI)    │    │   Chatwell   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                  │               │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                         2. POST /api/webhooks/voice-commands
                         │  Header: X-API-Key
                         │  Body: {transcription, type, source}
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CHATWELL PRO API                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  /api/webhooks/voice-commands/route.ts                 │    │
│  │                                                         │    │
│  │  1. Valida API Key (busca user na DB)                 │    │
│  │  2. Extrai transcription do body                       │    │
│  │  3. Chama parseVoiceCommand()                          │    │
│  │  4. Cria evento OU conta baseado no resultado          │    │
│  │  5. Retorna confirmação + mensagem formatada           │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                        │
│                         ↓                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  lib/voice-parser.ts                                    │    │
│  │                                                         │    │
│  │  • parseVoiceCommand() - Detecta tipo                  │    │
│  │  • parseEventCommand() - Extrai dados evento           │    │
│  │  • parseAccountCommand() - Extrai dados conta          │    │
│  │  • extractDateTime() - Parse data/hora                 │    │
│  │  • extractAmount() - Parse valores monetários          │    │
│  │  • extractLocation() - Parse localizações              │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                        │
│                         ↓                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                        │    │
│  │                                                         │    │
│  │  • events (agenda)                                     │    │
│  │  • accounts (contas a pagar/receber)                   │    │
│  │  • voice_command_logs (auditoria)                      │    │
│  │  • users (api_key)                                     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 3. Retorna JSON com resultado
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                          N8N                                     │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  IF Success  │ →  │   Telegram   │ →  │    Usuário   │     │
│  │     Node     │    │ Send Message │    │   recebe msg │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
┌──────────────┐
│   Cliente    │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    {email, password}
       ↓
┌──────────────────────┐
│  /api/auth/login     │
│                      │
│  • Valida credenciais│
│  • Retorna JWT token │
└──────┬───────────────┘
       │
       │ 2. JWT token
       ↓
┌──────────────────────┐
│   Cliente salva      │
│   token localmente   │
└──────┬───────────────┘
       │
       │ 3. POST /api/user/api-key
       │    Header: Authorization: Bearer {JWT}
       ↓
┌──────────────────────────┐
│  /api/user/api-key       │
│                          │
│  • Valida JWT            │
│  • Gera nova API Key     │
│  • Salva em users.api_key│
│  • Retorna API Key       │
└──────┬───────────────────┘
       │
       │ 4. API Key (guardar!)
       ↓
┌──────────────────────────┐
│  Cliente configura n8n   │
│  com API Key recebida    │
└──────────────────────────┘

Posteriormente:

┌──────────────┐
│     n8n      │
└──────┬───────┘
       │
       │ POST /api/webhooks/voice-commands
       │ Header: X-API-Key: {API_KEY}
       ↓
┌──────────────────────────────┐
│  Chatwell valida API Key     │
│  • SELECT * FROM users       │
│    WHERE api_key = ?         │
│  • Se encontrou: autorizado  │
│  • Se não: 401 Unauthorized  │
└──────────────────────────────┘
```

---

## 🧠 Parser - Lógica de Decisão

```
┌─────────────────────────────┐
│  parseVoiceCommand()        │
│  Input: "texto transcrito"  │
└────────────┬────────────────┘
             │
             │ type = "auto"?
             ↓
      ┌──────────────┐
      │   Detectar   │
      │     Tipo     │
      └──┬────────┬──┘
         │        │
   EVENT │        │ ACCOUNT
         ↓        ↓
┌─────────────┐  ┌──────────────┐
│   Palavras  │  │   Palavras   │
│   chave:    │  │   chave:     │
│             │  │              │
│ • agendar   │  │ • conta      │
│ • reunião   │  │ • pagar      │
│ • meeting   │  │ • boleto     │
│ • marcar    │  │ • receber    │
│ • consulta  │  │ • fatura     │
└─────┬───────┘  └───────┬──────┘
      │                  │
      ↓                  ↓
┌──────────────────┐  ┌─────────────────────┐
│parseEventCommand │  │parseAccountCommand  │
└────────┬─────────┘  └──────────┬──────────┘
         │                       │
         ↓                       ↓
┌──────────────────┐  ┌─────────────────────┐
│ Extrair:         │  │ Extrair:            │
│ • Título         │  │ • Título            │
│ • Data/Hora      │  │ • Valor (R$)        │
│ • Localização    │  │ • Data vencimento   │
│ • Tipo evento    │  │ • Categoria         │
│ • Duração        │  │ • Tipo (pagar/rec)  │
└────────┬─────────┘  └──────────┬──────────┘
         │                       │
         ↓                       ↓
┌──────────────────┐  ┌─────────────────────┐
│ INSERT INTO      │  │ INSERT INTO         │
│ events           │  │ accounts            │
└────────┬─────────┘  └──────────┬──────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
            ┌─────────────────┐
            │ Retornar result │
            │ + mensagem      │
            └─────────────────┘
```

---

## 🗄️ Schema do Banco de Dados

### Tabela: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  api_key VARCHAR(64) UNIQUE,  -- 🆕 NOVO
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE INDEX idx_users_api_key ON users(api_key);
```

### Tabela: `events`

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location TEXT,
  event_type VARCHAR(50),
  phone VARCHAR(20),        -- 🆕 NOVO
  email VARCHAR(255),       -- 🆕 NOVO
  meeting_url TEXT,         -- 🆕 NOVO
  created_at TIMESTAMP
);
```

### Tabela: `accounts`

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  type VARCHAR(20),  -- 'expense', 'receivable', etc
  status VARCHAR(20) DEFAULT 'pending',
  category VARCHAR(50),
  client_id UUID REFERENCES clients(id),   -- 🆕 NOVO
  project_id UUID REFERENCES projects(id), -- 🆕 NOVO
  created_at TIMESTAMP
);
```

### Tabela: `voice_command_logs` (Nova)

```sql
CREATE TABLE voice_command_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transcription TEXT NOT NULL,
  parsed_type VARCHAR(20),  -- 'event' ou 'account'
  source VARCHAR(20),        -- 'telegram', 'whatsapp'
  metadata JSONB,            -- {audio_url, chat_id, etc}
  created_item_id UUID,      -- ID do evento/conta criado
  created_at TIMESTAMP
);

CREATE INDEX idx_voice_logs_user_id ON voice_command_logs(user_id);
CREATE INDEX idx_voice_logs_created_at ON voice_command_logs(created_at);
```

---

## 🔄 Sequência Completa

### Cenário: Criar evento via Telegram

```
1. USUÁRIO
   └─> Grava áudio: "Agendar reunião com cliente amanhã às 15 horas"
   └─> Envia para bot do Telegram

2. TELEGRAM
   └─> Recebe áudio (voice message)
   └─> Webhook dispara n8n

3. N8N - Node 1: Telegram Trigger
   └─> Extrai: message.voice.file_id

4. N8N - Node 2: Telegram.getFile
   └─> Baixa arquivo de áudio
   └─> Retorna: binary data

5. N8N - Node 3: OpenAI Whisper
   └─> Input: binary audio
   └─> Output: "agendar reunião com cliente amanhã às 15 horas"

6. N8N - Node 4: HTTP Request
   └─> POST https://app.chatwell.pro/api/webhooks/voice-commands
   └─> Headers: {X-API-Key: "abc123..."}
   └─> Body: {
         "transcription": "agendar reunião com cliente amanhã às 15 horas",
         "type": "auto",
         "source": "telegram"
       }

7. CHATWELL - Webhook Handler
   └─> Valida API Key em users table
   └─> Encontra user_id = "uuid-123"
   └─> Chama parseVoiceCommand()

8. CHATWELL - Voice Parser
   └─> Detecta palavras: "agendar", "reunião" → TYPE: event
   └─> extractEventTitle() → "Reunião com cliente"
   └─> extractDateTime() → start: 2025-10-19 15:00:00
   └─> extractLocation() → null
   └─> Retorna: {
         success: true,
         type: "event",
         data: {
           title: "Reunião com cliente",
           start_time: "2025-10-19T15:00:00Z",
           end_time: "2025-10-19T16:00:00Z",
           ...
         }
       }

9. CHATWELL - Database Insert
   └─> INSERT INTO events (user_id, title, start_time, ...)
   └─> RETURNING id, title, start_time, ...

10. CHATWELL - Log
    └─> INSERT INTO voice_command_logs (
          user_id, transcription, parsed_type, created_item_id
        )

11. CHATWELL - Response
    └─> Retorna JSON: {
          success: true,
          type: "event",
          data: {...},
          message: "✅ Evento agendado com sucesso!\n📅 Reunião com cliente\n🕒 ..."
        }

12. N8N - Node 5: Telegram.sendMessage
    └─> Envia mensagem de confirmação para o usuário

13. USUÁRIO
    └─> Recebe: "✅ Evento agendado com sucesso! ..."
```

---

## 🎯 Padrões de Regex Usados

### Data/Hora

```javascript
// Hora
/(\d{1,2})[h:](\d{2})/          // 14h30, 14:30
/(\d{1,2})\s*h(?:oras?)?/       // 14h, 14 horas
/às\s+(\d{1,2})/                // às 14

// Dia
/dia\s+(\d{1,2})/               // dia 25
/dia\s+(\d{1,2})\s+de\s+(\w+)/  // dia 25 de outubro

// Relativo
"hoje", "amanhã", "semana que vem"
```

### Valores Monetários

```javascript
/R\$?\s*(\d+(?:[.,]\d{2})?)/i   // R$ 350, R$350.00
/(\d+(?:[.,]\d{2})?)\s*reais/i  // 350 reais
/valor\s+(?:de\s+)?(\d+)/i      // valor de 350
```

### Categorias

```javascript
const categories = {
  'energia': 'Energia',
  'luz': 'Energia',
  'água': 'Água',
  'internet': 'Internet',
  // ...
}
```

---

## 🚀 Performance

### Tempo de Resposta Esperado

```
┌─────────────────────────┬──────────┐
│ Etapa                   │ Tempo    │
├─────────────────────────┼──────────┤
│ Whisper STT (OpenAI)    │ 2-5s     │
│ HTTP Request n8n        │ 100ms    │
│ Chatwell Parser         │ 10-50ms  │
│ Database Insert         │ 20-100ms │
│ Total Response          │ 50-200ms │
│ Telegram Send           │ 100ms    │
├─────────────────────────┼──────────┤
│ TOTAL (ponta a ponta)   │ 2-6s     │
└─────────────────────────┴──────────┘
```

### Limites

- **Transcrição**: até 10.000 caracteres
- **Rate Limit**: 100 req/min por API Key (configurável)
- **Áudio**: max 20MB, até 10 minutos

---

## 🔒 Segurança

### 1. Autenticação

```
API Key (64 chars hex) = crypto.randomBytes(32).toString('hex')
```

- Única por usuário
- Armazenada com índice em `users.api_key`
- Pode ser revogada/regenerada a qualquer momento

### 2. Validação

```typescript
// 1. Verificar header
const apiKey = request.headers.get('x-api-key');
if (!apiKey) return 401;

// 2. Buscar no banco
const user = await db.query(
  'SELECT id FROM users WHERE api_key = $1 AND is_active = true',
  [apiKey]
);
if (user.rows.length === 0) return 401;

// 3. Proceder com user.id
```

### 3. Rate Limiting (Traefik/Nginx)

```yaml
# Traefik middleware
http:
  middlewares:
    voice-ratelimit:
      rateLimit:
        average: 100
        period: 1m
        burst: 20
```

### 4. Logs de Auditoria

Tudo registrado em `voice_command_logs`:
- Quem fez (user_id)
- O que foi dito (transcription)
- Quando (created_at)
- De onde (source, metadata)
- O que foi criado (created_item_id)

---

## 📈 Escalabilidade

### Horizontal Scaling

```
┌────────────┐
│  Traefik   │  (Load Balancer)
└─────┬──────┘
      │
      ├───> [Chatwell Instance 1]
      ├───> [Chatwell Instance 2]
      └───> [Chatwell Instance 3]
             │
             └───> [PostgreSQL]
```

### Caching (Futuro)

```
Redis Cache:
- API Key → User ID (TTL: 1h)
- Reduce database lookups
```

### Queue System (Futuro)

```
[Webhook] → [Queue] → [Worker Pool] → [Database]

Benefícios:
- Processamento assíncrono
- Retry automático
- Melhor handling de picos
```

---

## 🧪 Testes

### Unit Tests

```typescript
// voice-parser.test.ts
describe('parseEventCommand', () => {
  it('should parse "amanhã às 15h"', () => {
    const result = parseEventCommand('reunião amanhã às 15h');
    expect(result.success).toBe(true);
    expect(result.data.start_time).toMatch(/T15:00/);
  });
});
```

### Integration Tests

```bash
# test-voice-commands.sh
curl -X POST .../voice-commands \
  -H "X-API-Key: $API_KEY" \
  -d '{"transcription": "...", ...}'
```

---

## 📊 Métricas Importantes

```sql
-- Taxa de sucesso
SELECT
  COUNT(*) FILTER (WHERE created_item_id IS NOT NULL) * 100.0 / COUNT(*) as success_rate
FROM voice_command_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Comandos por tipo
SELECT parsed_type, COUNT(*)
FROM voice_command_logs
GROUP BY parsed_type;

-- Usuários mais ativos
SELECT u.name, COUNT(*) as commands
FROM voice_command_logs vcl
JOIN users u ON vcl.user_id = u.id
GROUP BY u.id, u.name
ORDER BY commands DESC
LIMIT 10;
```

---

**Chatwell Pro** - Arquitetura de Comandos de Voz 🏗️

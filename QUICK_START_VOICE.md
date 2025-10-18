# ⚡ Quick Start - Comandos de Voz

Guia rápido para ativar comandos de voz no Chatwell Pro.

---

## 🎯 O que foi implementado?

✅ **Endpoint webhook** para receber comandos de voz do n8n
✅ **Parser inteligente** que detecta automaticamente se é evento ou conta
✅ **Sistema de API Key** individual por usuário
✅ **Suporte a Telegram e WhatsApp**
✅ **Logs de auditoria** de todos os comandos

---

## 🚀 Setup em 3 Passos

### 1️⃣ Aplicar Migration no Banco

```bash
# Via Docker (Portainer)
docker exec -i $(docker ps -qf "name=postgres") \
  psql -U chatwell -d chatwell < database/migrations/add_voice_commands_support.sql

# Ou via psql direto
psql -U chatwell -d chatwell < database/migrations/add_voice_commands_support.sql
```

### 2️⃣ Obter sua API Key

```bash
# Login
TOKEN=$(curl -s -X POST https://app.chatwell.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha"}' \
  | jq -r '.token')

# Gerar API Key
curl -X POST https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer $TOKEN"
```

Guarde a API Key retornada!

### 3️⃣ Configurar n8n

Crie workflow com:
1. **Telegram Trigger** (recebe áudio)
2. **OpenAI Whisper** (converte em texto)
3. **HTTP Request** para `https://app.chatwell.pro/api/webhooks/voice-commands`
   - Header: `X-API-Key: SUA_CHAVE`
   - Body: `{"transcription": "texto", "type": "auto", "source": "telegram"}`
4. **Telegram** (envia confirmação)

---

## 🎤 Exemplos de Uso

### Criar Eventos

```
🎤 "Agendar reunião com cliente amanhã às 15 horas"
✅ Evento agendado para 19/10 às 15:00

🎤 "Marcar consulta dia 25 às 10h30"
✅ Evento dia 25/10 às 10:30
```

### Criar Contas

```
🎤 "Conta de energia vence dia 25 no valor de 350 reais"
✅ Conta a pagar: R$ 350,00 vencimento 25/10

🎤 "Receber pagamento do cliente dia 30 de 5000 reais"
✅ Conta a receber: R$ 5.000,00 em 30/10
```

---

## 📁 Arquivos Criados

```
chatwell-pro/
├── app/api/webhooks/voice-commands/route.ts   # Endpoint principal
├── app/api/user/api-key/route.ts              # Gerenciar API Keys
├── lib/voice-parser.ts                        # Parser inteligente
├── database/migrations/
│   └── add_voice_commands_support.sql         # Migration
├── VOICE_COMMANDS_API.md                      # Doc completa da API
├── N8N_SETUP_GUIDE.md                         # Guia n8n detalhado
└── test-voice-commands.sh                     # Script de testes
```

---

## 🧪 Testar Localmente

```bash
# Configurar variável
export API_KEY="sua-api-key-aqui"

# Executar testes
chmod +x test-voice-commands.sh
./test-voice-commands.sh
```

Ou teste manual:

```bash
curl -X POST https://app.chatwell.pro/api/webhooks/voice-commands \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY" \
  -d '{
    "transcription": "Agendar reunião com cliente amanhã às 15 horas",
    "type": "auto",
    "source": "test"
  }'
```

---

## 🔗 URLs do Sistema

| URL | Descrição |
|-----|-----------|
| `POST /api/webhooks/voice-commands` | Criar evento/conta por voz |
| `GET /api/user/api-key` | Obter API Key atual |
| `POST /api/user/api-key` | Gerar nova API Key |
| `DELETE /api/user/api-key` | Revogar API Key |

---

## 🎨 Como Funciona o Parser

O sistema detecta automaticamente:

**Eventos** se contém:
- Palavras: agendar, reunião, meeting, compromisso, marcar
- Data: hoje, amanhã, dia X, semana que vem
- Hora: 15h, 15:30, às 15

**Contas** se contém:
- Palavras: conta, pagar, boleto, receber, vencimento
- Valor: R$ 350, 350 reais, valor de 350
- Data: vence dia X, dia X

---

## 📊 Verificar Logs

```sql
-- Últimos comandos processados
SELECT
  u.name,
  vcl.transcription,
  vcl.parsed_type,
  vcl.created_at
FROM voice_command_logs vcl
JOIN users u ON vcl.user_id = u.id
ORDER BY vcl.created_at DESC
LIMIT 20;
```

---

## 🐛 Problemas Comuns

**Erro 401**: API Key inválida → Gere nova chave

**Não identifica data**: Use formato claro ("amanhã às 15h")

**Não identifica valor**: Use "reais" ou "R$" ("350 reais")

---

## 📚 Documentação Completa

- [VOICE_COMMANDS_API.md](./VOICE_COMMANDS_API.md) - API completa
- [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md) - Setup n8n passo a passo

---

## 🚀 Deploy

Rebuildar imagem Docker:

```bash
# Build
docker build -t tomautomations/chatwell-pro:latest .

# Push
docker push tomautomations/chatwell-pro:latest

# Deploy no Portainer
# Update service: chatwell_chatwell
```

---

**Pronto!** Agora você pode criar eventos e contas por comando de voz! 🎙️

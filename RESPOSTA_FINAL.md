# 🎙️ RESPOSTA: Sistema de Comandos de Voz - Chatwell Pro

---

## ✅ O QUE FOI FEITO

Implementei um sistema completo para você adicionar eventos e contas no Chatwell Pro usando comandos de voz via Telegram ou WhatsApp através do n8n.

---

## 🎯 COMO FUNCIONA

```
Você fala no Telegram/WhatsApp
         ↓
"Agendar reunião com cliente amanhã às 15 horas"
         ↓
n8n converte áudio em texto
         ↓
n8n envia para Chatwell Pro
         ↓
Chatwell cria o evento automaticamente
         ↓
Você recebe confirmação no Telegram/WhatsApp
✅ "Evento agendado para 19/10 às 15:00"
```

---

## 📁 ARQUIVOS CRIADOS

### 1. **API Endpoints** (Backend)
- `app/api/webhooks/voice-commands/route.ts` → Recebe comandos do n8n
- `app/api/user/api-key/route.ts` → Gerencia suas chaves de API

### 2. **Parser Inteligente**
- `lib/voice-parser.ts` → Entende o que você falou e extrai informações

### 3. **Banco de Dados**
- `database/migrations/add_voice_commands_support.sql` → Script SQL para rodar no PostgreSQL

### 4. **Documentação**
- `VOICE_COMMANDS_API.md` → Documentação técnica completa
- `N8N_SETUP_GUIDE.md` → Como configurar o n8n passo a passo
- `QUICK_START_VOICE.md` → Guia rápido de 3 passos
- `ARCHITECTURE_VOICE.md` → Arquitetura do sistema
- `IMPLEMENTATION_SUMMARY.md` → Resumo de tudo que foi feito

### 5. **Testes**
- `test-voice-commands.sh` → Script para testar tudo automaticamente
- `examples/voice-command-payloads.json` → Exemplos de comandos

---

## 🚀 COMO USAR (3 PASSOS)

### ⚡ Passo 1: Aplicar Migration no Banco

Entre no container PostgreSQL e execute:

```bash
docker exec -i $(docker ps -qf "name=postgres") \
  psql -U chatwell -d chatwell < database/migrations/add_voice_commands_support.sql
```

Isso vai:
- ✅ Adicionar campo `api_key` na tabela `users`
- ✅ Criar tabela `voice_command_logs` para auditoria
- ✅ Adicionar campos extras em `events` e `accounts`

---

### ⚡ Passo 2: Obter sua API Key

Cada usuário precisa de uma chave única. Você pode obter de duas formas:

#### Opção A: Via API (recomendado)

```bash
# 1. Fazer login
TOKEN=$(curl -s -X POST https://app.chatwell.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "sua-senha"
  }' | jq -r '.token')

# 2. Gerar API Key
curl -X POST https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer $TOKEN"
```

**Guarde a chave retornada!** Exemplo: `a1b2c3d4e5f6...`

#### Opção B: Diretamente no banco (temporário)

```sql
-- Gerar API Key manualmente para um usuário
UPDATE users
SET api_key = encode(gen_random_bytes(32), 'hex')
WHERE email = 'seu@email.com';

-- Ver a chave gerada
SELECT api_key FROM users WHERE email = 'seu@email.com';
```

---

### ⚡ Passo 3: Configurar n8n

Veja o arquivo completo: **N8N_SETUP_GUIDE.md**

#### Resumo do Workflow:

1. **Node: Telegram Trigger**
   - Recebe mensagens de áudio do bot

2. **Node: IF (é áudio?)**
   - Verifica se a mensagem tem áudio

3. **Node: Telegram Get File**
   - Baixa o arquivo de áudio

4. **Node: OpenAI Whisper**
   - Converte áudio em texto

5. **Node: HTTP Request**
   - URL: `https://app.chatwell.pro/api/webhooks/voice-commands`
   - Method: `POST`
   - Headers:
     - `Content-Type: application/json`
     - `X-API-Key: SUA_CHAVE_AQUI`
   - Body:
     ```json
     {
       "transcription": "={{ $json.text }}",
       "type": "auto",
       "source": "telegram"
     }
     ```

6. **Node: IF (sucesso?)**
   - Verifica resposta

7. **Node: Telegram Send Message**
   - Envia confirmação para você

---

## 💬 EXEMPLOS DE USO

### ✅ Para Criar EVENTOS:

🎤 **"Agendar reunião com cliente amanhã às 15 horas"**
→ Cria evento para amanhã 15h

🎤 **"Marcar consulta dia 25 às 10h30"**
→ Cria evento dia 25 às 10h30

🎤 **"Compromisso hoje às 14h no escritório"**
→ Cria evento hoje 14h com localização

🎤 **"Reunião online sexta-feira às 9h"**
→ Cria evento online (com link Jitsi Meet automático!)

---

### ✅ Para Criar CONTAS:

🎤 **"Conta de energia vence dia 25 no valor de 350 reais"**
→ Conta a pagar R$ 350,00

🎤 **"Pagar boleto de internet dia 15 de 120 reais"**
→ Conta a pagar R$ 120,00

🎤 **"Receber pagamento do cliente dia 30 de 5000 reais"**
→ Conta a RECEBER R$ 5.000,00

🎤 **"Fatura do cartão vence dia 10 valor 2500"**
→ Conta a pagar R$ 2.500,00

---

## 🎨 O QUE O SISTEMA ENTENDE

### Datas:
- ✅ "hoje", "amanhã", "depois de amanhã"
- ✅ "dia 25", "dia 25 de outubro"
- ✅ "semana que vem", "próxima segunda"

### Horas:
- ✅ "15h", "15:30", "às 15 horas"
- ✅ "9 da manhã", "3 da tarde", "8 da noite"

### Valores:
- ✅ "350 reais", "R$ 1500", "valor de 250"
- ✅ "85 reais e 50 centavos"

### Categorias (auto-detectadas):
- ✅ Energia, Água, Internet, Telefone
- ✅ Aluguel, Condomínio, Gás
- ✅ Saúde, Alimentação, Combustível

---

## 🧪 TESTAR

### Teste Manual Rápido:

```bash
curl -X POST https://app.chatwell.pro/api/webhooks/voice-commands \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_CHAVE_AQUI" \
  -d '{
    "transcription": "Agendar reunião com cliente amanhã às 15 horas",
    "type": "auto",
    "source": "test"
  }'
```

### Teste Completo Automatizado:

```bash
export API_KEY="sua-chave-aqui"
chmod +x test-voice-commands.sh
./test-voice-commands.sh
```

---

## 🔗 URLS IMPORTANTES

| URL | Para que serve |
|-----|----------------|
| `POST /api/webhooks/voice-commands` | **n8n usa essa URL** para criar eventos/contas |
| `GET /api/user/api-key` | Ver sua API Key |
| `POST /api/user/api-key` | Gerar nova API Key |
| `DELETE /api/user/api-key` | Revogar API Key |

---

## ❓ QUAL URL CADA USUÁRIO USA?

### Resposta Curta:
**TODOS os usuários usam a MESMA URL:**
```
https://app.chatwell.pro/api/webhooks/voice-commands
```

### Como o sistema sabe qual usuário é?
Pela **API Key** no header! Cada usuário tem sua chave única.

### Exemplo:

**Usuário João:**
- API Key: `abc123...`
- Manda áudio no Telegram dele
- n8n envia para: `POST https://app.chatwell.pro/api/webhooks/voice-commands`
- Com header: `X-API-Key: abc123...`
- Sistema identifica: "Ah, é o João!" e cria evento na agenda dele

**Usuário Maria:**
- API Key: `xyz789...`
- Manda áudio no Telegram dela
- n8n envia para: `POST https://app.chatwell.pro/api/webhooks/voice-commands` (mesma URL!)
- Com header: `X-API-Key: xyz789...`
- Sistema identifica: "Ah, é a Maria!" e cria evento na agenda dela

---

## 🎯 PARA CADA USUÁRIO RECEBER SEUS DADOS

### No n8n, configure:

1. **Cada usuário tem seu próprio workflow** (ou)
2. **Um workflow global que identifica o usuário**

#### Opção 1: Workflow por Usuário (Recomendado)

```
João tem:
- Bot do Telegram (ou usa o bot geral)
- Workflow do n8n com API Key do João

Maria tem:
- Bot do Telegram (ou usa o bot geral)
- Workflow do n8n com API Key da Maria
```

#### Opção 2: Workflow Global com Identificação

```
1 Bot do Telegram para todos
↓
n8n identifica quem enviou (pelo chat_id)
↓
Busca API Key correspondente
↓
Envia para Chatwell com API Key correta
```

---

## 📊 VER LOGS E RESULTADOS

### Ver últimos comandos processados:

```sql
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

### Ver eventos criados por voz:

```sql
SELECT
  e.title,
  e.start_time,
  vcl.transcription as "comando original"
FROM events e
JOIN voice_command_logs vcl ON e.id::text = vcl.created_item_id::text
WHERE vcl.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;
```

### Ver contas criadas por voz:

```sql
SELECT
  a.title,
  a.amount,
  a.due_date,
  vcl.transcription as "comando original"
FROM accounts a
JOIN voice_command_logs vcl ON a.id::text = vcl.created_item_id::text
WHERE vcl.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;
```

---

## 🚀 DEPLOY NO SEU AMBIENTE

### 1. Rebuild da Imagem Docker:

```bash
cd /caminho/do/projeto
docker build -t tomautomations/chatwell-pro:latest .
docker push tomautomations/chatwell-pro:latest
```

### 2. Atualizar no Portainer:

- Vá em **Stacks** → **chatwell**
- Clique em **Update Stack** ou **Pull and redeploy**
- Aguarde o deploy

### 3. Verificar:

```bash
# Ver logs
docker logs chatwell_chatwell -f

# Testar endpoint
curl https://app.chatwell.pro/api/webhooks/voice-commands
```

---

## 🎉 PRONTO!

Agora você tem:

✅ **Backend completo** para receber comandos de voz
✅ **Parser inteligente** que entende português
✅ **Sistema de API Keys** seguro
✅ **Documentação completa**
✅ **Scripts de teste**
✅ **Logs de auditoria**

### Próximos passos:

1. ✅ Rodar migration no banco
2. ✅ Obter sua API Key
3. ✅ Configurar bot do Telegram
4. ✅ Criar workflow no n8n
5. ✅ Testar enviando áudio!

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **[QUICK_START_VOICE.md](./QUICK_START_VOICE.md)** ← Comece aqui!
- **[N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)** ← Configurar n8n
- **[VOICE_COMMANDS_API.md](./VOICE_COMMANDS_API.md)** ← Referência da API
- **[ARCHITECTURE_VOICE.md](./ARCHITECTURE_VOICE.md)** ← Arquitetura técnica
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** ← O que foi feito

---

## 💡 DÚVIDAS COMUNS

**P: Preciso criar uma URL diferente para cada usuário?**
R: NÃO! Todos usam a mesma URL, mas com API Keys diferentes.

**P: Como o sistema sabe que sou eu?**
R: Pela sua API Key única que você passa no header.

**P: Posso usar WhatsApp ao invés de Telegram?**
R: SIM! Configure o webhook do WhatsApp no n8n.

**P: Funciona em português?**
R: SIM! Todo o parser foi feito para português brasileiro.

**P: Preciso do OpenAI?**
R: Para converter áudio em texto sim (Whisper). Mas pode usar Google STT também.

**P: E se eu falar errado?**
R: O sistema retorna uma mensagem explicando o que não entendeu e dá sugestões.

---

**Chatwell Pro** - Agora com comandos de voz! 🎙️✨

Qualquer dúvida, consulte os arquivos de documentação ou os exemplos!

# 🔄 Guia de Configuração n8n - Chatwell Pro

Este guia ensina como configurar o n8n para receber comandos de voz via Telegram/WhatsApp e criar eventos/contas no Chatwell Pro automaticamente.

---

## 📋 Pré-requisitos

- ✅ n8n instalado e rodando
- ✅ Bot do Telegram criado (via @BotFather) OU WhatsApp conectado
- ✅ Conta no OpenAI (para Whisper) ou outro serviço de Speech-to-Text
- ✅ API Key do Chatwell Pro (veja como obter abaixo)

---

## 🔑 Passo 1: Obter sua API Key do Chatwell

### Opção A: Via Interface (quando implementado)

1. Acesse https://app.chatwell.pro
2. Login com suas credenciais
3. Vá em **Perfil** → **Integrações** → **API Key**
4. Clique em **Gerar API Key**
5. Copie a chave (ela só será exibida uma vez!)

### Opção B: Via API/cURL

```bash
# 1. Fazer login
LOGIN_RESPONSE=$(curl -X POST https://app.chatwell.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha"
  }')

# 2. Extrair token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# 3. Obter ou gerar API Key
curl -X POST https://app.chatwell.pro/api/user/api-key \
  -H "Authorization: Bearer $TOKEN"
```

**Guarde sua API Key em local seguro!**

---

## 🤖 Passo 2: Criar Bot no Telegram

1. Abra o Telegram e busque por **@BotFather**
2. Envie `/newbot`
3. Escolha um nome e username para seu bot
4. Copie o **Token** fornecido pelo BotFather
5. Configure as permissões do bot:
   - `/setprivacy` → **Disable** (para o bot receber todas mensagens)
   - `/setjoingroups` → **Enable** (se quiser usar em grupos)

---

## 🔧 Passo 3: Configurar Workflow no n8n

### 3.1. Criar Novo Workflow

1. Acesse seu n8n
2. Clique em **+ New Workflow**
3. Nomeie como "Chatwell Voice Commands"

### 3.2. Adicionar Nodes

#### Node 1: Telegram Trigger

1. Adicione o node **Telegram Trigger**
2. Clique em **Add Credential**
3. Cole o **Token do Bot** obtido do BotFather
4. **Updates** → Selecione `message`

#### Node 2: Filtrar Apenas Áudios

1. Adicione node **IF**
2. Configure:
   - **Condition**: `message.voice` **exists**
3. Conecte o **True** branch ao próximo node

#### Node 3: Download do Áudio

1. Adicione node **Telegram**
2. **Operation**: `Get File`
3. **File ID**: `{{ $json.message.voice.file_id }}`
4. **Download**: Ativar

#### Node 4: Converter Áudio para Texto

**Opção A: OpenAI Whisper (Recomendado)**

1. Adicione node **OpenAI**
2. **Operation**: `Transcribe Audio`
3. **Model**: `whisper-1`
4. **Input Type**: `Binary Data`
5. **Binary Property**: `data`

**Opção B: Google Speech-to-Text**

1. Adicione node **Google Cloud Speech-to-Text**
2. Configure credenciais do Google Cloud
3. **Audio**: Binary Data
4. **Language**: `pt-BR`

#### Node 5: Enviar para Chatwell Pro

1. Adicione node **HTTP Request**
2. Configure:
   - **Method**: `POST`
   - **URL**: `https://app.chatwell.pro/api/webhooks/voice-commands`
   - **Authentication**: `Header Auth`
   - **Header Name**: `X-API-Key`
   - **Header Value**: `SUA_API_KEY_AQUI`
   - **Body Content Type**: `JSON`
   - **Body**:

```json
{
  "transcription": "={{ $json.text }}",
  "type": "auto",
  "source": "telegram",
  "metadata": {
    "chat_id": "={{ $('Telegram Trigger').item.json.message.chat.id }}",
    "message_id": "={{ $('Telegram Trigger').item.json.message.message_id }}",
    "timestamp": "={{ $('Telegram Trigger').item.json.message.date }}",
    "audio_duration": "={{ $('Telegram Trigger').item.json.message.voice.duration }}"
  }
}
```

#### Node 6: Verificar Sucesso

1. Adicione node **IF**
2. **Condition**: `success` **equals** `true`

#### Node 7a: Enviar Confirmação (Sucesso)

1. Adicione node **Telegram**
2. **Operation**: `Send Message`
3. **Chat ID**: `={{ $('Telegram Trigger').item.json.message.chat.id }}`
4. **Text**: `={{ $json.message }}`
5. **Parse Mode**: `Markdown` (opcional)

#### Node 7b: Enviar Erro (Falha)

1. Adicione node **Telegram**
2. **Operation**: `Send Message`
3. **Chat ID**: `={{ $('Telegram Trigger').item.json.message.chat.id }}`
4. **Text**:

```
❌ Ops! Não consegui processar seu comando.

{{ $json.message }}

{{ $json.suggestion || '' }}
```

### 3.3. Conectar os Nodes

```
[Telegram Trigger]
    ↓
[IF: É áudio?] → (false) → [Fim]
    ↓ (true)
[Telegram: Get File]
    ↓
[OpenAI: Whisper]
    ↓
[HTTP: Chatwell API]
    ↓
[IF: Sucesso?]
    ↓                ↓
  (true)          (false)
    ↓                ↓
[Send Success]  [Send Error]
```

---

## 🧪 Passo 4: Testar

### 4.1. Ativar Workflow

1. No n8n, clique em **Activate** (switch no canto superior direito)
2. Verifique se o status está **Active**

### 4.2. Enviar Teste

1. Abra o Telegram e encontre seu bot
2. Envie `/start` para iniciar conversa
3. **Grave um áudio** e envie, dizendo:
   - "Agendar reunião com cliente amanhã às 15 horas"
4. Aguarde a resposta do bot com a confirmação

### 4.3. Verificar no Chatwell

1. Acesse https://app.chatwell.pro
2. Vá em **Agenda** ou **Contas**
3. Verifique se o item foi criado

---

## 🎯 Exemplos de Comandos

### Para Criar Eventos

| Comando | Resultado |
|---------|-----------|
| 🎤 "Agendar reunião com cliente amanhã às 15 horas" | Evento criado para amanhã 15h |
| 🎤 "Marcar consulta dia 25 às 10h30" | Evento dia 25 às 10h30 |
| 🎤 "Compromisso hoje às 14h no escritório" | Evento hoje 14h |
| 🎤 "Reunião online sexta-feira às 9h" | Evento online (com link Jitsi) |

### Para Criar Contas

| Comando | Resultado |
|---------|-----------|
| 🎤 "Conta de energia vence dia 25 no valor de 350 reais" | Conta a pagar R$ 350 |
| 🎤 "Pagar boleto de internet dia 15 de 120 reais" | Conta a pagar R$ 120 |
| 🎤 "Receber pagamento do cliente dia 30 de 5000 reais" | Conta a receber R$ 5.000 |
| 🎤 "Fatura do cartão vence dia 10 valor 2500" | Conta a pagar R$ 2.500 |

---

## 🔧 Configurações Avançadas

### Adicionar Processamento de Texto

Antes de enviar para o Chatwell, você pode adicionar um node **Code** para:

- Corrigir ortografia
- Remover ruídos
- Formatar melhor o texto

```javascript
// Node Code - Limpar transcrição
const text = $input.item.json.text;

// Remove palavras de preenchimento
const cleaned = text
  .replace(/\b(eh|ah|hum|né)\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim();

return {
  json: {
    ...input.item.json,
    text: cleaned
  }
};
```

### Adicionar Confirmação Manual

Antes de criar no Chatwell, você pode adicionar:

1. Node **Telegram** para enviar prévia
2. Node **Telegram Trigger** aguardando confirmação
3. Só criar após confirmação do usuário

### Suportar WhatsApp

Substitua os nodes do Telegram por:

1. **Webhook** (para receber do WhatsApp Business API ou WAHA)
2. **HTTP Request** para enviar resposta via WhatsApp

---

## 🐛 Troubleshooting

### Bot não responde

1. Verifique se o workflow está **Active**
2. Veja os **Executions** no n8n para ver erros
3. Verifique se o token do Telegram está correto
4. Use `/setprivacy disable` no @BotFather

### Erro 401 na API

- Verifique se a API Key está correta
- Gere uma nova API Key se necessário
- Certifique-se de usar o header `X-API-Key`

### Transcrição incorreta

- Use áudio de boa qualidade
- Fale claramente e pausadamente
- Use Whisper (OpenAI) ao invés de outros STT
- Configure `language: pt` no Whisper

### Comando não reconhecido

- Use palavras-chave claras: "agendar", "reunião", "conta", "pagar"
- Inclua data e hora explicitamente: "amanhã às 15h"
- Para contas, inclua "valor de X reais"

---

## 📊 Monitoramento

### Ver logs no n8n

1. Vá em **Executions**
2. Clique em uma execução para ver detalhes
3. Analise cada step do workflow

### Ver logs no Chatwell

```sql
-- Últimos 50 comandos de voz processados
SELECT
  u.name,
  vcl.transcription,
  vcl.parsed_type,
  vcl.source,
  vcl.created_at
FROM voice_command_logs vcl
JOIN users u ON vcl.user_id = u.id
ORDER BY vcl.created_at DESC
LIMIT 50;
```

### Métricas

- Taxa de sucesso de transcrições
- Taxa de sucesso de parsing
- Comandos mais usados
- Usuários mais ativos

---

## 🚀 Próximos Passos

Depois de configurar o básico:

1. [ ] Adicione suporte a edição de eventos por voz
2. [ ] Implemente consultas ("quais minhas contas do mês?")
3. [ ] Configure lembretes automáticos via bot
4. [ ] Adicione suporte a anexos (fotos de boletos)
5. [ ] Integre com Google Calendar

---

## 📚 Recursos

- [Documentação n8n](https://docs.n8n.io)
- [API Telegram Bot](https://core.telegram.org/bots/api)
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- [Chatwell API Docs](./VOICE_COMMANDS_API.md)

---

**Chatwell Pro** - Gestão por comando de voz 🎙️

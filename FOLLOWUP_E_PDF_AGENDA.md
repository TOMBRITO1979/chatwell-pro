# Follow-up Automático e Geração de PDF da Agenda

## Follow-up Automático Diário

### Descrição
Sistema de follow-up automático que envia mensagens de confirmação para todos os agendamentos do dia seguinte, todos os dias às 8h da manhã.

### Funcionalidades

#### Envio Automático:
- **Horário:** Executado diariamente às 8:00 AM
- **Destinatários:** Todos os eventos do dia seguinte que tenham telefone ou email cadastrado
- **Canais:** WhatsApp e Email
- **Intervalo:** 50 segundos entre cada mensagem (para evitar bloqueio)

#### Mensagem Enviada:
```
🔔 Confirmação de Agendamento

Olá! Este é um lembrete para confirmar seu agendamento de amanhã:

📋 [Título do Evento]
📅 Data/Hora: [DD/MM/YYYY HH:MM]
📍 Local: [Se houver]

Por favor, confirme sua presença respondendo esta mensagem.

Aguardamos você! 🤝
```

### Como Configurar

#### 1. Configuração Manual (Para Testes):
Você pode executar o follow-up manualmente acessando:
```
POST /api/notifications/daily-followup
```

Ou via navegador/curl:
```bash
curl -X POST http://seu-dominio.com/api/notifications/daily-followup
```

#### 2. Configuração Automática com Cron Job:

**Docker Swarm / Docker Compose:**
Adicione um serviço de cron no seu `docker-compose.yml`:

```yaml
services:
  cron-followup:
    image: alpine:latest
    command: >
      sh -c "echo '0 8 * * * wget -O- http://chatwell-pro:3000/api/notifications/daily-followup' | crontab - && crond -f"
    depends_on:
      - chatwell-pro
    networks:
      - chatwell-network
```

**Sistema Linux (Crontab):**
```bash
# Editar crontab
crontab -e

# Adicionar linha (executar às 8h todos os dias)
0 8 * * * curl -X POST https://seu-dominio.com/api/notifications/daily-followup
```

**Vercel / Netlify / Cloud Functions:**
Use serviços de cron jobs como:
- Vercel Cron Jobs
- GitHub Actions com schedule
- EasyCron (https://www.easycron.com/)

Exemplo de GitHub Action (`.github/workflows/daily-followup.yml`):
```yaml
name: Daily Follow-up

on:
  schedule:
    - cron: '0 11 * * *'  # 8h AM Brasília = 11h UTC

jobs:
  followup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Follow-up
        run: |
          curl -X POST https://seu-dominio.com/api/notifications/daily-followup
```

### Logs e Monitoramento

O sistema gera logs detalhados para cada execução:

```
========================================
📅 INICIANDO FOLLOW-UP DIÁRIO DE AGENDAMENTOS
========================================
⏰ Horário: 13/10/2025 08:00:00

👤 Processando usuário: João Silva (ID: xxx)
  📋 Encontrados 3 evento(s) para follow-up

  📌 Evento 1/3: "Reunião com Cliente"
     Horário: 14/10/2025 10:00
     Contatos: 📱 WhatsApp 📧 Email
     ✅ WhatsApp enviado para 5511999999999
     ✅ Email enviado para cliente@example.com
     ⏳ Aguardando 50 segundos antes do próximo...

========================================
✅ FOLLOW-UP DIÁRIO CONCLUÍDO
========================================
```

### Requisitos

1. **WhatsApp (WAHA):**
   - Configuração WAHA ativa no sistema
   - Sessão WhatsApp conectada (status: WORKING)
   - Configurado por usuário em /configuracoes

2. **Email (SMTP):**
   - Servidor SMTP configurado
   - Credenciais válidas

3. **Eventos:**
   - Eventos devem ter telefone OU email cadastrado
   - Eventos do dia seguinte (00:00 até 23:59)

---

## Geração de PDF da Agenda

### Descrição
Permite gerar um PDF com a visualização em lista de todos os eventos da agenda do mês atual.

### Como Usar

1. **Acesse a página Agenda**
2. **Clique no botão "Gerar PDF"** (ícone vermelho de documento)
3. **Uma nova aba se abrirá** com a visualização formatada
4. **Use Ctrl+P ou Cmd+P** para salvar como PDF ou imprimir

### Conteúdo do PDF

O PDF inclui:
- **Cabeçalho:** Título, período selecionado e data de geração
- **Resumo:** Total de agendamentos no período
- **Lista de Eventos:** Cada evento com:
  - Título e tipo de evento
  - Data e horário
  - Local (se houver)
  - Cliente associado (se houver)
  - Projeto associado (se houver)
  - Telefone e email de contato
  - Descrição completa

### Formato

- Layout profissional e limpo
- Otimizado para impressão A4
- Cores organizadas por tipo de evento
- Paginação automática
- Rodapé com informações do sistema

### Endpoint da API

```
GET /api/events/export-pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Authorization: Bearer {token}
```

Retorna HTML formatado pronto para impressão/conversão em PDF.

### Filtros

O PDF respeita o período selecionado na agenda:
- **Visualização Mensal:** Todos os eventos do mês
- **Período customizado:** Use os parâmetros `start_date` e `end_date`

---

## Troubleshooting

### Follow-up não está enviando mensagens

1. **Verificar se o cron job está configurado:**
   ```bash
   # Linux
   crontab -l

   # Docker
   docker service logs cron-followup
   ```

2. **Verificar configuração WAHA:**
   - Acessar /configuracoes
   - Verificar se está "Ativo"
   - Verificar se sessão está "Conectada"

3. **Verificar logs do container:**
   ```bash
   docker service logs chatwell-pro --tail 100 -f
   ```

4. **Testar manualmente:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/daily-followup
   ```

### PDF não está gerando

1. **Verificar se há eventos no período:**
   - O botão fica desabilitado se não houver eventos

2. **Verificar bloqueador de pop-ups:**
   - O PDF abre em nova aba
   - Permitir pop-ups do domínio

3. **Testar diretamente a API:**
   ```bash
   curl -H "Authorization: Bearer {seu_token}" \
        "http://localhost:3000/api/events/export-pdf?start_date=2025-10-01&end_date=2025-10-31"
   ```

---

## Exemplos de Uso

### Cenário 1: Consultório Médico
- **Follow-up às 8h:** Confirma consultas do dia seguinte
- **PDF Mensal:** Relatório de todos os atendimentos do mês

### Cenário 2: Agência de Serviços
- **Follow-up às 8h:** Lembra clientes de visitas agendadas
- **PDF Semanal:** Planning da equipe

### Cenário 3: Escritório de Advocacia
- **Follow-up às 8h:** Confirma audiências e reuniões
- **PDF Customizado:** Relatório de compromissos por período

---

## Notas Importantes

1. **Intervalo de 50 segundos:** Essencial para evitar bloqueio do WhatsApp
2. **Horário do servidor:** O cron deve considerar o timezone correto
3. **Backup:** Sempre faça backup antes de configurar cron jobs
4. **Monitoramento:** Configure alertas para falhas no envio
5. **LGPD:** Os dados são processados conforme consentimento do usuário

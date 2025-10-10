# 🎉 Chatwell Pro v3.4 - Guia Rápido de Deploy

## 📦 O que há de novo na v3.4?

### ✅ Correções Implementadas:

1. **Correção de Erro na Agenda**
   - Corrigido erro ao criar eventos na agenda
   - Implementado fallback para colunas phone/email
   - Agora cria eventos mesmo se migrations não foram executadas

2. **Otimização da Aba Clientes**
   - Removida caixa "Em Andamento" (redundante)
   - Interface mais limpa e focada

3. **Formulário de Cliente Aprimorado**
   - Adicionados campos de serviço diretamente no cadastro
   - Possibilidade de adicionar múltiplos serviços por cliente
   - Opção de editar e deletar serviços
   - Seleção de status para cada serviço (Em Tratativa, Iniciado, Pendente, Cancelado)

4. **Sincronização Automática com Kanban**
   - Serviços cadastrados agora aparecem automaticamente no Kanban
   - Criação automática de tasks ao criar contratos de serviço
   - Sincronização bidirecional entre contratos e Kanban

5. **Correção na Aba Serviços**
   - Corrigida listagem de "Contratações Em Andamento"
   - Agora mostra apenas serviços com status "iniciado"

## 🚀 Deploy Rápido (Portainer)

### 1. Atualizar Stack

No Portainer:
- Editar stack "chatwell"
- Colar conteúdo de `docker-compose-stack.yml` (versão v3.4)
- Atualizar stack

### 2. Executar Migrations (se ainda não executou)

```bash
# Acessar container
docker exec -it $(docker ps -q -f name=chatwell_chatwell | head -1) sh

# Rodar migrations
node scripts/run-migration.js database/migrations/001_add_service_contracts.sql
node scripts/run-migration.js database/migrations/002_add_event_contact_fields.sql

exit
```

**NOTA:** Se as migrations falharem, a aplicação continuará funcionando com funcionalidades reduzidas (sem campos de contato na agenda).

### 3. Verificar Funcionamento

1. **Health Check:** https://app.chatwell.pro/api/health
2. **Login:** https://app.chatwell.pro
3. **Testar:**
   - Criar novo cliente com serviços
   - Verificar se aparece no Kanban
   - Criar evento na agenda
   - Verificar "Contratações Em Andamento" na aba Serviços

## ✅ Novos Recursos

### Cadastro de Cliente com Serviços

1. Vá em **Clientes** → **Novo Cliente**
2. Preencha os dados do cliente
3. Role até "Serviços Contratados"
4. Clique em **Adicionar Serviço**
5. Selecione:
   - Serviço/Produto/Projeto
   - Status (Em Tratativa, Iniciado, Pendente, Cancelado)
   - Data de Contratação
   - Data de Entrega (opcional)
   - Observações
6. Adicione quantos serviços precisar
7. Clique em **Salvar**

### Sincronização com Kanban

Quando você cria um contrato de serviço:
1. Uma task é criada automaticamente no Kanban
2. O título da task é: "[Nome do Serviço] - [Nome do Cliente]"
3. O status da task reflete o status do contrato
4. Mudanças no Kanban atualizam o contrato e vice-versa

## 📊 Imagens Docker

- **Latest:** tomautomations/chatwell-pro:latest
- **v3.4:** tomautomations/chatwell-pro:v3.4
- **Digest:** sha256:5a374a4ed13bde8c0cc93673138bd4259b4c9bbd5d0623fe585d92a25434e5a3

## 🔄 Atualização da v3.3 para v3.4

Se você está rodando v3.3, basta atualizar a stack no Portainer:

1. Editar stack
2. Mudar `image: tomautomations/chatwell-pro:v3.3` para `image: tomautomations/chatwell-pro:v3.4`
3. Clicar em **Update the stack**
4. Aguardar deploy (2-3 minutos)

**Não é necessário executar novas migrations.**

## 🐛 Problemas Conhecidos Resolvidos

- ✅ Erro ao criar eventos na agenda
- ✅ "Contratações Em Andamento" não listando serviços
- ✅ Falta de integração entre clientes e serviços
- ✅ Kanban não sincronizando com contratos

## 📝 Variáveis de Ambiente (Mantidas)

### Gmail SMTP:
```env
DEFAULT_SMTP_USER: "chatwellpro@gmail.com"
DEFAULT_SMTP_PASS: "xoru ncif szdv brjc"
```

### WAHA:
```env
WAHA_BASE_URL: "https://zap.joinerchat.net"
WAHA_API_KEY: "CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM"
WAHA_SESSION_NAME: "chatwell-pro"
WAHA_DEFAULT_PHONE: "380947105869@c.us"
```

### Senhas:
```env
POSTGRES_PASSWORD: RuGc2mfJ8oJW6giog3RiJCBd5qZmWp
JWT_SECRET: RuGc2mfJ8oJW6giog3RiJCBd5qZmWpSD
CRON_SECRET: chatwell-cron-secret-2025
```

## 🔧 Troubleshooting

### Erro ao criar eventos
Se ainda ocorrer erro ao criar eventos, verifique:
1. Executar migration: `002_add_event_contact_fields.sql`
2. Verificar logs: `docker service logs chatwell_chatwell --tail 50`

### Contratações não aparecem
Verifique:
1. O status do serviço está como "iniciado"?
2. O contrato foi criado corretamente?
3. Logs: `docker service logs chatwell_chatwell | grep contract`

### Serviços não aparecem no Kanban
Verifique:
1. O contrato foi criado após a v3.4?
2. Existe uma task criada?
3. Verifique na aba "Tarefas" se a task foi criada

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs: `docker service logs chatwell_chatwell`
2. Consulte `DEPLOY_PORTAINER.md` para deployment
3. Consulte `TROUBLESHOOTING.md` para problemas comuns

---

**Versão:** v3.4
**Build:** 2025-10-10
**Status:** ✅ Pronto para produção
**Compatível com:** v3.3 (atualização direta)

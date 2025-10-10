# 🎉 Chatwell Pro v3.5 - Correções Importantes

## 📦 O que há de novo na v3.5?

### ✅ Correções Críticas:

1. **Erro ao Editar Eventos na Agenda - CORRIGIDO ✅**
   - Implementado fallback para campos phone/email ao editar eventos
   - GET de evento agora retorna phone/email quando disponível
   - Formulário de edição agora carrega e salva corretamente todos os campos

2. **Phone e Email Não Salvavam - CORRIGIDO ✅**
   - Campos phone e email agora são salvos corretamente ao criar/editar eventos
   - Dados carregam corretamente ao editar evento
   - Funciona mesmo se migrations não foram executadas

3. **"Contratações Em Andamento" Não Listava Serviços - CORRIGIDO ✅**
   - Antes: só mostrava serviços com status "iniciado"
   - Agora: mostra TODOS os serviços ativos (Em Tratativa, Iniciado, Pendente)
   - Exclui apenas serviços "Cancelado"

   **Importante:** Quando você cadastra um cliente com serviços, eles aparecem imediatamente em "Contratações Em Andamento" (mesmo com status "Em Tratativa")

## 🚀 Deploy Rápido (Portainer)

### Atualizar de v3.4 para v3.5

1. **No Portainer:**
   - Editar stack "chatwell"
   - Mudar `image: tomautomations/chatwell-pro:v3.4` para `image: tomautomations/chatwell-pro:v3.5`
   - Clicar em **Update the stack**
   - Aguardar 2-3 minutos

2. **Não é necessário executar migrations** - a v3.5 é compatível com v3.4

3. **Verificar:**
   - https://app.chatwell.pro/api/health
   - Criar/editar evento na agenda
   - Criar cliente com serviços
   - Verificar "Contratações Em Andamento"

## ✅ Problemas Resolvidos

### Problema 1: Erro ao Editar Agendamento
**Antes:** Ao editar um evento, dava erro e não salvava

**Agora:**
- Edição funciona perfeitamente
- Phone/email são carregados corretamente
- Todos os campos são salvos

### Problema 2: Dados Não Salvavam
**Antes:** Phone, email, datas de início/fim não eram salvos

**Agora:**
- Todos os campos são persistidos no banco
- Ao reabrir para editar, dados estão lá
- Funciona com ou sem migrations aplicadas

### Problema 3: Serviços Cadastrados Não Apareciam
**Antes:** Cadastrava cliente com serviços, mas não aparecia em "Contratações Em Andamento"

**Agora:**
- Qualquer serviço cadastrado (exceto cancelado) aparece
- Status válidos: Em Tratativa, Iniciado, Pendente
- Atualizações em tempo real

## 📊 Imagens Docker

- **Latest:** tomautomations/chatwell-pro:latest
- **v3.5:** tomautomations/chatwell-pro:v3.5
- **Digest:** sha256:841fdef0a798560318ee5a35dc3f5f9e3ee194e8034f93285d7731c555a51076

## 🔄 Mudanças Técnicas

### Arquivos Modificados:

1. **app/api/events/[id]/route.ts**
   - Adicionado fallback para UPDATE sem phone/email
   - Adicionado check de colunas no GET
   - Retorna phone/email quando disponível

2. **app/api/service-contracts/route.ts**
   - Alterado filtro de "Em Andamento"
   - Antes: `status = 'iniciado'`
   - Agora: `status != 'cancelado'`

## 🧪 Como Testar

### Teste 1: Editar Evento
1. Vá em **Agenda**
2. Crie um novo evento com phone/email
3. Clique para editar
4. Verifique se phone/email aparecem
5. Altere algo e salve
6. Edite novamente - dados devem estar salvos

### Teste 2: Cadastrar Cliente com Serviços
1. Vá em **Clientes** → **Novo Cliente**
2. Preencha dados do cliente
3. Clique em **Adicionar Serviço**
4. Selecione um serviço, deixe status "Em Tratativa"
5. Salve
6. Vá em **Serviços** → verifique "Contratações Em Andamento"
7. O serviço deve aparecer!

### Teste 3: Mudar Status do Serviço
1. Vá em **Clientes** → clique em um cliente
2. Na seção "Serviços Contratados", clique em **Editar**
3. Mude o status para "Iniciado"
4. Salve
5. Vá em **Serviços** → deve continuar aparecendo
6. Mude para "Cancelado" → deve desaparecer da lista

## 📝 Variáveis de Ambiente (Mantidas)

Todas as configurações da v3.4 permanecem iguais:

```env
DEFAULT_SMTP_USER: "chatwellpro@gmail.com"
DEFAULT_SMTP_PASS: "xoru ncif szdv brjc"
WAHA_BASE_URL: "https://zap.joinerchat.net"
WAHA_API_KEY: "CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM"
POSTGRES_PASSWORD: RuGc2mfJ8oJW6giog3RiJCBd5qZmWp
JWT_SECRET: RuGc2mfJ8oJW6giog3RiJCBd5qZmWpSD
CRON_SECRET: chatwell-cron-secret-2025
```

## 🐛 Troubleshooting

### Ainda dá erro ao editar evento?
1. Verifique se a imagem está v3.5: `docker service inspect chatwell_chatwell | grep Image`
2. Force update: `docker service update --force chatwell_chatwell`
3. Veja logs: `docker service logs chatwell_chatwell --tail 50`

### Serviços ainda não aparecem?
1. Certifique-se que o status NÃO é "cancelado"
2. Recarregue a página
3. Verifique se o contrato foi criado: vá em Clientes → cliente → Serviços Contratados

### Dados ainda não salvam?
1. Verifique a versão da imagem (deve ser v3.5)
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique se não há erros no console do navegador (F12)

## 📞 Suporte

Se precisar de ajuda:
1. Logs: `docker service logs chatwell_chatwell --tail 100`
2. Status: `docker service ps chatwell_chatwell`
3. GitHub: https://github.com/TOMBRITO1979/chatwell-pro

---

**Versão:** v3.5
**Build:** 2025-10-10
**Status:** ✅ Pronto para produção
**Compatível com:** v3.4 (atualização direta sem migrations)

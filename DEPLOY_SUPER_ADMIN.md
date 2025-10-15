# Guia Completo - Deploy do Super Admin na Stack

## Problema Atual
- Código do super admin está no GitHub
- Imagem Docker atual não tem o código do super admin
- Precisa fazer build de nova imagem e atualizar a stack

## Solução - Passo a Passo

### Passo 1: Build da Nova Imagem Docker

#### Opção A - Usando o script automático (Recomendado)
```bash
# No diretório do projeto, execute:
build-and-push.bat
```

Este script irá:
1. Criar uma nova imagem com timestamp
2. Criar tags `latest` e `super-admin`
3. Perguntar se deseja fazer push
4. Fazer push para Docker Hub

#### Opção B - Manual
```bash
# Login no Docker Hub (se ainda não estiver logado)
docker login

# Build da imagem (isso leva alguns minutos)
docker build -t tomautomations/chatwell-pro:latest .

# Push para Docker Hub
docker push tomautomations/chatwell-pro:latest
```

### Passo 2: Atualizar a Stack no Portainer

1. **Acesse o Portainer**
   - URL: Seu Portainer
   - Faça login

2. **Vá para Stacks**
   - Menu lateral → Stacks
   - Selecione a stack `chatwell` (ou o nome da sua stack)

3. **Atualize a Imagem**

   Opção A - Atualizar para latest:
   ```yaml
   chatwell:
     image: tomautomations/chatwell-pro:latest
   ```

   Opção B - Usar tag específica com timestamp:
   ```yaml
   chatwell:
     image: tomautomations/chatwell-pro:20251015-XXXXXX
   ```

4. **Adicione variável de ambiente para Super Admin (Opcional)**
   ```yaml
   environment:
     # ... suas variáveis existentes ...

     # Super Admin (opcional - se não definir, será gerado automaticamente)
     SUPER_ADMIN_PASSWORD: "SuaSenhaSegura@2025"
   ```

5. **Update da Stack**
   - Marque a opção **"Pull and redeploy"** ou **"Pull latest image"**
   - Clique em **"Update the stack"**
   - Aguarde a atualização (1-2 minutos)

### Passo 3: Executar a Migração do Super Admin

Após a stack atualizar, você precisa executar a migração para criar a tabela e o super admin.

#### No Portainer:

1. **Encontre o Container**
   - Menu lateral → Containers
   - Procure por `chatwell_chatwell` (ou similar)
   - Clique no container

2. **Abra o Console**
   - Clique em **"Console"**
   - Selecione `/bin/sh` como shell
   - Clique em **"Connect"**

3. **Execute a Migração**
   ```bash
   npm run super-admin:setup
   ```

4. **IMPORTANTE: Anote as Credenciais!**
   O script exibirá algo como:
   ```
   ==============================================
   MIGRAÇÃO CONCLUÍDA COM SUCESSO!
   ==============================================
   Credenciais de acesso (ANOTE ESTAS INFORMAÇÕES):
   Usuário: admin
   Senha: XyZ123abC456DeF@

   Acesse: /super-admin/login
   ==============================================
   ```

   **COPIE E GUARDE ESSAS CREDENCIAIS EM LOCAL SEGURO!**

### Passo 4: Testar o Acesso

1. **Acesse o Login do Super Admin**
   ```
   https://app.chatwell.pro/super-admin/login
   ```

2. **Faça Login**
   - Usuário: `admin`
   - Senha: A que foi exibida no console

3. **Verifique o Dashboard**
   - Deve mostrar estatísticas
   - Lista de usuários
   - Botões para ativar/desativar

## Troubleshooting

### Erro 404 no /super-admin/login

**Causa:** A imagem Docker não foi atualizada ou o build não incluiu os novos arquivos.

**Solução:**
```bash
# Verifique se o build foi feito a partir do código mais recente
git pull origin main

# Faça o build novamente
docker build -t tomautomations/chatwell-pro:latest .
docker push tomautomations/chatwell-pro:latest

# No Portainer, force um novo pull
# Em vez de "Update", use "Redeploy" com "Pull latest"
```

### Erro na migração: "Tabela já existe"

**Causa:** A migração já foi executada antes.

**Solução:**
```bash
# A conta de super admin já existe
# Use a senha que foi gerada na primeira execução
# Se esqueceu, você pode resetar:

# Conecte no PostgreSQL
docker exec -it chatwell_postgres psql -U chatwell -d chatwell

# Delete o super admin (CUIDADO!)
DELETE FROM super_admins WHERE username = 'admin';

# Saia do PostgreSQL
\q

# Execute a migração novamente
npm run super-admin:setup
```

### Docker Build muito lento

**Causa:** Build de imagens Next.js pode demorar.

**Dica:**
- Use cache do Docker
- Certifique-se que tem boa conexão de internet
- Pode demorar 5-10 minutos na primeira vez

### Erro de permissão ao fazer push

**Causa:** Não está logado no Docker Hub ou não tem permissão na conta `tomautomations`.

**Solução:**
```bash
# Faça login
docker login

# Digite suas credenciais do Docker Hub
# Username: tomautomations
# Password: sua senha do Docker Hub
```

### Container não inicia após atualização

**Causa:** Possível erro na build ou configuração.

**Solução:**
```bash
# Verifique os logs no Portainer
# Containers → Seu container → Logs

# Ou via comando:
docker service logs chatwell_chatwell

# Se necessário, faça rollback
# No Portainer, edite a stack e volte para a imagem anterior:
image: tomautomations/chatwell-pro:20251014-233500
```

## Verificação Final

Após tudo pronto, verifique:

- [ ] Build da imagem concluído
- [ ] Push para Docker Hub concluído
- [ ] Stack atualizada no Portainer
- [ ] Containers rodando (2 réplicas)
- [ ] Migração executada com sucesso
- [ ] Credenciais anotadas em local seguro
- [ ] Login funcionando em `/super-admin/login`
- [ ] Dashboard carregando com dados
- [ ] Consegue ativar/desativar usuários

## Segurança

✅ **O que está protegido:**
- Senha gerada aleatoriamente (16 caracteres)
- Token JWT com expiração de 24h
- Rotas protegidas com autenticação
- Senhas nunca expostas no código

⚠️ **Lembre-se:**
- Guarde as credenciais em local seguro
- Use HTTPS em produção (já configurado no seu Traefik)
- Monitore acessos ao painel de super admin
- Altere a senha periodicamente

## Próximos Passos (Opcional)

Funcionalidades que você pode adicionar depois:
- [ ] Trocar senha do super admin
- [ ] Criar múltiplos super admins
- [ ] Logs de auditoria
- [ ] Notificações de ações críticas
- [ ] Exportar relatórios de usuários
- [ ] Ver detalhes de uso por usuário

## Suporte

Se tiver algum problema:
1. Verifique os logs no Portainer
2. Verifique a conexão com o banco de dados
3. Verifique se a imagem está correta
4. Teste fazer rollback para versão anterior se necessário

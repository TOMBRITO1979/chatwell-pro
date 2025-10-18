# Instruções para Atualizar a Imagem Docker com Super Admin

## Pré-requisitos
- Docker Desktop rodando
- Login no Docker Hub realizado: `docker login`

## Passos para Build e Deploy

### 1. Build da imagem Docker

```bash
docker build -t tombrito1979/chatwell-pro:latest -t tombrito1979/chatwell-pro:super-admin .
```

Isso criará duas tags:
- `latest` - tag padrão, sempre aponta para a versão mais recente
- `super-admin` - tag específica para esta versão com super admin

### 2. Push para o Docker Hub

```bash
# Push da tag latest
docker push tombrito1979/chatwell-pro:latest

# Push da tag super-admin
docker push tombrito1979/chatwell-pro:super-admin
```

### 3. Atualizar containers em produção

Se você estiver usando Docker Swarm ou Portainer:

```bash
# Opção 1: Pull e restart manual
docker pull tombrito1979/chatwell-pro:latest
docker-compose down
docker-compose up -d

# Opção 2: Via Portainer
# - Acesse o Portainer
# - Vá para Stacks
# - Clique em "Update the stack"
# - Marque "Pull latest image"
# - Clique em "Update"

# Opção 3: Docker Swarm
docker service update --image tombrito1979/chatwell-pro:latest chatwell-pro
```

## Após Deploy

### 1. Execute a migração do Super Admin

Acesse o container em produção e execute:

```bash
# Via docker exec
docker exec -it <container_id> npm run super-admin:setup

# Ou via Portainer
# - Acesse o container console
# - Execute: npm run super-admin:setup
```

### 2. Anote as credenciais

O script exibirá as credenciais de acesso. **IMPORTANTE:** Anote e guarde em local seguro!

```
Usuário: admin
Senha: <senha_gerada_automaticamente>
```

### 3. Acesse o painel

Navegue para: `https://seu-dominio.com/super-admin/login`

## Verificação

Para verificar se a atualização foi bem-sucedida:

1. Acesse `/super-admin/login`
2. Faça login com as credenciais geradas
3. Verifique se o dashboard carrega corretamente
4. Teste ativar/desativar um usuário

## Rollback (se necessário)

Se houver algum problema, você pode fazer rollback para a versão anterior:

```bash
# Encontre a versão anterior
docker images tombrito1979/chatwell-pro

# Faça rollback
docker service update --image tombrito1979/chatwell-pro:<hash_anterior> chatwell-pro
```

## Segurança

✅ **O que foi feito:**
- Senhas geradas aleatoriamente (16 caracteres)
- Nenhuma senha hardcoded no código
- Token JWT com expiração de 24h
- Autenticação separada para super admin
- Arquivos .env protegidos no .gitignore

⚠️ **Boas práticas:**
- Altere a senha do super admin após primeiro login
- Use HTTPS em produção
- Mantenha o JWT_SECRET seguro
- Monitore logs de acesso ao painel

## Troubleshooting

### Erro: "Super admin já existia no banco de dados"

Isso significa que o super admin já foi criado. Use a senha da primeira execução.

### Esqueci a senha do super admin

Você pode gerar uma nova senha:

```bash
# Acesse o container
docker exec -it <container_id> /bin/sh

# Execute o script novamente com nova senha
SUPER_ADMIN_PASSWORD="SuaNovaSenha@123" npm run super-admin:setup
```

### Migration falhou

Verifique:
1. Conexão com PostgreSQL está funcionando
2. DATABASE_URL está configurado corretamente
3. Usuário do banco tem permissões adequadas

```bash
# Teste a conexão
docker exec -it <container_id> npm run db:test
```

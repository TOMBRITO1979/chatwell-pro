# Chatwell Pro - Deployment Guide

Este guia explica como fazer o deploy do Chatwell Pro usando Docker Swarm e Portainer.

## 🏗️ Arquitetura

O Chatwell Pro é deployado como uma stack Docker Swarm com múltiplos serviços:

### Serviços e URLs

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **app** | https://app.chatwell.pro | Interface principal da aplicação |
| **api** | https://api.chatwell.pro | API REST pública |
| **auth** | https://auth.chatwell.pro | Autenticação OAuth (callbacks Google) |
| **hooks** | https://hooks.chatwell.pro | Webhooks de entrada (WAHA, outros) |
| **status** | https://status.chatwell.pro | Monitoramento e health checks |
| **docs** | https://docs.chatwell.pro | Documentação interativa da API |
| **cdn** | https://cdn.chatwell.pro | Arquivos estáticos (opcional) |

### Infraestrutura

- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e sessões
- **Traefik**: Reverse proxy com SSL automático
- **Docker Swarm**: Orquestração de containers

## 📋 Pré-requisitos

1. **Docker Swarm** inicializado
2. **Domínio configurado** com DNS apontando para o servidor
3. **Portainer** (opcional, para interface gráfica)
4. **Git** para clonar o repositório

## 🚀 Deploy Automatizado

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/chatwell-pro.git
cd chatwell-pro
```

### 2. Configure os secrets

```bash
# Execute o script interativo para criar secrets
./deployment/scripts/create-secrets.sh
```

O script irá solicitar:

- **Database Password**: Senha do PostgreSQL
- **JWT Secret**: Chave para assinar tokens JWT
- **Google Client Secret**: Secret do OAuth Google
- **Email Password**: Senha/app password do seu provedor de email
- **WAHA API Key**: Chave da API do WhatsApp

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Docker Registry (opcional)
REGISTRY=ghcr.io/seu-usuario
TAG=latest

# Email para certificados SSL
ACME_EMAIL=admin@chatwell.pro

# Configurações de integração
GOOGLE_CLIENT_ID=sua-google-client-id
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
WAHA_BASE_URL=http://seu-waha-server:3000
```

### 4. Execute o deploy

```bash
# Torna o script executável
chmod +x ./deployment/scripts/deploy.sh

# Executa o deploy
./deployment/scripts/deploy.sh --email admin@chatwell.pro
```

## 🔧 Deploy Manual via Portainer

### 1. Acesse o Portainer

Vá para sua instância do Portainer (ex: https://portainer.seudominio.com)

### 2. Crie os Secrets

No Portainer, vá para **Secrets** e crie:

- `db_password`
- `jwt_secret`
- `google_client_secret`
- `email_password`
- `waha_api_key`

### 3. Deploy da Stack

1. Vá para **Stacks**
2. Clique em **Add stack**
3. Cole o conteúdo do arquivo `deployment/swarm/chatwell-stack.yml`
4. Configure as variáveis de ambiente:

```env
REGISTRY=ghcr.io/seu-usuario
TAG=latest
ACME_EMAIL=admin@chatwell.pro
GOOGLE_CLIENT_ID=sua-google-client-id
DB_PASSWORD=sua-senha-db
```

5. Clique em **Deploy the stack**

## 🔍 Verificação do Deploy

### Health Checks

```bash
# Status geral do sistema
curl -s https://status.chatwell.pro/api/status | jq '.status'

# Health de serviços individuais
curl -s https://app.chatwell.pro/api/health
curl -s https://api.chatwell.pro/api/health
curl -s https://hooks.chatwell.pro/api/health
```

### Logs dos Serviços

```bash
# Ver logs de todos os serviços
docker service logs chatwell_app
docker service logs chatwell_api
docker service logs chatwell_postgres

# Acompanhar logs em tempo real
docker service logs -f chatwell_app
```

### Status dos Serviços

```bash
# Ver status da stack
docker stack services chatwell

# Detalhes dos serviços
docker service ls
docker service ps chatwell_app
```

## 🌐 Configuração de DNS

Configure os seguintes registros DNS:

```
app.chatwell.pro     A     SEU_IP_SERVIDOR
api.chatwell.pro     A     SEU_IP_SERVIDOR
auth.chatwell.pro    A     SEU_IP_SERVIDOR
hooks.chatwell.pro   A     SEU_IP_SERVIDOR
status.chatwell.pro  A     SEU_IP_SERVIDOR
docs.chatwell.pro    A     SEU_IP_SERVIDOR
cdn.chatwell.pro     A     SEU_IP_SERVIDOR
```

Ou use um wildcard:

```
*.chatwell.pro       A     SEU_IP_SERVIDOR
```

## 🔐 Configuração de SSL

O Traefik gerencia automaticamente os certificados SSL via Let's Encrypt.

Para verificar os certificados:

```bash
# Ver certificados gerados
docker exec $(docker ps -q -f name=chatwell_traefik) ls -la /letsencrypt/
```

## 📊 Monitoramento

### URLs de Monitoramento

- **Status Geral**: https://status.chatwell.pro
- **Traefik Dashboard**: https://traefik.chatwell.pro (se habilitado)
- **API Docs**: https://docs.chatwell.pro

### Métricas Importantes

```bash
# CPU e Memória dos serviços
docker stats $(docker ps -q -f label=com.docker.stack.namespace=chatwell)

# Espaço em disco
df -h
docker system df
```

## 🔄 Atualizações

### Atualização Automática (GitHub Actions)

O projeto inclui GitHub Actions que constroem e fazem push da imagem automaticamente.

### Atualização Manual

```bash
# Pull da nova imagem
docker service update --image ghcr.io/seu-usuario/chatwell-pro:nova-tag chatwell_app

# Ou rebuild local
docker build -t chatwell-pro:latest .
docker service update --image chatwell-pro:latest chatwell_app
```

## 🛠️ Troubleshooting

### Serviços não iniciam

```bash
# Verificar logs de erro
docker service logs chatwell_app
docker service logs chatwell_postgres

# Verificar recursos
docker node ls
docker system df
```

### Problemas de SSL

```bash
# Verificar configuração do Traefik
docker service logs chatwell_traefik

# Forçar renovação de certificados
docker exec $(docker ps -q -f name=chatwell_traefik) \
  traefik certificates renew
```

### Banco de dados

```bash
# Conectar ao PostgreSQL
docker exec -it $(docker ps -q -f name=chatwell_postgres) \
  psql -U chatwell -d chatwell_pro

# Backup do banco
docker exec $(docker ps -q -f name=chatwell_postgres) \
  pg_dump -U chatwell chatwell_pro > backup.sql
```

### Reset completo

```bash
# Remover a stack
docker stack rm chatwell

# Limpar volumes (CUIDADO: apaga dados!)
docker volume prune
docker system prune -a
```

## 📞 Suporte

Para problemas de deployment:

1. Verifique os logs dos serviços
2. Confirme que todos os secrets estão criados
3. Valide a configuração DNS
4. Teste conectividade de rede

Para mais ajuda, consulte:
- [Documentação Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Documentação Traefik](https://doc.traefik.io/traefik/)
- [Issues do projeto](https://github.com/seu-usuario/chatwell-pro/issues)
# 🚀 INSTRUÇÕES DE DEPLOY - CHATWELL PRO

## Passo 1: Atualizar a Stack no Portainer

No Portainer, vá até a stack "chatwell" e clique em **Update Stack** ou **Redeploy**.

Se preferir via linha de comando:

```bash
docker service update --image tomautomations/chatwell-pro:latest chatwell_chatwell --force
```

## Passo 2: Inicializar o Banco de Dados

### 2.1 - Listar containers do chatwell
```bash
docker ps | grep chatwell
```

### 2.2 - Entrar no container do PostgreSQL
```bash
# Identifique o ID ou nome do container postgres (algo como chatwell_postgres.1.xxxxx)
docker exec -it <ID_DO_CONTAINER_POSTGRES> sh
```

### 2.3 - Dentro do container do Postgres, conectar ao banco
```bash
psql -U chatwell -d chatwell
```

### 2.4 - Verificar se as tabelas existem
```sql
\dt
```

Se não aparecer nenhuma tabela, você precisa criar o schema.

### 2.5 - Sair do psql
```sql
\q
```

## Passo 3: Criar o Schema do Banco (se necessário)

### Opção A: Copiar o schema.sql para o container

**No seu servidor (fora do container):**

```bash
# 1. Baixar o schema.sql do GitHub
wget https://raw.githubusercontent.com/TOMBRITO1979/chatwell-pro/main/database/schema.sql

# 2. Copiar para o container postgres
docker cp schema.sql <ID_CONTAINER_POSTGRES>:/tmp/schema.sql

# 3. Entrar no container
docker exec -it <ID_CONTAINER_POSTGRES> sh

# 4. Executar o schema
psql -U chatwell -d chatwell -f /tmp/schema.sql

# 5. Verificar se criou as tabelas
psql -U chatwell -d chatwell -c "\dt"
```

### Opção B: Executar direto do container da aplicação

```bash
# 1. Entrar no container da aplicação chatwell
docker exec -it <ID_CONTAINER_CHATWELL> sh

# 2. Executar o script de inicialização
node scripts/init-db.js
```

## Passo 4: Verificar se está funcionando

### 4.1 - Testar a API de saúde
```bash
curl https://app.chatwell.pro/api/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy"
  }
}
```

### 4.2 - Criar primeiro usuário

Acesse no navegador:
```
https://app.chatwell.pro/auth/register
```

Preencha o formulário e crie sua conta.

## Passo 5: Testar Login

```
https://app.chatwell.pro/auth/login
```

## 🎯 Resumo dos Comandos Principais

```bash
# Listar containers
docker ps | grep chatwell

# Entrar no Postgres
docker exec -it chatwell_postgres.1.xxxxx sh

# Entrar na aplicação
docker exec -it chatwell_chatwell.1.xxxxx sh

# Ver logs da aplicação
docker service logs chatwell_chatwell -f

# Ver logs do postgres
docker service logs chatwell_postgres -f

# Forçar update da imagem
docker service update --image tomautomations/chatwell-pro:latest chatwell_chatwell --force
```

## 🔧 Troubleshooting

### Erro: "Database connection failed"

1. Verifique se o postgres está rodando:
```bash
docker service ls | grep postgres
```

2. Verifique a senha do banco na stack:
```bash
# A variável POSTGRES_PASSWORD deve ser a mesma em:
# - Serviço postgres
# - Variável DATABASE_URL da aplicação
```

### Erro: "Table does not exist"

Execute o schema do banco (Passo 3).

### Ver estrutura das tabelas

```bash
docker exec -it <ID_POSTGRES> psql -U chatwell -d chatwell

# Dentro do psql:
\dt                    # Lista todas as tabelas
\d users              # Mostra estrutura da tabela users
\d clients            # Mostra estrutura da tabela clients
```

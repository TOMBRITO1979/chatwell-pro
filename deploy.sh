#!/bin/bash

# Script de Deploy - Chatwell Pro v3.3
# Este script automatiza o processo de build e deploy

echo "🚀 Iniciando deploy do Chatwell Pro v3.3..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na branch main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo -e "${RED}❌ Erro: Você deve estar na branch main para fazer deploy${NC}"
    exit 1
fi

# Build da imagem Docker
echo -e "${BLUE}📦 Fazendo build da imagem Docker...${NC}"
docker build -t tomautomations/chatwell-pro:latest -t tomautomations/chatwell-pro:v3.3 .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da imagem${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

# Push para Docker Hub
echo -e "${BLUE}📤 Fazendo push para Docker Hub...${NC}"
docker push tomautomations/chatwell-pro:latest
docker push tomautomations/chatwell-pro:v3.3

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer push para Docker Hub${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Push concluído com sucesso!${NC}"

# Atualizar serviço no Docker Swarm
echo -e "${BLUE}🔄 Atualizando serviço no Docker Swarm...${NC}"
docker service update --image tomautomations/chatwell-pro:latest chatwell_chatwell

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao atualizar serviço${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Serviço atualizado com sucesso!${NC}"

# Verificar status do serviço
echo -e "${BLUE}📊 Verificando status do serviço...${NC}"
docker service ps chatwell_chatwell

echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}📝 Não esqueça de:${NC}"
echo "   1. Executar as migrations no banco de dados"
echo "   2. Configurar os cron jobs (veja CRON_JOBS_SETUP.md)"
echo "   3. Verificar os logs: docker service logs chatwell_chatwell"

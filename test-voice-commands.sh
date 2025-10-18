#!/bin/bash

# ===========================================
# Script de Teste - API de Comandos de Voz
# ===========================================

# Configurações
API_URL="${API_URL:-https://app.chatwell.pro}"
API_KEY="${API_KEY:-sua_api_key_aqui}"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Chatwell Pro - Teste de Comandos"
echo "======================================"
echo ""

# Verificar se API_KEY foi configurada
if [ "$API_KEY" = "sua_api_key_aqui" ]; then
    echo -e "${RED}❌ Configure a API_KEY antes de executar${NC}"
    echo "export API_KEY='sua-api-key-real'"
    exit 1
fi

echo -e "${YELLOW}🔧 Configuração:${NC}"
echo "   URL: $API_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo ""

# Função para fazer requisição
test_command() {
    local name=$1
    local transcription=$2
    local type=${3:-auto}

    echo -e "${YELLOW}📝 Testando: $name${NC}"
    echo "   Comando: \"$transcription\""

    response=$(curl -s -X POST "$API_URL/api/webhooks/voice-commands" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -d "{
            \"transcription\": \"$transcription\",
            \"type\": \"$type\",
            \"source\": \"test-script\"
        }")

    success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2)

    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ Sucesso!${NC}"
        echo "$response" | jq -r '.message' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}❌ Falhou${NC}"
        echo "$response" | jq -r '.message' 2>/dev/null || echo "$response"
    fi

    echo ""
    echo "----------------------------------------"
    echo ""
}

# ========================================
# TESTES DE EVENTOS
# ========================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   TESTANDO CRIAÇÃO DE EVENTOS   ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command \
    "Evento 1: Reunião amanhã" \
    "Agendar reunião com cliente amanhã às 15 horas"

test_command \
    "Evento 2: Consulta marcada" \
    "Marcar consulta dia 25 às 10h30"

test_command \
    "Evento 3: Evento de hoje" \
    "Compromisso hoje às 14h no escritório"

test_command \
    "Evento 4: Reunião online" \
    "Reunião online na próxima segunda às 9h"

test_command \
    "Evento 5: Call específico" \
    "Call com fornecedor dia 20 de novembro às 16h"

# ========================================
# TESTES DE CONTAS
# ========================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   TESTANDO CRIAÇÃO DE CONTAS    ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command \
    "Conta 1: Conta de energia" \
    "Conta de energia vence dia 25 no valor de 350 reais"

test_command \
    "Conta 2: Boleto internet" \
    "Pagar boleto de internet dia 15 de 120 reais"

test_command \
    "Conta 3: Conta a receber" \
    "Receber pagamento do cliente dia 30 de 5000 reais"

test_command \
    "Conta 4: Fatura cartão" \
    "Fatura do cartão vence dia 10 valor 2500"

test_command \
    "Conta 5: Conta de água" \
    "Conta de água para o dia 5 no valor de 85 reais e 50 centavos"

# ========================================
# TESTES DE EDGE CASES
# ========================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   TESTANDO CASOS ESPECIAIS     ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command \
    "Edge 1: Sem data" \
    "Agendar reunião com cliente"

test_command \
    "Edge 2: Sem valor" \
    "Conta de luz vence amanhã"

test_command \
    "Edge 3: Comando ambíguo" \
    "Lembrar de fazer algo importante"

# ========================================
# TESTE GET ENDPOINT
# ========================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   TESTANDO ENDPOINT DE INFO    ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}📝 GET /api/webhooks/voice-commands${NC}"
curl -s "$API_URL/api/webhooks/voice-commands" | jq . 2>/dev/null || curl -s "$API_URL/api/webhooks/voice-commands"
echo ""

# ========================================
# RESUMO
# ========================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}        TESTES CONCLUÍDOS        ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Para verificar os logs no banco:"
echo ""
echo "  psql -U chatwell -d chatwell -c \"SELECT * FROM voice_command_logs ORDER BY created_at DESC LIMIT 10;\""
echo ""

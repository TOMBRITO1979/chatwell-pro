#!/bin/bash

# Script de teste de APIs do Chatwell Pro
# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="https://app.chatwell.pro"
TEST_EMAIL="teste_$(date +%s)@chatwell.test"
TEST_PASSWORD="senha123456"
TOKEN=""

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Chatwell Pro - API Testing Suite${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=$5

    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "  ${BLUE}$method${NC} $endpoint"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASS${NC} (HTTP $http_code)"
        echo -e "  Response: ${body:0:100}..."
    else
        echo -e "  ${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo -e "  Response: $body"
    fi
    echo ""

    # Retornar body para uso posterior
    echo "$body"
}

echo -e "${BLUE}=== 1. AUTHENTICATION APIs ===${NC}\n"

# 1.1 Register
echo -e "${YELLOW}1.1 POST /api/auth/register${NC}"
register_response=$(test_endpoint "POST" "/api/auth/register" \
    "{\"name\":\"Teste User\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "Register new user" 201)

# 1.2 Login
echo -e "${YELLOW}1.2 POST /api/auth/login${NC}"
login_response=$(test_endpoint "POST" "/api/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "Login with credentials" 200)

# Extract token
TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "  ${GREEN}Token extracted:${NC} ${TOKEN:0:50}...\n"

# 1.3 Password Reset Request
echo -e "${YELLOW}1.3 POST /api/auth/reset-password${NC}"
test_endpoint "POST" "/api/auth/reset-password" \
    "{\"email\":\"$TEST_EMAIL\"}" \
    "Request password reset" 200 > /dev/null

echo -e "${BLUE}=== 2. USER MANAGEMENT APIs ===${NC}\n"

# 2.1 Get Profile
echo -e "${YELLOW}2.1 GET /api/user/profile${NC}"
test_endpoint "GET" "/api/user/profile" "" \
    "Get user profile" 200 > /dev/null

# 2.2 Update Profile
echo -e "${YELLOW}2.2 PUT /api/user/profile${NC}"
test_endpoint "PUT" "/api/user/profile" \
    "{\"name\":\"Teste User Updated\",\"phone\":\"+5511999999999\"}" \
    "Update user profile" 200 > /dev/null

# 2.3 Get Settings
echo -e "${YELLOW}2.3 GET /api/user/settings${NC}"
test_endpoint "GET" "/api/user/settings" "" \
    "Get user settings" 200 > /dev/null

# 2.4 Update Settings
echo -e "${YELLOW}2.4 PUT /api/user/settings${NC}"
test_endpoint "PUT" "/api/user/settings" \
    "{\"theme\":\"light\",\"language\":\"pt-BR\",\"currency\":\"BRL\"}" \
    "Update user settings" 200 > /dev/null

echo -e "${BLUE}=== 3. DASHBOARD APIs ===${NC}\n"

# 3.1 Dashboard Stats
echo -e "${YELLOW}3.1 GET /api/dashboard/stats${NC}"
test_endpoint "GET" "/api/dashboard/stats" "" \
    "Get dashboard statistics" 200 > /dev/null

# 3.2 Health Check
echo -e "${YELLOW}3.2 GET /api/health${NC}"
test_endpoint "GET" "/api/health" "" \
    "Health check" 200 > /dev/null

# 3.3 Status
echo -e "${YELLOW}3.3 GET /api/status${NC}"
test_endpoint "GET" "/api/status" "" \
    "System status" 200 > /dev/null

echo -e "${BLUE}=== 4. CLIENTS APIs ===${NC}\n"

# 4.1 List Clients
echo -e "${YELLOW}4.1 GET /api/clients${NC}"
test_endpoint "GET" "/api/clients" "" \
    "List all clients" 200 > /dev/null

# 4.2 Create Client
echo -e "${YELLOW}4.2 POST /api/clients${NC}"
client_response=$(test_endpoint "POST" "/api/clients" \
    "{\"name\":\"Cliente Teste\",\"email\":\"cliente@teste.com\",\"phone\":\"+5511988887777\",\"company\":\"Empresa Teste\"}" \
    "Create new client" 201)

CLIENT_ID=$(echo "$client_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "  ${GREEN}Client ID:${NC} $CLIENT_ID\n"

# 4.3 Get Client
if [ ! -z "$CLIENT_ID" ]; then
    echo -e "${YELLOW}4.3 GET /api/clients/$CLIENT_ID${NC}"
    test_endpoint "GET" "/api/clients/$CLIENT_ID" "" \
        "Get client by ID" 200 > /dev/null
fi

echo -e "${BLUE}=== 5. PROJECTS APIs ===${NC}\n"

# 5.1 List Projects
echo -e "${YELLOW}5.1 GET /api/projects${NC}"
test_endpoint "GET" "/api/projects" "" \
    "List all projects" 200 > /dev/null

# 5.2 Create Project
echo -e "${YELLOW}5.2 POST /api/projects${NC}"
project_response=$(test_endpoint "POST" "/api/projects" \
    "{\"name\":\"Projeto Teste\",\"description\":\"Descrição do projeto\",\"status\":\"active\",\"priority\":\"high\"}" \
    "Create new project" 201)

PROJECT_ID=$(echo "$project_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "  ${GREEN}Project ID:${NC} $PROJECT_ID\n"

echo -e "${BLUE}=== 6. TASKS APIs ===${NC}\n"

# 6.1 List Tasks
echo -e "${YELLOW}6.1 GET /api/tasks${NC}"
test_endpoint "GET" "/api/tasks" "" \
    "List all tasks" 200 > /dev/null

# 6.2 Create Task
echo -e "${YELLOW}6.2 POST /api/tasks${NC}"
task_response=$(test_endpoint "POST" "/api/tasks" \
    "{\"title\":\"Tarefa Teste\",\"description\":\"Descrição da tarefa\",\"status\":\"pending\",\"priority\":\"medium\"}" \
    "Create new task" 201)

TASK_ID=$(echo "$task_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "  ${GREEN}Task ID:${NC} $TASK_ID\n"

echo -e "${BLUE}=== 7. EVENTS (AGENDA) APIs ===${NC}\n"

# 7.1 List Events
echo -e "${YELLOW}7.1 GET /api/events${NC}"
test_endpoint "GET" "/api/events" "" \
    "List all events" 200 > /dev/null

# 7.2 Create Event
echo -e "${YELLOW}7.2 POST /api/events${NC}"
event_response=$(test_endpoint "POST" "/api/events" \
    "{\"title\":\"Reunião Teste\",\"start_time\":\"2025-10-10T10:00:00\",\"end_time\":\"2025-10-10T11:00:00\",\"event_type\":\"meeting\"}" \
    "Create new event" 201)

echo -e "${BLUE}=== 8. ACCOUNTS (CONTAS) APIs ===${NC}\n"

# 8.1 List Accounts
echo -e "${YELLOW}8.1 GET /api/accounts${NC}"
test_endpoint "GET" "/api/accounts" "" \
    "List all accounts" 200 > /dev/null

# 8.2 Create Account
echo -e "${YELLOW}8.2 POST /api/accounts${NC}"
account_response=$(test_endpoint "POST" "/api/accounts" \
    "{\"title\":\"Conta Teste\",\"amount\":1500.00,\"due_date\":\"2025-10-15\",\"type\":\"payable\",\"status\":\"pending\"}" \
    "Create new account" 201)

echo -e "${BLUE}=== 9. PURCHASES APIs ===${NC}\n"

# 9.1 List Purchases
echo -e "${YELLOW}9.1 GET /api/purchases${NC}"
test_endpoint "GET" "/api/purchases" "" \
    "List all purchases" 200 > /dev/null

# 9.2 Create Purchase
echo -e "${YELLOW}9.2 POST /api/purchases${NC}"
test_endpoint "POST" "/api/purchases" \
    "{\"item_name\":\"Item Teste\",\"quantity\":2,\"estimated_price\":50.00,\"category\":\"office\"}" \
    "Create new purchase item" 201 > /dev/null

echo -e "${BLUE}=== 10. BUSINESS EXPENSES APIs ===${NC}\n"

# 10.1 List Business Expenses
echo -e "${YELLOW}10.1 GET /api/business-expenses${NC}"
test_endpoint "GET" "/api/business-expenses" "" \
    "List business expenses" 200 > /dev/null

# 10.2 Create Business Expense
echo -e "${YELLOW}10.2 POST /api/business-expenses${NC}"
test_endpoint "POST" "/api/business-expenses" \
    "{\"description\":\"Despesa Teste\",\"amount\":300.00,\"category\":\"office\",\"status\":\"pending\",\"expense_date\":\"2025-10-08\"}" \
    "Create business expense" 201 > /dev/null

echo -e "${BLUE}=== 11. PERSONAL EXPENSES APIs ===${NC}\n"

# 11.1 List Personal Expenses
echo -e "${YELLOW}11.1 GET /api/personal-expenses${NC}"
test_endpoint "GET" "/api/personal-expenses" "" \
    "List personal expenses" 200 > /dev/null

# 11.2 Create Personal Expense
echo -e "${YELLOW}11.2 POST /api/personal-expenses${NC}"
test_endpoint "POST" "/api/personal-expenses" \
    "{\"description\":\"Despesa Pessoal Teste\",\"amount\":150.00,\"category\":\"food\",\"status\":\"paid\",\"expense_date\":\"2025-10-08\"}" \
    "Create personal expense" 201 > /dev/null

echo -e "${BLUE}=== 12. SMTP CONFIG APIs ===${NC}\n"

# 12.1 Get SMTP Config
echo -e "${YELLOW}12.1 GET /api/smtp/config${NC}"
test_endpoint "GET" "/api/smtp/config" "" \
    "Get SMTP configuration" 200 > /dev/null

echo -e "${BLUE}=== 13. WAHA CONFIG APIs ===${NC}\n"

# 13.1 Get WAHA Config
echo -e "${YELLOW}13.1 GET /api/waha/config${NC}"
test_endpoint "GET" "/api/waha/config" "" \
    "Get WAHA configuration" 200 > /dev/null

echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}  API Testing Complete!${NC}"
echo -e "${BLUE}=====================================${NC}\n"

echo -e "Test user created: ${GREEN}$TEST_EMAIL${NC}"
echo -e "Password: ${GREEN}$TEST_PASSWORD${NC}\n"

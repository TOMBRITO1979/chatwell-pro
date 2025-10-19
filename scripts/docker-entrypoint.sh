#!/bin/sh

echo "🚀 Chatwell Pro - Starting application..."
echo "📦 Version: $(date +%Y%m%d-%H%M%S)"
echo ""

# Verificar se o banco de dados está disponível
if [ -n "$DATABASE_URL" ]; then
  echo "🔍 Verificando conexão com banco de dados..."

  # Tentar conectar ao banco (com timeout)
  timeout 10 sh -c 'until nc -z postgres 5432; do sleep 1; done' 2>/dev/null && echo "✅ PostgreSQL está disponível" || echo "⚠️  PostgreSQL não respondeu em 10s (continuando...)"

  echo ""
  echo "ℹ️  IMPORTANTE: Execute manualmente para inicializar o banco:"
  echo "   1. psql \$DATABASE_URL < /app/database/init-all.sql"
  echo "   2. psql \$DATABASE_URL < /app/database/migrations/000_reset_super_admin.sql"
  echo ""
fi

echo "✅ Iniciando Next.js..."
echo ""

# Start the application
exec node server.js

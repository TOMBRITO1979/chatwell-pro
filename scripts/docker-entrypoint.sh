#!/bin/sh

echo "🔄 Running database migrations..."

# Run migrations if database is available
if [ -n "$DATABASE_URL" ]; then
  echo "📝 Applying migration 002: Event contact fields..."
  node /app/scripts/run-migration.js /app/database/migrations/002_add_event_contact_fields.sql 2>/dev/null || echo "⚠️  Migration 002 already applied or skipped"

  echo "📝 Applying migration 003: Integration settings tables..."
  node /app/scripts/run-migration.js /app/database/migrations/003_add_integration_settings.sql 2>/dev/null || echo "⚠️  Migration 003 already applied or skipped"
fi

echo "✅ Starting application..."

# Start the application
exec node server.js

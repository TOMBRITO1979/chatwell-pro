#!/bin/sh

echo "🔄 Running database migrations..."

# Run migration if database is available
if [ -n "$DATABASE_URL" ]; then
  node /app/scripts/run-migration.js /app/database/migrations/002_add_event_contact_fields.sql 2>/dev/null || echo "⚠️  Migration already applied or skipped"
fi

echo "✅ Starting application..."

# Start the application
exec node server.js

-- ===========================================
-- MIGRATION: Adicionar tabelas de configurações de integrações
-- WAHA (WhatsApp) e SMTP (Email)
-- ===========================================

-- Verificar se extensões e tabelas base existem
DO $$
BEGIN
  -- Verificar se extensão uuid-ossp existe
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE NOTICE '⚠️  Migration 003: Extensão uuid-ossp não existe. Execute init-all.sql primeiro.';
    RETURN;
  END IF;

  -- Verificar se a tabela users existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE '⚠️  Migration 003: Tabela users não existe. Execute init-all.sql primeiro.';
    RETURN;
  END IF;

  -- Verificar se a função update_updated_at_column existe
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    RAISE NOTICE '⚠️  Migration 003: Função update_updated_at_column não existe. Execute init-all.sql primeiro.';
    RETURN;
  END IF;

  -- Tabela de configurações WAHA (WhatsApp HTTP API)
  CREATE TABLE IF NOT EXISTS waha_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    session_name VARCHAR(100) NOT NULL DEFAULT 'default',
    webhook_url VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_waha_settings_user_id ON waha_settings(user_id);
  CREATE INDEX IF NOT EXISTS idx_waha_settings_status ON waha_settings(status);

  -- Tabela de configurações SMTP (Email)
  CREATE TABLE IF NOT EXISTS smtp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    from_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_smtp_settings_user_id ON smtp_settings(user_id);

  -- Triggers para updated_at (verificar se já existem)
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_waha_settings_updated_at') THEN
    CREATE TRIGGER update_waha_settings_updated_at
      BEFORE UPDATE ON waha_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_smtp_settings_updated_at') THEN
    CREATE TRIGGER update_smtp_settings_updated_at
      BEFORE UPDATE ON smtp_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Comentários
  COMMENT ON TABLE waha_settings IS 'Configurações de integração com WhatsApp via WAHA (WhatsApp HTTP API)';
  COMMENT ON TABLE smtp_settings IS 'Configurações de servidor SMTP para envio de emails';

  RAISE NOTICE '✅ Migration 003: Tabelas waha_settings e smtp_settings criadas com sucesso';
END $$;

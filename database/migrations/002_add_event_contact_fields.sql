-- ===========================================
-- MIGRATION: Adicionar campos de contato nos eventos (agenda)
-- Tarefa 4: Adicionar telefone/WhatsApp e e-mail na agenda
-- ===========================================

-- Verificar se a tabela events existe antes de adicionar colunas
DO $$
BEGIN
  -- Verificar se a tabela events existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    -- Adicionar campos de contato à tabela events
    ALTER TABLE events ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    ALTER TABLE events ADD COLUMN IF NOT EXISTS email VARCHAR(255);

    RAISE NOTICE '✅ Migration 002: Campos phone e email adicionados à tabela events';
  ELSE
    RAISE NOTICE '⚠️  Migration 002: Tabela events não existe ainda. Execute init-all.sql primeiro.';
  END IF;
END $$;

-- Comentário: phone será usado para enviar notificações via WhatsApp
-- Comentário: email será usado para enviar notificações via e-mail

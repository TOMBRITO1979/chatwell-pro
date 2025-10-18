-- ===========================================
-- Migration: Suporte para Comandos de Voz
-- ===========================================
-- Adiciona funcionalidades para receber comandos de voz do n8n

-- 1. Adicionar campo api_key na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;

-- Criar índice para api_key
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- 2. Criar tabela de logs de comandos de voz (opcional, para auditoria)
CREATE TABLE IF NOT EXISTS voice_command_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transcription TEXT NOT NULL,
  parsed_type VARCHAR(20),  -- 'event' ou 'account'
  source VARCHAR(20),  -- 'telegram', 'whatsapp', etc
  metadata JSONB,  -- dados adicionais (audio_url, chat_id, etc)
  created_item_id UUID,  -- ID do evento ou conta criado
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON voice_command_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_command_logs(created_at);

-- 3. Função para gerar API Key única
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(64) AS $$
DECLARE
  new_key VARCHAR(64);
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera uma chave aleatória de 64 caracteres
    new_key := encode(gen_random_bytes(32), 'hex');

    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM users WHERE api_key = new_key) INTO key_exists;

    -- Se não existe, retorna
    IF NOT key_exists THEN
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar usuários existentes com API Keys (se ainda não tiverem)
UPDATE users
SET api_key = generate_api_key()
WHERE api_key IS NULL AND is_active = true;

-- 5. Adicionar campos extras na tabela events (caso não existam ainda)
ALTER TABLE events ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- 6. Adicionar campos extras na tabela accounts (caso não existam)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Comentários
COMMENT ON COLUMN users.api_key IS 'API Key para autenticação de webhooks (comandos de voz, n8n, etc)';
COMMENT ON TABLE voice_command_logs IS 'Log de comandos de voz recebidos via n8n/Telegram/WhatsApp';
COMMENT ON COLUMN events.meeting_url IS 'URL da reunião online (Jitsi Meet, Zoom, Google Meet, etc)';

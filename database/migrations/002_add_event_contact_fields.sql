-- ===========================================
-- MIGRATION: Adicionar campos de contato nos eventos (agenda)
-- Tarefa 4: Adicionar telefone/WhatsApp e e-mail na agenda
-- ===========================================

-- Adicionar campos de contato à tabela events
ALTER TABLE events ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Comentário: phone será usado para enviar notificações via WhatsApp
-- Comentário: email será usado para enviar notificações via e-mail

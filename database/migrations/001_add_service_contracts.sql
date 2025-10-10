-- ===========================================
-- MIGRATION: Adicionar tabela de contratos de serviço
-- Tarefa 1: Adicionar seção de Serviços na aba Cliente
-- ===========================================

-- Primeiro, vamos adicionar novos campos à tabela projects
-- para suportar o conceito de "serviço/produto/projeto"
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'project';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentário: service_type pode ser: 'service', 'product', 'project'

-- ===========================================
-- TABELA: service_contracts (Contratações de Serviços por Cliente)
-- ===========================================
CREATE TABLE IF NOT EXISTS service_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Datas importantes
  contract_date DATE NOT NULL,
  delivery_date DATE,

  -- Status do contrato
  status VARCHAR(20) DEFAULT 'em_tratativa',
  -- Valores possíveis: 'em_tratativa', 'iniciado', 'pendente', 'cancelado'

  -- Informações adicionais
  notes TEXT,
  tags TEXT[],

  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_service_contracts_user_id ON service_contracts(user_id);
CREATE INDEX idx_service_contracts_client_id ON service_contracts(client_id);
CREATE INDEX idx_service_contracts_project_id ON service_contracts(project_id);
CREATE INDEX idx_service_contracts_status ON service_contracts(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_service_contracts_updated_at
  BEFORE UPDATE ON service_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Atualizar status dos projects existentes
-- ===========================================
-- Os status dos projects agora serão sincronizados com os contracts
-- Vamos garantir que os valores sejam compatíveis
UPDATE projects
SET status = CASE
  WHEN status = 'planning' THEN 'em_tratativa'
  WHEN status = 'in_progress' THEN 'iniciado'
  WHEN status = 'on_hold' THEN 'pendente'
  WHEN status = 'cancelled' THEN 'cancelado'
  WHEN status = 'completed' THEN 'iniciado'
  ELSE status
END
WHERE status IN ('planning', 'in_progress', 'on_hold', 'cancelled', 'completed');

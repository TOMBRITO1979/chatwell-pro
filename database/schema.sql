-- ==== DB & Extensões =======================================================
-- Crie o DB (se já estiver dentro dele, ignore esta linha)
-- CREATE DATABASE chatwell_pro WITH TEMPLATE=template0 ENCODING 'UTF8';

-- Dentro do DB:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==== Tipos (enums) ========================================================
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner','admin','member');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notify_strategy') THEN
    CREATE TYPE notify_strategy AS ENUM ('own_whatsapp','shared_whatsapp','email_only','mixed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waha_mode') THEN
    CREATE TYPE waha_mode AS ENUM ('own_phone','shared_phone');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waha_status') THEN
    CREATE TYPE waha_status AS ENUM ('pending','active','error','disabled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM ('whatsapp','email');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE service_status AS ENUM ('pending','in_progress','delivered','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_type') THEN
    CREATE TYPE bill_type AS ENUM ('personal','business');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_status') THEN
    CREATE TYPE bill_status AS ENUM ('open','paid','overdue','canceled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('pending','in_progress','done','canceled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('planejando','iniciando','pendente','em_andamento','concluido');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_scope') THEN
    CREATE TYPE expense_scope AS ENUM ('personal','business');
  END IF;
END$;

-- ==== Funções auxiliares ===================================================
-- ULID-like (opcional). Podemos usar uuid por ora para simplificar:
CREATE OR REPLACE FUNCTION gen_ulid() RETURNS text AS $
  SELECT encode(gen_random_bytes(16), 'hex');
$ LANGUAGE sql IMMUTABLE;

-- ==== Tabelas núcleo =======================================================
CREATE TABLE IF NOT EXISTS accounts (
  id              text PRIMARY KEY DEFAULT gen_ulid(),
  name            text NOT NULL,
  plan            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                  text PRIMARY KEY DEFAULT gen_ulid(),
  account_id          text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name                text NOT NULL,
  email               citext NOT NULL,
  phone               text,
  password_digest     text NOT NULL,
  email_verified_at   timestamptz,
  role                user_role NOT NULL DEFAULT 'member',
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email_per_account ON users(account_id, email);
CREATE INDEX IF NOT EXISTS idx_users_account_role ON users(account_id, role);

-- Opcional: refresh tokens/sessions
CREATE TABLE IF NOT EXISTS sessions (
  id                text PRIMARY KEY DEFAULT gen_ulid(),
  user_id           text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Perfil & Conexões
CREATE TABLE IF NOT EXISTS profiles (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  company_name     text,
  address          text,
  phone            text,
  mobile           text,
  email_default    citext,
  notify_strategy  notify_strategy NOT NULL DEFAULT 'mixed'
);

CREATE TABLE IF NOT EXISTS waha_connections (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name             text NOT NULL,
  base_url         text NOT NULL,
  api_key          text NOT NULL,
  mode             waha_mode NOT NULL,
  session_id       text,
  status           waha_status NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waha_unique_name ON waha_connections(account_id, name);
CREATE INDEX IF NOT EXISTS idx_waha_status ON waha_connections(account_id, status);

CREATE TABLE IF NOT EXISTS email_connections (
  id                   text PRIMARY KEY DEFAULT gen_ulid(),
  account_id           text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  address              citext NOT NULL,
  provider             text,
  smtp_host            text,
  smtp_user            text,
  smtp_encrypted_secret text,
  active               boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_connections_unique ON email_connections(account_id, address);

CREATE TABLE IF NOT EXISTS google_identities (
  id                 text PRIMARY KEY DEFAULT gen_ulid(),
  account_id         text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id            text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_user        text NOT NULL,
  access_token_enc   text NOT NULL,
  refresh_token_enc  text,
  expires_at         timestamptz,
  scope              text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_identity_unique ON google_identities(account_id, user_id);

CREATE TABLE IF NOT EXISTS message_templates (
  id                text PRIMARY KEY DEFAULT gen_ulid(),
  account_id        text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name              text NOT NULL,
  channel           channel_type NOT NULL,
  locale            text,
  subject           text,
  body_markdown     text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_msgtpl_unique ON message_templates(account_id, name, channel);

-- Clientes & serviços
CREATE TABLE IF NOT EXISTS customers (
  id                 text PRIMARY KEY DEFAULT gen_ulid(),
  account_id         text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  first_name         text,
  last_name          text,
  display_name       text NOT NULL,
  birthdate          date,
  phone              text,
  mobile             text,
  email              citext,
  company            text,
  address            text,
  ltv_count          integer NOT NULL DEFAULT 0,
  ltv_amount_cents   bigint  NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_account_display ON customers(account_id, display_name);
CREATE INDEX IF NOT EXISTS idx_customers_account_email ON customers(account_id, email);

CREATE TABLE IF NOT EXISTS customer_services (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  customer_id      text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_name     text NOT NULL,
  description      text,
  status           service_status NOT NULL DEFAULT 'pending',
  contracted_at    date,
  delivery_at      date,
  amount_cents     bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cust_services_main ON customer_services(account_id, customer_id, status);
CREATE INDEX IF NOT EXISTS idx_cust_services_delivery ON customer_services(delivery_at);

-- Agendas & compromissos
CREATE TABLE IF NOT EXISTS calendars (
  id                     text PRIMARY KEY DEFAULT gen_ulid(),
  account_id             text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  default_template_id    text REFERENCES message_templates(id),
  default_connection_id  text REFERENCES waha_connections(id),
  created_by             text REFERENCES users(id),
  created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_unique_name ON calendars(account_id, name);

CREATE TABLE IF NOT EXISTS calendar_bindings (
  id                   text PRIMARY KEY DEFAULT gen_ulid(),
  calendar_id          text NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  message_template_id  text REFERENCES message_templates(id),
  waha_connection_id   text REFERENCES waha_connections(id),
  email_connection_id  text REFERENCES email_connections(id)
);
CREATE INDEX IF NOT EXISTS idx_calendar_bindings_calendar ON calendar_bindings(calendar_id);

CREATE TABLE IF NOT EXISTS appointments (
  id                 text PRIMARY KEY DEFAULT gen_ulid(),
  account_id         text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  calendar_id        text NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  customer_id        text REFERENCES customers(id),
  starts_at          timestamptz NOT NULL,
  ends_at            timestamptz NOT NULL,
  title              text NOT NULL,
  location           text,
  description        text,
  email              citext,
  phone              text,
  confirmation_code  text NOT NULL,
  created_by         text REFERENCES users(id),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appt_confirm_code ON appointments(account_id, confirmation_code);
CREATE INDEX IF NOT EXISTS idx_appt_time ON appointments(account_id, calendar_id, starts_at);

CREATE TABLE IF NOT EXISTS google_events (
  id                 text PRIMARY KEY DEFAULT gen_ulid(),
  appointment_id     text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  google_event_id    text NOT NULL,
  google_calendar_id text,
  synced_at          timestamptz,
  last_error         text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_events_appt ON google_events(appointment_id);

-- Contas a pagar
CREATE TABLE IF NOT EXISTS bills (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  type             bill_type NOT NULL,
  amount_cents     bigint NOT NULL,
  due_date         date NOT NULL,
  is_recurring     boolean NOT NULL DEFAULT false,
  rrule            text,
  status           bill_status NOT NULL DEFAULT 'open',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bills_time ON bills(account_id, type, due_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  due_date         date,
  status           task_status NOT NULL DEFAULT 'pending',
  assignee_id      text REFERENCES users(id),
  created_by       text REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(account_id, status, due_date);

-- Projetos & despesas de projeto
CREATE TABLE IF NOT EXISTS projects (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name             text NOT NULL,
  budget_cents     bigint NOT NULL DEFAULT 0,
  status           project_status NOT NULL DEFAULT 'planejando',
  due_date         date,
  created_by       text REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(account_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_due ON projects(due_date);

CREATE TABLE IF NOT EXISTS project_expenses (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  project_id       text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  spent_at         date NOT NULL,
  title            text NOT NULL,
  amount_cents     bigint NOT NULL,
  note             text
);
CREATE INDEX IF NOT EXISTS idx_project_expenses_main ON project_expenses(account_id, project_id, spent_at);

-- Lista de compras
CREATE TABLE IF NOT EXISTS shopping_list (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  item             text NOT NULL,
  quantity         integer NOT NULL DEFAULT 1,
  unit             text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shopping_created ON shopping_list(account_id, created_at);

-- Gastos (pessoais/empresariais)
CREATE TABLE IF NOT EXISTS expenses (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  scope            expense_scope NOT NULL,
  title            text NOT NULL,
  category         text NOT NULL,
  amount_cents     bigint NOT NULL,
  spent_at         date NOT NULL,
  notes            text
);
CREATE INDEX IF NOT EXISTS idx_expenses_time ON expenses(account_id, scope, spent_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Outbox / webhooks / idempotência / auditoria
CREATE TABLE IF NOT EXISTS notifications_outbox (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  topic            text NOT NULL,
  payload_json     jsonb NOT NULL,
  status           text NOT NULL DEFAULT 'pending',
  attempts         integer NOT NULL DEFAULT 0,
  last_error       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON notifications_outbox(status, created_at);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id               text PRIMARY KEY DEFAULT gen_ulid(),
  account_id       text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  url              text NOT NULL,
  secret           text NOT NULL,
  active           boolean NOT NULL DEFAULT true,
  events_mask      text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_unique ON webhook_endpoints(account_id, url);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id                      text PRIMARY KEY DEFAULT gen_ulid(),
  account_id              text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  key                     text NOT NULL,
  request_fingerprint     text,
  response_snapshot_json  jsonb,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_idem_unique ON idempotency_keys(account_id, key);

CREATE TABLE IF NOT EXISTS audit_logs (
  id             text PRIMARY KEY DEFAULT gen_ulid(),
  account_id     text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id        text REFERENCES users(id),
  action         text NOT NULL,
  entity_table   text NOT NULL,
  entity_id      text NOT NULL,
  diff_json      jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(account_id, entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ==== Seed mínimo (opcional) ===============================================
-- Cria uma conta e um usuário admin (troque email/senha depois!)
INSERT INTO accounts (name) VALUES ('Conta Padrão') ON CONFLICT DO NOTHING;
INSERT INTO users (account_id,name,email,phone,password_digest,role)
SELECT id,'Admin','admin@chatwell.pro','+1-555-0100', crypt('Pass!1234', gen_salt('bf')), 'owner'
FROM accounts WHERE name = 'Conta Padrão'
ON CONFLICT (account_id, email) DO NOTHING;
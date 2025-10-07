export interface User {
  id: string;
  account_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'member';
  email_verified_at?: Date;
  created_at: Date;
}

export interface Account {
  id: string;
  name: string;
  plan?: string;
  created_at: Date;
}

export interface Customer {
  id: string;
  account_id: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  birthdate?: Date;
  phone?: string;
  mobile?: string;
  email?: string;
  company?: string;
  address?: string;
  ltv_count: number;
  ltv_amount_cents: number;
  created_at: Date;
}

export interface CustomerService {
  id: string;
  account_id: string;
  customer_id: string;
  service_name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled';
  contracted_at?: Date;
  delivery_at?: Date;
  amount_cents: number;
}

export interface Appointment {
  id: string;
  account_id: string;
  calendar_id: string;
  customer_id?: string;
  starts_at: Date;
  ends_at: Date;
  title: string;
  location?: string;
  description?: string;
  email?: string;
  phone?: string;
  confirmation_code: string;
  created_by?: string;
  updated_at: Date;
}

export interface Calendar {
  id: string;
  account_id: string;
  name: string;
  default_template_id?: string;
  default_connection_id?: string;
  created_by?: string;
  created_at: Date;
}

export interface Bill {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  type: 'personal' | 'business';
  amount_cents: number;
  due_date: Date;
  is_recurring: boolean;
  rrule?: string;
  status: 'open' | 'paid' | 'overdue' | 'canceled';
  created_at: Date;
}

export interface Task {
  id: string;
  account_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  status: 'pending' | 'in_progress' | 'done' | 'canceled';
  assignee_id?: string;
  created_by?: string;
  created_at: Date;
}

export interface Project {
  id: string;
  account_id: string;
  name: string;
  budget_cents: number;
  status: 'planejando' | 'iniciando' | 'pendente' | 'em_andamento' | 'concluido';
  due_date?: Date;
  created_by?: string;
  created_at: Date;
}

export interface ProjectExpense {
  id: string;
  account_id: string;
  project_id: string;
  spent_at: Date;
  title: string;
  amount_cents: number;
  note?: string;
}

export interface ShoppingItem {
  id: string;
  account_id: string;
  item: string;
  quantity: number;
  unit?: string;
  notes?: string;
  created_at: Date;
}

export interface Expense {
  id: string;
  account_id: string;
  scope: 'personal' | 'business';
  title: string;
  category: string;
  amount_cents: number;
  spent_at: Date;
  notes?: string;
}

export interface WhatsAppConnection {
  id: string;
  account_id: string;
  name: string;
  base_url: string;
  api_key: string;
  mode: 'own_phone' | 'shared_phone';
  session_id?: string;
  status: 'pending' | 'active' | 'error' | 'disabled';
  created_at: Date;
}

export interface EmailConnection {
  id: string;
  account_id: string;
  address: string;
  provider?: string;
  smtp_host?: string;
  smtp_user?: string;
  smtp_encrypted_secret?: string;
  active: boolean;
}

export interface MessageTemplate {
  id: string;
  account_id: string;
  name: string;
  channel: 'whatsapp' | 'email';
  locale?: string;
  subject?: string;
  body_markdown: string;
  created_at: Date;
}
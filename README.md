# Chatwell Pro - Sistema de Gestão Empresarial

Um sistema completo de gestão empresarial com design moderno, responsivo e funcionalidades abrangentes.

## 🚀 Características

### ✅ Implementado
- **Autenticação Completa**: Login, registro, verificação de email, recuperação de senha
- **Dashboard Interativo**: Visão geral com agenda, contas, tarefas, compras e projetos
- **Layout Responsivo**: Design moderno que funciona em desktop e mobile
- **Navegação Lateral**: Acesso rápido a todos os módulos
- **Sistema de Cores**: Verde, azul, lilás e vermelho para categorização visual

### 🔧 Módulos do Sistema

1. **Dashboard** - Visão geral de todas as atividades
2. **Clientes** - Gestão completa de clientes e serviços
3. **Agenda** - Calendário com integração Google Calendar
4. **Contas a Pagar** - Controle financeiro com notificações
5. **Tarefas** - Gerenciamento de tarefas e produtividade
6. **Projetos** - Gestão de projetos com orçamentos
7. **Kanban** - Quadro visual para projetos e clientes
8. **Lista de Compras** - Organização de compras
9. **Gastos Empresariais** - Controle de despesas da empresa
10. **Gastos Pessoais** - Gestão de finanças pessoais
11. **Perfil** - Configurações pessoais e integrações
12. **Configurações** - Ajustes do sistema

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL com schema completo
- **Authentication**: JWT, bcrypt
- **Integrations**: WhatsApp API (WAHA), Google Calendar, Email

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar o servidor de desenvolvimento
npm run dev
```

## 🗄️ Banco de Dados

O sistema inclui um schema PostgreSQL completo com:
- Gestão de usuários e contas
- Clientes e serviços
- Agenda e compromissos
- Projetos e despesas
- Tarefas e notificações
- Integrações WhatsApp/Email

## 🔑 Funcionalidades Principais

### Autenticação
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Verificação de email
- ✅ Recuperação de senha
- ✅ Geração de tokens JWT

### Dashboard
- ✅ Visão geral de agenda
- ✅ Resumo de contas a pagar
- ✅ Lista de tarefas pendentes
- ✅ Itens de compras
- ✅ Status de projetos

### Integrações Planejadas
- 📅 Google Calendar API
- 📱 WhatsApp API (WAHA)
- 📧 Sistema de emails
- 🔔 Notificações automáticas

## 🎨 Design

O sistema utiliza um design moderno com:
- **Cores principais**: Verde (#10bb82), Azul (#1e90ff), Lilás (#9370db), Vermelho (#ff4d4f)
- **Gradientes suaves** para botões e elementos visuais
- **Cards com bordas coloridas** para categorização
- **Efeitos hover** e transições suaves
- **Layout responsivo** para todas as telas

## 📱 Responsividade

- ✅ Layout adaptativo para desktop e mobile
- ✅ Navegação lateral colapsível
- ✅ Cards e tabelas responsivas
- ✅ Formulários otimizados para touch

## 🚀 Deploy e Produção

### Docker & Swarm Deploy

O projeto está pronto para deploy em produção com Docker Swarm:

```bash
# 1. Criar secrets do Docker
./deployment/scripts/create-secrets.sh

# 2. Deploy da stack completa
./deployment/scripts/deploy.sh --email admin@chatwell.pro
```

### URLs de Produção Configuradas

- **🌐 App Principal**: https://app.chatwell.pro
- **🔌 API Pública**: https://api.chatwell.pro
- **🔐 OAuth/Auth**: https://auth.chatwell.pro
- **📨 Webhooks**: https://hooks.chatwell.pro
- **📊 Status/Health**: https://status.chatwell.pro
- **📚 API Docs**: https://docs.chatwell.pro
- **📁 CDN/Estáticos**: https://cdn.chatwell.pro

### Deploy no Portainer

1. Importe o arquivo `deployment/swarm/chatwell-stack.yml`
2. Configure os secrets necessários
3. Deploy com um clique

Veja o [**DEPLOYMENT.md**](./DEPLOYMENT.md) para guia completo de deploy.

## 🔄 Próximas Etapas de Desenvolvimento

1. **Módulo de Clientes** - CRUD completo com histórico LTV
2. **Sistema de Agenda** - Calendário interativo com Google Calendar
3. **Gestão de Contas** - Controle financeiro com recorrências
4. **WhatsApp Integration** - Notificações via WAHA API
5. **Email System** - Templates e envios automáticos

## 🌐 URLs do Sistema

- **Dashboard**: `/`
- **Login**: `/auth/login`
- **Registro**: `/auth/register`
- **Verificação**: `/auth/verify`
- **Clientes**: `/clientes`
- **Agenda**: `/agenda`
- **Contas**: `/contas`
- **Tarefas**: `/tarefas`
- **Projetos**: `/projetos`
- **Kanban**: `/kanban`
- **Compras**: `/compras`
- **Gastos Empresariais**: `/gastos-empresariais`
- **Gastos Pessoais**: `/gastos-pessoais`
- **Perfil**: `/perfil`
- **Configurações**: `/configuracoes`

## 📝 Status de Desenvolvimento

- 🟢 **Concluído**: Estrutura base, autenticação, navegação, dashboard
- 🟡 **Em Progresso**: Módulos individuais de gestão
- 🔴 **Pendente**: Integrações externas, notificações automáticas

---

**Chatwell Pro** - Sistema completo de gestão empresarial com foco em produtividade e experiência do usuário.
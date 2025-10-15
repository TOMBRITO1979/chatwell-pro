# Sistema de Super Admin - Chatwell Pro

## O que foi implementado

Um sistema completo de super administração foi criado para gerenciar usuários do Chatwell Pro.

### Funcionalidades

1. **Login de Super Admin**
   - Sistema de autenticação separado com usuário e senha
   - Token JWT específico para super admin
   - Sessão segura de 24 horas

2. **Dashboard de Administração**
   - Estatísticas gerais do sistema:
     - Total de usuários cadastrados
     - Usuários ativos e inativos
     - Usuários com email verificado
     - Total de clientes, projetos, tarefas e eventos

3. **Gerenciamento de Usuários**
   - Lista completa com todos os usuários cadastrados
   - Informações exibidas:
     - Nome
     - Email
     - Telefone
     - Nome da empresa
     - Status (Ativo/Inativo)
     - Email verificado
     - Data de criação
   - Ações disponíveis:
     - Ativar conta
     - Desativar conta

## Como usar

### 1. Configurar o Super Admin no banco de dados

Execute o seguinte comando para criar a tabela e o super admin padrão:

```bash
npm install tsx
npm run super-admin:setup
```

Isso irá criar:
- Tabela `super_admins` no banco de dados
- Índices para melhor performance
- Um super admin padrão (as credenciais serão exibidas no console)

### 2. Acessar o painel de super admin

1. Navegue para: `http://localhost:3000/super-admin/login`
2. Entre com as credenciais que foram exibidas ao executar o setup
3. Após o login, você será redirecionado para o dashboard
4. **IMPORTANTE:** Altere a senha padrão imediatamente após o primeiro acesso

### 3. Gerenciar usuários

No dashboard você pode:

- Ver estatísticas gerais do sistema
- Ver lista completa de todos os usuários
- Ativar ou desativar contas de usuários
- Ver detalhes de cada usuário (email, telefone, empresa)

### Quando um usuário é desativado:

- Ele não consegue mais fazer login no sistema
- Recebe a mensagem: "Conta desativada. Entre em contato com o suporte."
- Todos os dados são mantidos no banco
- A conta pode ser reativada a qualquer momento

## Segurança

⚠️ **IMPORTANTE:**
- Altere a senha padrão após o primeiro login!
- O token de super admin expira em 24 horas
- Apenas super admins podem acessar as rotas `/api/super-admin/*`
- Tokens de usuários normais não funcionam nas rotas de super admin

## Arquivos criados

### Backend (API):
- `app/api/super-admin/auth/login/route.ts` - Login de super admin
- `app/api/super-admin/users/route.ts` - Listar usuários
- `app/api/super-admin/users/[id]/route.ts` - Gerenciar usuário específico
- `app/api/super-admin/stats/route.ts` - Estatísticas do sistema
- `lib/superAdminAuth.ts` - Funções de autenticação

### Frontend:
- `app/super-admin/login/page.tsx` - Página de login
- `app/super-admin/dashboard/page.tsx` - Página do dashboard
- `components/super-admin/super-admin-login-form.tsx` - Formulário de login
- `components/super-admin/super-admin-dashboard.tsx` - Dashboard completo

### Database:
- `database/migrations/005_add_super_admin.sql` - Migration SQL
- `scripts/run-super-admin-migration.ts` - Script de instalação

## API Endpoints

Todos os endpoints requerem autenticação com token de super admin no header:
```
Authorization: Bearer <super_admin_token>
```

### Autenticação
- `POST /api/super-admin/auth/login` - Login de super admin

### Usuários
- `GET /api/super-admin/users` - Listar todos os usuários
- `GET /api/super-admin/users/:id` - Obter detalhes de um usuário
- `PATCH /api/super-admin/users/:id` - Ativar/desativar usuário

### Estatísticas
- `GET /api/super-admin/stats` - Obter estatísticas gerais do sistema

## Fluxo de trabalho

1. Super admin faz login em `/super-admin/login`
2. Sistema verifica credenciais e gera token JWT
3. Token é armazenado no localStorage
4. Dashboard carrega estatísticas e lista de usuários
5. Super admin pode ativar/desativar contas
6. Usuários desativados não conseguem fazer login

## Próximos passos (opcionais)

Funcionalidades que podem ser adicionadas no futuro:
- Criar novos super admins
- Alterar senha de super admin
- Ver logs de atividade dos usuários
- Filtrar e buscar usuários
- Exportar relatórios
- Enviar notificações para usuários
- Gerenciar permissões específicas

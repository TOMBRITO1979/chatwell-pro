import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar estatísticas de todos os módulos
    const [
      clientsResult,
      tasksResult,
      projectsResult,
      eventsResult,
      accountsResult,
      businessExpensesResult,
      personalExpensesResult,
      purchasesResult
    ] = await Promise.all([
      // Clientes
      db.query('SELECT COUNT(*) as total FROM clients WHERE user_id = $1', [payload.userId]),

      // Tarefas
      db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status != 'completed' AND status != 'cancelled' AND due_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
        FROM tasks WHERE user_id = $1
      `, [payload.userId]),

      // Projetos
      db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM projects WHERE user_id = $1
      `, [payload.userId]),

      // Eventos (próximos 7 dias)
      db.query(`
        SELECT COUNT(*) as upcoming
        FROM events
        WHERE user_id = $1
        AND start_time >= CURRENT_TIMESTAMP
        AND start_time <= CURRENT_TIMESTAMP + INTERVAL '7 days'
      `, [payload.userId]),

      // Contas a pagar/receber
      db.query(`
        SELECT
          SUM(CASE WHEN type = 'receivable' AND status = 'pending' THEN amount ELSE 0 END) as receivable_pending,
          SUM(CASE WHEN type = 'receivable' AND status = 'paid' THEN amount ELSE 0 END) as receivable_paid,
          SUM(CASE WHEN type = 'payable' AND status = 'pending' THEN amount ELSE 0 END) as payable_pending,
          SUM(CASE WHEN type = 'payable' AND status = 'paid' THEN amount ELSE 0 END) as payable_paid
        FROM accounts WHERE user_id = $1
      `, [payload.userId]),

      // Gastos empresariais
      db.query(`
        SELECT
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid
        FROM business_expenses WHERE user_id = $1
      `, [payload.userId]),

      // Gastos pessoais
      db.query(`
        SELECT
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid
        FROM personal_expenses WHERE user_id = $1
      `, [payload.userId]),

      // Lista de compras
      db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN purchased = false THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN purchased = false THEN COALESCE(estimated_price, 0) ELSE 0 END) as total_estimated
        FROM purchases WHERE user_id = $1
      `, [payload.userId])
    ]);

    // Buscar tarefas recentes (últimas 5)
    const recentTasksResult = await db.query(`
      SELECT id, title, status, priority, due_date
      FROM tasks
      WHERE user_id = $1
      AND status != 'completed'
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        due_date ASC NULLS LAST
      LIMIT 5
    `, [payload.userId]);

    // Buscar eventos próximos (próximos 5)
    const upcomingEventsResult = await db.query(`
      SELECT id, title, start_time, end_time, event_type
      FROM events
      WHERE user_id = $1
      AND start_time >= CURRENT_TIMESTAMP
      ORDER BY start_time ASC
      LIMIT 5
    `, [payload.userId]);

    // Buscar contas próximas ao vencimento (próximos 7 dias)
    const upcomingAccountsResult = await db.query(`
      SELECT id, title, amount, due_date, type, status
      FROM accounts
      WHERE user_id = $1
      AND status = 'pending'
      AND due_date >= CURRENT_DATE
      AND due_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY due_date ASC
      LIMIT 5
    `, [payload.userId]);

    // Preparar resposta
    const stats = {
      clients: {
        total: parseInt(clientsResult.rows[0]?.total || 0)
      },
      tasks: {
        total: parseInt(tasksResult.rows[0]?.total || 0),
        pending: parseInt(tasksResult.rows[0]?.pending || 0),
        in_progress: parseInt(tasksResult.rows[0]?.in_progress || 0),
        completed: parseInt(tasksResult.rows[0]?.completed || 0),
        overdue: parseInt(tasksResult.rows[0]?.overdue || 0)
      },
      projects: {
        total: parseInt(projectsResult.rows[0]?.total || 0),
        active: parseInt(projectsResult.rows[0]?.active || 0),
        completed: parseInt(projectsResult.rows[0]?.completed || 0)
      },
      events: {
        upcoming: parseInt(eventsResult.rows[0]?.upcoming || 0)
      },
      accounts: {
        receivable_pending: parseFloat(accountsResult.rows[0]?.receivable_pending || 0),
        receivable_paid: parseFloat(accountsResult.rows[0]?.receivable_paid || 0),
        payable_pending: parseFloat(accountsResult.rows[0]?.payable_pending || 0),
        payable_paid: parseFloat(accountsResult.rows[0]?.payable_paid || 0)
      },
      business_expenses: {
        pending: parseFloat(businessExpensesResult.rows[0]?.pending || 0),
        paid: parseFloat(businessExpensesResult.rows[0]?.paid || 0)
      },
      personal_expenses: {
        pending: parseFloat(personalExpensesResult.rows[0]?.pending || 0),
        paid: parseFloat(personalExpensesResult.rows[0]?.paid || 0)
      },
      purchases: {
        total: parseInt(purchasesResult.rows[0]?.total || 0),
        pending: parseInt(purchasesResult.rows[0]?.pending || 0),
        total_estimated: parseFloat(purchasesResult.rows[0]?.total_estimated || 0)
      }
    };

    return NextResponse.json({
      success: true,
      stats,
      recent_tasks: recentTasksResult.rows,
      upcoming_events: upcomingEventsResult.rows,
      upcoming_accounts: upcomingAccountsResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}

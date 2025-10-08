import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/accounts - Listar todas as contas do usuário
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // 'payable' or 'receivable'
    const status = searchParams.get('status'); // 'pending', 'paid', 'overdue'
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = `
      SELECT a.id, a.title, a.description, a.amount, a.due_date, a.paid_date,
             a.type, a.status, a.category, a.payment_method, a.recurring,
             a.recurring_interval, a.created_at, a.updated_at,
             c.name as client_name, c.id as client_id,
             p.name as project_name, p.id as project_id
      FROM accounts a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (LOWER(a.description) LIKE LOWER($${paramIndex}) OR LOWER(a.category) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND a.due_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND a.due_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY a.due_date ASC`;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const stats = {
      total_payable: 0,
      total_receivable: 0,
      pending_payable: 0,
      pending_receivable: 0,
      paid_payable: 0,
      paid_receivable: 0,
      overdue_payable: 0,
      overdue_receivable: 0
    };

    result.rows.forEach((account: any) => {
      const amount = parseFloat(account.amount);
      if (account.type === 'payable') {
        stats.total_payable += amount;
        if (account.status === 'pending') stats.pending_payable += amount;
        if (account.status === 'paid') stats.paid_payable += amount;
        if (account.status === 'overdue') stats.overdue_payable += amount;
      } else {
        stats.total_receivable += amount;
        if (account.status === 'pending') stats.pending_receivable += amount;
        if (account.status === 'paid') stats.paid_receivable += amount;
        if (account.status === 'overdue') stats.overdue_receivable += amount;
      }
    });

    return NextResponse.json({
      success: true,
      accounts: result.rows,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao listar contas:', error);
    return NextResponse.json({ message: 'Erro ao listar contas' }, { status: 500 });
  }
}

// POST /api/accounts - Criar nova conta
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, amount, due_date, paid_date, type,
      status, category, payment_method, recurring, recurring_interval,
      client_id, project_id
    } = body;

    if (!title || !amount || !due_date || !type) {
      return NextResponse.json({
        message: 'Título, valor, data de vencimento e tipo são obrigatórios'
      }, { status: 400 });
    }

    if (!['payable', 'receivable', 'expense', 'income'].includes(type)) {
      return NextResponse.json({
        message: 'Tipo inválido'
      }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO accounts (
        user_id, client_id, project_id, title, description, amount,
        due_date, paid_date, type, status, category,
        payment_method, recurring, recurring_interval
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, title, description, amount, due_date, paid_date, type,
                status, category, payment_method, created_at`,
      [
        payload.userId, client_id || null, project_id || null,
        title, description || null, amount, due_date, paid_date || null,
        type, status || 'pending', category || null,
        payment_method || null, recurring || false, recurring_interval || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      account: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json({ message: 'Erro ao criar conta' }, { status: 500 });
  }
}

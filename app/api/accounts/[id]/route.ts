import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/accounts/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const result = await db.query(
      `SELECT a.*, c.name as client_name, p.name as project_name
       FROM accounts a
       LEFT JOIN clients c ON a.client_id = c.id
       LEFT JOIN projects p ON a.project_id = p.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, account: result.rows[0] });

  } catch (error: any) {
    console.error('Erro ao buscar conta:', error);
    return NextResponse.json({ message: 'Erro ao buscar conta' }, { status: 500 });
  }
}

// PUT /api/accounts/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const checkResult = await db.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });
    }

    const result = await db.query(
      `UPDATE accounts
       SET title = $1, description = $2, amount = $3, due_date = $4, paid_date = $5,
           type = $6, status = $7, category = $8, payment_method = $9,
           recurring = $10, recurring_interval = $11, client_id = $12, project_id = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND user_id = $15
       RETURNING *`,
      [
        title, description || null, amount, due_date, paid_date || null,
        type, status, category || null, payment_method || null,
        recurring || false, recurring_interval || null,
        client_id || null, project_id || null,
        params.id, payload.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Conta atualizada com sucesso!',
      account: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar conta:', error);
    return NextResponse.json({ message: 'Erro ao atualizar conta' }, { status: 500 });
  }
}

// DELETE /api/accounts/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const checkResult = await db.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });
    }

    await db.query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Conta deletada com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json({ message: 'Erro ao deletar conta' }, { status: 500 });
  }
}

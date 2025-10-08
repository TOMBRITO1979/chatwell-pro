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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const payment_method = searchParams.get('payment_method') || '';
    const status = searchParams.get('status') || '';
    const start_date = searchParams.get('start_date') || '';
    const end_date = searchParams.get('end_date') || '';

    let sql = `
      SELECT
        be.*,
        c.name as client_name,
        p.name as project_name
      FROM business_expenses be
      LEFT JOIN clients c ON be.client_id = c.id
      LEFT JOIN projects p ON be.project_id = p.id
      WHERE be.user_id = $1
    `;

    const params: any[] = [payload.userId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      sql += ` AND (
        be.description ILIKE $${paramCount} OR
        be.vendor ILIKE $${paramCount} OR
        be.notes ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      sql += ` AND be.category = $${paramCount}`;
      params.push(category);
    }

    if (payment_method) {
      paramCount++;
      sql += ` AND be.payment_method = $${paramCount}`;
      params.push(payment_method);
    }

    if (status) {
      paramCount++;
      sql += ` AND be.status = $${paramCount}`;
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      sql += ` AND be.expense_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      sql += ` AND be.expense_date <= $${paramCount}`;
      params.push(end_date);
    }

    sql += ' ORDER BY be.expense_date DESC, be.created_at DESC';

    const result = await db.query(sql, params);

    // Calculate statistics
    const stats = {
      total: result.rows.length,
      pending: result.rows.filter((e: any) => e.status === 'pending').length,
      paid: result.rows.filter((e: any) => e.status === 'paid').length,
      total_amount: result.rows.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
      total_pending: result.rows
        .filter((e: any) => e.status === 'pending')
        .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0),
      total_paid: result.rows
        .filter((e: any) => e.status === 'paid')
        .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0)
    };

    return NextResponse.json({
      success: true,
      expenses: result.rows,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar gastos empresariais:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar gastos empresariais' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      description,
      amount,
      expense_date,
      category,
      payment_method,
      vendor,
      receipt_number,
      status,
      client_id,
      project_id,
      notes
    } = body;

    if (!description || !amount || !expense_date || !category) {
      return NextResponse.json(
        { success: false, message: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `INSERT INTO business_expenses (
        user_id,
        description,
        amount,
        expense_date,
        category,
        payment_method,
        vendor,
        receipt_number,
        status,
        client_id,
        project_id,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        payload.userId,
        description,
        amount,
        expense_date,
        category,
        payment_method || 'dinheiro',
        vendor || null,
        receipt_number || null,
        status || 'pending',
        client_id || null,
        project_id || null,
        notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      expense: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar gasto empresarial:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao criar gasto empresarial' },
      { status: 500 }
    );
  }
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await db.query(
      'SELECT * FROM personal_expenses WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Gasto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar gasto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar gasto' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      payment_date,
      notes
    } = body;

    // Auto-set payment_date when status changes to paid
    let finalPaymentDate = payment_date;
    if (status === 'paid' && !payment_date) {
      finalPaymentDate = new Date().toISOString();
    } else if (status !== 'paid') {
      finalPaymentDate = null;
    }

    const result = await db.query(
      `UPDATE personal_expenses SET
        description = $1,
        amount = $2,
        expense_date = $3,
        category = $4,
        payment_method = $5,
        vendor = $6,
        receipt_number = $7,
        status = $8,
        payment_date = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12
      RETURNING *`,
      [
        description,
        amount,
        expense_date,
        category,
        payment_method,
        vendor,
        receipt_number,
        status,
        finalPaymentDate,
        notes,
        params.id,
        payload.userId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Gasto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar gasto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar gasto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await db.query(
      'DELETE FROM personal_expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Gasto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gasto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar gasto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar gasto' },
      { status: 500 }
    );
  }
}

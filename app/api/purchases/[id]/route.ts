import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/purchases/:id
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
      'SELECT * FROM purchases WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Item não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, purchase: result.rows[0] });

  } catch (error: any) {
    console.error('Erro ao buscar item:', error);
    return NextResponse.json({ message: 'Erro ao buscar item' }, { status: 500 });
  }
}

// PUT /api/purchases/:id
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
      item_name, quantity, unit, category, estimated_price,
      purchased, purchase_date, notes
    } = body;

    if (!item_name) {
      return NextResponse.json({
        message: 'Nome do item é obrigatório'
      }, { status: 400 });
    }

    const checkResult = await db.query(
      'SELECT id FROM purchases WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Item não encontrado' }, { status: 404 });
    }

    // Se marcou como comprado, atualizar purchase_date
    let finalPurchaseDate = purchase_date;
    if (purchased && !purchase_date) {
      finalPurchaseDate = new Date().toISOString();
    } else if (!purchased) {
      finalPurchaseDate = null;
    }

    const result = await db.query(
      `UPDATE purchases
       SET item_name = $1, quantity = $2, unit = $3, category = $4,
           estimated_price = $5, purchased = $6, purchase_date = $7, notes = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        item_name, quantity, unit, category, estimated_price,
        purchased, finalPurchaseDate, notes || null,
        params.id, payload.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Item atualizado com sucesso!',
      purchase: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json({ message: 'Erro ao atualizar item' }, { status: 500 });
  }
}

// DELETE /api/purchases/:id
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
      'SELECT id FROM purchases WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Item não encontrado' }, { status: 404 });
    }

    await db.query(
      'DELETE FROM purchases WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Item deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar item:', error);
    return NextResponse.json({ message: 'Erro ao deletar item' }, { status: 500 });
  }
}

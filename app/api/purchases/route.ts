import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/purchases - Listar todos os itens da lista de compras
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
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let query = `
      SELECT id, item_name, quantity, unit, category, estimated_price,
             purchased, purchase_date, notes, created_at, updated_at
      FROM purchases
      WHERE user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (LOWER(item_name) LIKE LOWER($${paramIndex}) OR LOWER(category) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status === 'purchased') {
      query += ` AND purchased = true`;
    } else if (status === 'pending') {
      query += ` AND purchased = false`;
    }

    query += ` ORDER BY purchased ASC, created_at DESC`;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const stats = {
      total: result.rows.length,
      pending: result.rows.filter((i: any) => !i.purchased).length,
      purchased: result.rows.filter((i: any) => i.purchased).length,
      total_estimated: result.rows
        .filter((i: any) => !i.purchased)
        .reduce((sum: number, i: any) => sum + parseFloat(i.estimated_price || 0), 0)
    };

    return NextResponse.json({
      success: true,
      purchases: result.rows,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao listar itens da lista de compras:', error);
    return NextResponse.json({ message: 'Erro ao listar itens' }, { status: 500 });
  }
}

// POST /api/purchases - Criar novo item
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
      item_name, quantity, unit, category, estimated_price,
      purchased, purchase_date, notes
    } = body;

    if (!item_name) {
      return NextResponse.json({
        message: 'Nome do item é obrigatório'
      }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO purchases (
        user_id, item_name, quantity, unit, category, estimated_price,
        purchased, purchase_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, item_name, quantity, unit, category, estimated_price,
                purchased, created_at`,
      [
        payload.userId, item_name, quantity || 1, unit || 'un',
        category || 'outros', estimated_price || 0,
        purchased || false, purchase_date || null, notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Item adicionado com sucesso!',
      purchase: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar item:', error);
    return NextResponse.json({ message: 'Erro ao criar item' }, { status: 500 });
  }
}

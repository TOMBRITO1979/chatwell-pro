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

    const result = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      // Criar configurações padrão se não existirem
      const createResult = await db.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [payload.userId]
      );
      return NextResponse.json({
        success: true,
        settings: createResult.rows[0]
      });
    }

    return NextResponse.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      notifications_email,
      notifications_push,
      notifications_tasks,
      notifications_events,
      notifications_accounts,
      theme,
      language,
      date_format,
      currency
    } = body;

    // Verificar se existem configurações
    const checkResult = await db.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [payload.userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Criar
      result = await db.query(
        `INSERT INTO user_settings (
          user_id, notifications_email, notifications_push, notifications_tasks,
          notifications_events, notifications_accounts, theme, language,
          date_format, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          payload.userId,
          notifications_email,
          notifications_push,
          notifications_tasks,
          notifications_events,
          notifications_accounts,
          theme,
          language,
          date_format,
          currency
        ]
      );
    } else {
      // Atualizar
      result = await db.query(
        `UPDATE user_settings SET
          notifications_email = $1,
          notifications_push = $2,
          notifications_tasks = $3,
          notifications_events = $4,
          notifications_accounts = $5,
          theme = $6,
          language = $7,
          date_format = $8,
          currency = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $10
        RETURNING *`,
        [
          notifications_email,
          notifications_push,
          notifications_tasks,
          notifications_events,
          notifications_accounts,
          theme,
          language,
          date_format,
          currency,
          payload.userId
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

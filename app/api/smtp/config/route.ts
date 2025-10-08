import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/smtp/config - Obter configurações SMTP do usuário
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

    const result = await db.query(
      `SELECT id, host, port, secure, username, from_email, from_name, is_active, created_at, updated_at
       FROM smtp_settings WHERE user_id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        settings: null,
        message: 'Nenhuma configuração SMTP encontrada'
      });
    }

    return NextResponse.json({
      success: true,
      settings: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao buscar configurações SMTP:', error);
    return NextResponse.json({ message: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

// PUT /api/smtp/config - Criar ou atualizar configurações SMTP
export async function PUT(request: NextRequest) {
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
    const { host, port, secure, username, password, from_email, from_name, is_active } = body;

    // Validação
    if (!host || !port || !username || !password || !from_email) {
      return NextResponse.json({
        message: 'Host, porta, usuário, senha e email de origem são obrigatórios'
      }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from_email)) {
      return NextResponse.json({
        message: 'Email de origem inválido'
      }, { status: 400 });
    }

    // Verificar se já existe configuração
    const checkResult = await db.query(
      'SELECT id FROM smtp_settings WHERE user_id = $1',
      [payload.userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Inserir nova configuração
      result = await db.query(
        `INSERT INTO smtp_settings (user_id, host, port, secure, username, password, from_email, from_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, host, port, secure, username, from_email, from_name, is_active, created_at`,
        [payload.userId, host, port, secure || true, username, password, from_email, from_name || null, is_active || false]
      );
    } else {
      // Atualizar configuração existente
      result = await db.query(
        `UPDATE smtp_settings
         SET host = $1, port = $2, secure = $3, username = $4, password = $5,
             from_email = $6, from_name = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $9
         RETURNING id, host, port, secure, username, from_email, from_name, is_active, updated_at`,
        [host, port, secure || true, username, password, from_email, from_name || null, is_active || false, payload.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações SMTP salvas com sucesso!',
      settings: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao salvar configurações SMTP:', error);
    return NextResponse.json({ message: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

// DELETE /api/smtp/config - Deletar configurações SMTP
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    await db.query(
      'DELETE FROM smtp_settings WHERE user_id = $1',
      [payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Configurações SMTP deletadas com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar configurações SMTP:', error);
    return NextResponse.json({ message: 'Erro ao deletar configurações' }, { status: 500 });
  }
}

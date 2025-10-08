import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/waha/config - Obter configurações WAHA do usuário
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
      `SELECT id, api_url, api_key, session_name, webhook_url, is_active, status, qr_code, last_sync, created_at, updated_at
       FROM waha_settings WHERE user_id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        settings: null,
        message: 'Nenhuma configuração WAHA encontrada'
      });
    }

    return NextResponse.json({
      success: true,
      settings: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao buscar configurações WAHA:', error);
    return NextResponse.json({ message: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

// PUT /api/waha/config - Criar ou atualizar configurações WAHA
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
    const { api_url, api_key, session_name, webhook_url, is_active } = body;

    // Validação
    if (!api_url || !session_name) {
      return NextResponse.json({
        message: 'URL da API e nome da sessão são obrigatórios'
      }, { status: 400 });
    }

    // Validar URL
    try {
      new URL(api_url);
    } catch (e) {
      return NextResponse.json({
        message: 'URL da API inválida'
      }, { status: 400 });
    }

    // Verificar se já existe configuração
    const checkResult = await db.query(
      'SELECT id FROM waha_settings WHERE user_id = $1',
      [payload.userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Inserir nova configuração
      result = await db.query(
        `INSERT INTO waha_settings (user_id, api_url, api_key, session_name, webhook_url, is_active, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'disconnected')
         RETURNING id, api_url, api_key, session_name, webhook_url, is_active, status, created_at`,
        [payload.userId, api_url, api_key || null, session_name, webhook_url || null, is_active || false]
      );
    } else {
      // Atualizar configuração existente
      result = await db.query(
        `UPDATE waha_settings
         SET api_url = $1, api_key = $2, session_name = $3, webhook_url = $4,
             is_active = $5, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6
         RETURNING id, api_url, api_key, session_name, webhook_url, is_active, status, updated_at`,
        [api_url, api_key || null, session_name, webhook_url || null, is_active || false, payload.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações WAHA salvas com sucesso!',
      settings: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao salvar configurações WAHA:', error);
    return NextResponse.json({ message: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

// DELETE /api/waha/config - Deletar configurações WAHA
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
      'DELETE FROM waha_settings WHERE user_id = $1',
      [payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Configurações WAHA deletadas com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar configurações WAHA:', error);
    return NextResponse.json({ message: 'Erro ao deletar configurações' }, { status: 500 });
  }
}

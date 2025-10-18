import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import crypto from 'crypto';

/**
 * GET /api/user/api-key
 *
 * Retorna a API Key do usuário autenticado
 */
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
      'SELECT api_key FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const apiKey = result.rows[0].api_key;

    return NextResponse.json({
      success: true,
      api_key: apiKey,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatwell.pro'}/api/webhooks/voice-commands`,
      instructions: {
        header: 'X-API-Key',
        value: apiKey,
        example_curl: `curl -X POST \\
  ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatwell.pro'}/api/webhooks/voice-commands \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "transcription": "Agendar reunião com cliente amanhã às 15 horas",
    "type": "auto",
    "source": "telegram"
  }'`
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar API Key:', error);
    return NextResponse.json({ message: 'Erro ao buscar API Key' }, { status: 500 });
  }
}

/**
 * POST /api/user/api-key
 *
 * Gera uma nova API Key para o usuário autenticado
 * (invalida a anterior)
 */
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

    // Gerar nova API Key
    const newApiKey = crypto.randomBytes(32).toString('hex');

    // Atualizar no banco
    const result = await db.query(
      'UPDATE users SET api_key = $1, updated_at = NOW() WHERE id = $2 RETURNING api_key',
      [newApiKey, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Nova API Key gerada com sucesso! A chave anterior foi invalidada.',
      api_key: result.rows[0].api_key,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatwell.pro'}/api/webhooks/voice-commands`,
      warning: '⚠️ Guarde esta chave em local seguro. Ela não será exibida novamente.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao gerar API Key:', error);
    return NextResponse.json({ message: 'Erro ao gerar API Key' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/api-key
 *
 * Revoga/remove a API Key do usuário
 */
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
      'UPDATE users SET api_key = NULL, updated_at = NOW() WHERE id = $1',
      [payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'API Key revogada com sucesso. Comandos de voz não funcionarão mais até gerar nova chave.'
    });

  } catch (error: any) {
    console.error('Erro ao revogar API Key:', error);
    return NextResponse.json({ message: 'Erro ao revogar API Key' }, { status: 500 });
  }
}

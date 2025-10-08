import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { createWAHAClient } from '@/lib/waha/client';

// GET /api/waha/qr - Obter QR Code para autenticação
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

    // Buscar configurações
    const configResult = await db.query(
      'SELECT api_url, api_key, session_name, qr_code FROM waha_settings WHERE user_id = $1',
      [payload.userId]
    );

    if (configResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Configuração WAHA não encontrada'
      }, { status: 404 });
    }

    const config = configResult.rows[0];
    const client = createWAHAClient(config.api_url, config.session_name, config.api_key);

    try {
      const qrCode = await client.getQRCode();

      // Salvar QR Code no banco
      await db.query(
        'UPDATE waha_settings SET qr_code = $1, last_sync = CURRENT_TIMESTAMP WHERE user_id = $2',
        [qrCode, payload.userId]
      );

      return NextResponse.json({
        success: true,
        qr_code: qrCode
      });
    } catch (error: any) {
      // Se já estiver conectado ou não houver QR disponível
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          message: 'QR Code não disponível. A sessão pode já estar conectada ou não foi iniciada.',
          status: 'connected_or_not_started'
        }, { status: 404 });
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Erro ao obter QR Code:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao obter QR Code'
    }, { status: 500 });
  }
}

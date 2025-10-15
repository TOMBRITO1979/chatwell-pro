import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySuperAdminToken, extractTokenFromHeader } from '@/lib/superAdminAuth';

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação de super admin
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const adminPayload = verifySuperAdminToken(token);

    if (!adminPayload) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Busca todos os usuários
    const result = await db.query(
      `SELECT
        id,
        name,
        email,
        phone,
        company_name,
        is_active,
        email_verified,
        created_at,
        updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { message: 'Erro ao listar usuários. Tente novamente.' },
      { status: 500 }
    );
  }
}

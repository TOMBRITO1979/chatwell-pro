import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySuperAdminToken, extractTokenFromHeader } from '@/lib/superAdminAuth';

// PATCH - Atualizar status de usuário (ativar/desativar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const body = await request.json();
    const { is_active } = body;

    // Validação
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { message: 'is_active deve ser um valor booleano' },
        { status: 400 }
      );
    }

    // Verifica se o usuário existe
    const userCheck = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualiza o status do usuário
    const result = await db.query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, is_active`,
      [is_active, userId]
    );

    return NextResponse.json({
      success: true,
      message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`,
      user: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}

// GET - Obter detalhes de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Busca usuário e estatísticas
    const userResult = await db.query(
      `SELECT
        id,
        name,
        email,
        phone,
        company_name,
        avatar_url,
        is_active,
        email_verified,
        created_at,
        updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Busca estatísticas do usuário
    const statsResult = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM clients WHERE user_id = $1) as total_clients,
        (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM events WHERE user_id = $1) as total_events
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      user: userResult.rows[0],
      stats: statsResult.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySuperAdminToken, extractTokenFromHeader } from '@/lib/superAdminAuth';

// GET - Obter estatísticas gerais do sistema
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

    // Busca estatísticas gerais
    const statsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM users WHERE is_active = false) as inactive_users,
        (SELECT COUNT(*) FROM users WHERE email_verified = true) as verified_users,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM accounts) as total_accounts
    `);

    // Busca usuários criados nos últimos 7 dias
    const recentUsersResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Busca últimos 5 usuários criados
    const latestUsersResult = await db.query(`
      SELECT id, name, email, phone, company_name, is_active, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      stats: statsResult.rows[0],
      recentUsers: recentUsersResult.rows,
      latestUsers: latestUsersResult.rows
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar estatísticas. Tente novamente.' },
      { status: 500 }
    );
  }
}

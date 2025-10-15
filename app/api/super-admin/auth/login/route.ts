import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { generateSuperAdminToken } from '@/lib/superAdminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validação
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca super admin por username
    const result = await db.query(
      `SELECT id, username, email, password_hash, name, is_active, last_login
       FROM super_admins
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    // Verifica se o super admin está ativo
    if (!admin.is_active) {
      return NextResponse.json(
        { message: 'Conta de administrador desativada.' },
        { status: 403 }
      );
    }

    // Verifica a senha
    const isPasswordValid = await verifyPassword(password, admin.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    // Gera JWT token para super admin
    const token = generateSuperAdminToken({
      adminId: admin.id,
      username: admin.username,
      email: admin.email
    });

    // Atualiza último login
    await db.query(
      'UPDATE super_admins SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Login de super admin realizado com sucesso!',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error: any) {
    console.error('Erro no login do super admin:', error);
    return NextResponse.json(
      { message: 'Erro ao realizar login. Tente novamente.' },
      { status: 500 }
    );
  }
}

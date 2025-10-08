import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validação
    if (!email || !password) {
      return NextResponse.json(
        { message: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca usuário por email
    const result = await db.query(
      `SELECT id, name, email, password_hash, phone, company_name, avatar_url, is_active
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verifica se o usuário está ativo
    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Conta desativada. Entre em contato com o suporte.' },
        { status: 403 }
      );
    }

    // Verifica a senha
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    // Gera JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // Atualiza último login (opcional)
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name,
        avatar_url: user.avatar_url
      }
    });

  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: 'Erro ao realizar login. Tente novamente.' },
      { status: 500 }
    );
  }
}
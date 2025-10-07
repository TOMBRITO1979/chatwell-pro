import { NextRequest, NextResponse } from 'next/server';
import { validateLogin, generateAccessToken, generateRefreshToken, saveRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await validateLogin({ email, password });

    if (!user) {
      return NextResponse.json(
        { message: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    await saveRefreshToken(user.id, refreshToken);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountId: user.account_id
      },
      accessToken,
      refreshToken
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
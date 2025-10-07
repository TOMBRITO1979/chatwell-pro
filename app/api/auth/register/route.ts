import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail, generateEmailVerificationCode } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, e-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Usuário já existe com este e-mail' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      name,
      email,
      phone,
      password
    });

    // Generate verification code
    const verificationCode = generateEmailVerificationCode();

    // TODO: Send verification email
    // For now, we'll just log it
    console.log(`Verification code for ${email}: ${verificationCode}`);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountId: user.account_id
      },
      message: 'Usuário criado com sucesso. Verifique seu e-mail para ativar a conta.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
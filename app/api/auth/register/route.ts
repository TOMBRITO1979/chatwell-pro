import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, company_name } = body;

    // Validação
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, e-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'E-mail inválido' },
        { status: 400 }
      );
    }

    // Validação de senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verifica se usuário já existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'Este e-mail já está cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha
    const password_hash = await hashPassword(password);

    // Gera token de verificação de email
    const emailVerificationToken = generateVerificationToken();

    // Cria usuário
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, company_name, email_verification_token, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, name, email, phone, company_name, created_at`,
      [name, email, password_hash, phone || null, company_name || null, emailVerificationToken]
    );

    const user = result.rows[0];

    // Gera JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // TODO: Enviar email de verificação
    console.log(`Token de verificação para ${email}: ${emailVerificationToken}`);

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro ao criar usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}
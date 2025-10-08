import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/clients/:id - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      `SELECT id, name, email, phone, whatsapp, cpf_cnpj, 
              address, city, state, zip_code, notes, status, 
              created_at, updated_at
       FROM clients
       WHERE id = $1 AND user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ message: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

// PUT /api/clients/:id - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, whatsapp, cpf_cnpj, address, city, state, zip_code, notes, status } = body;

    // Validação
    if (!name) {
      return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 });
    }

    // Validar email se fornecido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ message: 'Email inválido' }, { status: 400 });
      }
    }

    // Verificar se cliente existe e pertence ao usuário
    const checkResult = await db.query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    // Atualizar cliente
    const result = await db.query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, whatsapp = $4, cpf_cnpj = $5,
           address = $6, city = $7, state = $8, zip_code = $9, notes = $10, status = $11
       WHERE id = $12 AND user_id = $13
       RETURNING id, name, email, phone, whatsapp, cpf_cnpj, address, city, 
                 state, zip_code, notes, status, updated_at`,
      [name, email || null, phone || null, whatsapp || null, cpf_cnpj || null,
       address || null, city || null, state || null, zip_code || null, 
       notes || null, status || 'active', params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Cliente atualizado com sucesso!',
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ message: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/clients/:id - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Verificar se cliente existe e pertence ao usuário
    const checkResult = await db.query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    // Deletar cliente
    await db.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Cliente deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json({ message: 'Erro ao deletar cliente' }, { status: 500 });
  }
}

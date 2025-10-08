import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/clients - Listar todos os clientes do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Parâmetros de busca e filtro
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query base
    let query = `
      SELECT id, name, email, phone, whatsapp, cpf_cnpj, 
             address, city, state, zip_code, notes, status, 
             created_at, updated_at
      FROM clients
      WHERE user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    // Filtro de busca
    if (search) {
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramIndex}) OR
        LOWER(email) LIKE LOWER($${paramIndex}) OR
        LOWER(phone) LIKE LOWER($${paramIndex}) OR
        LOWER(cpf_cnpj) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de status
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Ordenação e paginação
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM clients WHERE user_id = $1';
    const countParams: any[] = [payload.userId];
    
    if (search) {
      countQuery += ` AND (
        LOWER(name) LIKE LOWER($2) OR
        LOWER(email) LIKE LOWER($2) OR
        LOWER(phone) LIKE LOWER($2) OR
        LOWER(cpf_cnpj) LIKE LOWER($2)
      )`;
      countParams.push(`%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      success: true,
      clients: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json(
      { message: 'Erro ao listar clientes' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
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

    // Inserir cliente
    const result = await db.query(
      `INSERT INTO clients (user_id, name, email, phone, whatsapp, cpf_cnpj, 
                            address, city, state, zip_code, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, email, phone, whatsapp, cpf_cnpj, address, city, 
                 state, zip_code, notes, status, created_at`,
      [payload.userId, name, email || null, phone || null, whatsapp || null, 
       cpf_cnpj || null, address || null, city || null, state || null, 
       zip_code || null, notes || null, status || 'active']
    );

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso!',
      client: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { message: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/projects - Listar todos os projetos do usuário
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');

    let query = `
      SELECT p.id, p.name, p.description, p.start_date, p.end_date,
             p.budget, p.status, p.priority, p.color, p.progress,
             p.created_at, p.updated_at,
             c.name as client_name, c.id as client_id
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (clientId) {
      query += ` AND p.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const stats = {
      total: result.rows.length,
      active: result.rows.filter((p: any) => p.status === 'active').length,
      completed: result.rows.filter((p: any) => p.status === 'completed').length,
      on_hold: result.rows.filter((p: any) => p.status === 'on_hold').length,
      cancelled: result.rows.filter((p: any) => p.status === 'cancelled').length,
      total_budget: result.rows.reduce((sum: number, p: any) => sum + parseFloat(p.budget || 0), 0)
    };

    return NextResponse.json({
      success: true,
      projects: result.rows,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao listar projetos:', error);
    return NextResponse.json({ message: 'Erro ao listar projetos' }, { status: 500 });
  }
}

// POST /api/projects - Criar novo projeto
export async function POST(request: NextRequest) {
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
    const {
      name, description, start_date, end_date, budget,
      status, priority, color, progress, client_id
    } = body;

    if (!name) {
      return NextResponse.json({
        message: 'Nome do projeto é obrigatório'
      }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO projects (
        user_id, client_id, name, description, start_date, end_date,
        budget, status, priority, color, progress
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, description, start_date, end_date, budget,
                status, priority, color, progress, created_at`,
      [
        payload.userId, client_id || null, name, description || null,
        start_date || null, end_date || null, budget || 0,
        status || 'planning', priority || 'medium', color || '#3B82F6',
        progress || 0
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Projeto criado com sucesso!',
      project: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar projeto:', error);
    return NextResponse.json({ message: 'Erro ao criar projeto' }, { status: 500 });
  }
}

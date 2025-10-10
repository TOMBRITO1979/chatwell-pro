import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/projects/:id
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
      `SELECT p.*, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: result.rows[0] });

  } catch (error: any) {
    console.error('Erro ao buscar projeto:', error);
    return NextResponse.json({ message: 'Erro ao buscar projeto' }, { status: 500 });
  }
}

// PUT /api/projects/:id
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
    const {
      name, description, start_date, end_date, budget,
      status, priority, progress, color, client_id,
      service_type, image_url
    } = body;

    if (!name) {
      return NextResponse.json({
        message: 'Nome do projeto é obrigatório'
      }, { status: 400 });
    }

    const checkResult = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Projeto não encontrado' }, { status: 404 });
    }

    const result = await db.query(
      `UPDATE projects
       SET name = $1, description = $2, start_date = $3, end_date = $4,
           budget = $5, status = $6, priority = $7, progress = $8,
           color = $9, client_id = $10, service_type = $11, image_url = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        name, description || null, start_date || null, end_date || null,
        budget || 0, status, priority, progress || 0,
        color || '#3B82F6', client_id || null, service_type, image_url || null,
        params.id, payload.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
      project: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar projeto:', error);
    return NextResponse.json({ message: 'Erro ao atualizar projeto' }, { status: 500 });
  }
}

// DELETE /api/projects/:id
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

    const checkResult = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Projeto não encontrado' }, { status: 404 });
    }

    await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Projeto deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar projeto:', error);
    return NextResponse.json({ message: 'Erro ao deletar projeto' }, { status: 500 });
  }
}

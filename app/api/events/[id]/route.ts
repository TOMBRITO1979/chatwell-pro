import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/events/:id
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
      `SELECT e.*, c.name as client_name, p.name as project_name
       FROM events e
       LEFT JOIN clients c ON e.client_id = c.id
       LEFT JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event: result.rows[0] });

  } catch (error: any) {
    console.error('Erro ao buscar evento:', error);
    return NextResponse.json({ message: 'Erro ao buscar evento' }, { status: 500 });
  }
}

// PUT /api/events/:id
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
      title, description, start_time, end_time, location,
      event_type, color, is_all_day, reminder_minutes,
      client_id, project_id
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json({
        message: 'Título, data/hora de início e fim são obrigatórios'
      }, { status: 400 });
    }

    const checkResult = await db.query(
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    const result = await db.query(
      `UPDATE events
       SET title = $1, description = $2, start_time = $3, end_time = $4,
           location = $5, event_type = $6, color = $7, is_all_day = $8,
           reminder_minutes = $9, client_id = $10, project_id = $11
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
        title, description, start_time, end_time, location,
        event_type, color, is_all_day, reminder_minutes,
        client_id || null, project_id || null, params.id, payload.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Evento atualizado com sucesso!',
      event: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ message: 'Erro ao atualizar evento' }, { status: 500 });
  }
}

// DELETE /api/events/:id
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
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    await db.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Evento deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar evento:', error);
    return NextResponse.json({ message: 'Erro ao deletar evento' }, { status: 500 });
  }
}

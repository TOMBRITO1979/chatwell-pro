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

    // Check if phone/email columns exist
    let hasContactFields = true;
    try {
      await db.query(`SELECT phone, email FROM events LIMIT 0`);
    } catch {
      hasContactFields = false;
    }

    const selectFields = hasContactFields
      ? `e.*, c.name as client_name, p.name as project_name`
      : `e.id, e.user_id, e.client_id, e.project_id, e.title, e.description,
         e.start_time, e.end_time, e.location, e.event_type, e.color,
         e.is_all_day, e.reminder_minutes, e.created_at, e.updated_at,
         c.name as client_name, p.name as project_name`;

    const result = await db.query(
      `SELECT ${selectFields}
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
      client_id, project_id, phone, email
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json({
        message: 'Título, data/hora de início e fim são obrigatórios'
      }, { status: 400 });
    }

    const checkResult = await db.query(
      'SELECT id, meeting_url FROM events WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    // Gerar link do Jitsi Meet se tipo for "online" e ainda não tiver link
    let meeting_url = checkResult.rows[0].meeting_url;
    if (event_type === 'online' && !meeting_url) {
      const roomId = `chatwell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      meeting_url = `https://meet.jit.si/${roomId}`;
    } else if (event_type !== 'online') {
      // Se mudou de online para outro tipo, remove o link
      meeting_url = null;
    }

    // Try to update with phone/email/meeting_url, fallback to without if columns don't exist
    let result;
    try {
      result = await db.query(
        `UPDATE events
         SET title = $1, description = $2, start_time = $3, end_time = $4,
             location = $5, event_type = $6, color = $7, is_all_day = $8,
             reminder_minutes = $9, client_id = $10, project_id = $11, phone = $12, email = $13,
             meeting_url = $14, updated_at = NOW()
         WHERE id = $15 AND user_id = $16
         RETURNING *`,
        [
          title, description, start_time, end_time, location,
          event_type, color, is_all_day, reminder_minutes,
          client_id || null, project_id || null, phone || null, email || null, meeting_url,
          params.id, payload.userId
        ]
      );
    } catch (dbError: any) {
      // If phone/email/meeting_url columns don't exist, update without them
      if (dbError.message && dbError.message.includes('column')) {
        result = await db.query(
          `UPDATE events
           SET title = $1, description = $2, start_time = $3, end_time = $4,
               location = $5, event_type = $6, color = $7, is_all_day = $8,
               reminder_minutes = $9, client_id = $10, project_id = $11,
               updated_at = NOW()
           WHERE id = $12 AND user_id = $13
           RETURNING *`,
          [
            title, description, start_time, end_time, location,
            event_type, color, is_all_day, reminder_minutes,
            client_id || null, project_id || null,
            params.id, payload.userId
          ]
        );
      } else {
        throw dbError;
      }
    }

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

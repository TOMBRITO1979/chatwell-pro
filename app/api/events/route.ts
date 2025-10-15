import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/events - Listar todos os eventos do usuário
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const eventType = searchParams.get('event_type');

    // Check if phone/email columns exist
    let hasContactFields = true;
    try {
      await db.query(`SELECT phone, email FROM events LIMIT 0`);
    } catch {
      hasContactFields = false;
    }

    // Check if meeting_url column exists
    let hasMeetingUrl = true;
    try {
      await db.query(`SELECT meeting_url FROM events LIMIT 0`);
    } catch {
      hasMeetingUrl = false;
    }

    let query = hasContactFields
      ? (hasMeetingUrl
        ? `
      SELECT e.id, e.title, e.description, e.start_time, e.end_time,
             e.location, e.event_type, e.color, e.is_all_day, e.reminder_minutes,
             e.phone, e.email, e.meeting_url,
             e.created_at, e.updated_at,
             c.name as client_name, c.id as client_id,
             p.name as project_name, p.id as project_id
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `
        : `
      SELECT e.id, e.title, e.description, e.start_time, e.end_time,
             e.location, e.event_type, e.color, e.is_all_day, e.reminder_minutes,
             e.phone, e.email,
             e.created_at, e.updated_at,
             c.name as client_name, c.id as client_id,
             p.name as project_name, p.id as project_id
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `)
      : `
      SELECT e.id, e.title, e.description, e.start_time, e.end_time,
             e.location, e.event_type, e.color, e.is_all_day, e.reminder_minutes,
             e.created_at, e.updated_at,
             c.name as client_name, c.id as client_id,
             p.name as project_name, p.id as project_id
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND e.start_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.start_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (eventType) {
      query += ` AND e.event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    query += ` ORDER BY e.start_time ASC`;

    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      events: result.rows
    });

  } catch (error: any) {
    console.error('Erro ao listar eventos:', error);
    return NextResponse.json({ message: 'Erro ao listar eventos' }, { status: 500 });
  }
}

// POST /api/events - Criar novo evento
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
      title, description, start_time, end_time, location,
      event_type, color, is_all_day, reminder_minutes,
      client_id, project_id, phone, email
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json({
        message: 'Título, data/hora de início e fim são obrigatórios'
      }, { status: 400 });
    }

    // Gerar link do Jitsi Meet automaticamente se o tipo for "online"
    let meeting_url = null;
    if (event_type === 'online') {
      // Gera um ID único e seguro para a sala
      const roomId = `chatwell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      meeting_url = `https://meet.jit.si/${roomId}`;
    }

    // Try to insert with phone/email/meeting_url, fallback to without if columns don't exist
    let result;
    try {
      result = await db.query(
        `INSERT INTO events (
          user_id, client_id, project_id, title, description,
          start_time, end_time, location, event_type, color,
          is_all_day, reminder_minutes, phone, email, meeting_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, title, description, start_time, end_time, location,
                  event_type, color, is_all_day, reminder_minutes, phone, email, meeting_url, created_at`,
        [
          payload.userId, client_id || null, project_id || null,
          title, description || null, start_time, end_time,
          location || null, event_type || 'meeting', color || '#3B82F6',
          is_all_day || false, reminder_minutes || 30, phone || null, email || null, meeting_url
        ]
      );
    } catch (dbError: any) {
      // If phone/email/meeting_url columns don't exist, insert without them
      if (dbError.message && dbError.message.includes('column')) {
        result = await db.query(
          `INSERT INTO events (
            user_id, client_id, project_id, title, description,
            start_time, end_time, location, event_type, color,
            is_all_day, reminder_minutes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, title, description, start_time, end_time, location,
                    event_type, color, is_all_day, reminder_minutes, created_at`,
          [
            payload.userId, client_id || null, project_id || null,
            title, description || null, start_time, end_time,
            location || null, event_type || 'meeting', color || '#3B82F6',
            is_all_day || false, reminder_minutes || 30
          ]
        );
      } else {
        throw dbError;
      }
    }

    // Enviar notificações de confirmação de forma ASSÍNCRONA (não bloqueia resposta)
    if (phone || email) {
      // Fire and forget - não usa await para não bloquear a resposta
      const { sendEventConfirmation } = await import('@/lib/notifications');
      sendEventConfirmation(payload.userId, {
        title,
        start_time,
        end_time,
        location,
        phone: phone || undefined,
        email: email || undefined,
        meeting_url: meeting_url || undefined
      }).catch(error => {
        console.error('Erro ao enviar notificação de confirmação:', error);
      });
    }

    // Agendar lembretes de forma ASSÍNCRONA (não bloqueia resposta)
    const eventData = {
      eventId: result.rows[0].id,
      userId: payload.userId,
      eventTitle: title,
      eventStartTime: start_time,
      eventEndTime: end_time,
      eventLocation: location,
      meetingUrl: meeting_url,
      phone: phone || undefined,
      email: email || undefined
    };

    // Importa e agenda lembretes
    import('@/lib/queue/reminder-queue').then(({ reminderQueue }) => {
      const eventStartTime = new Date(start_time);

      // Agenda lembrete diário (24h antes)
      reminderQueue.scheduleDailyReminder(eventData, eventStartTime)
        .catch(error => {
          console.error('Erro ao agendar lembrete diário:', error);
        });

      // Agenda lembrete customizado (baseado em reminder_minutes)
      if (reminder_minutes && reminder_minutes > 0) {
        reminderQueue.scheduleCustomReminder(eventData, eventStartTime, reminder_minutes)
          .catch(error => {
            console.error('Erro ao agendar lembrete customizado:', error);
          });
      }
    }).catch(error => {
      console.error('Erro ao importar fila de lembretes:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Evento criado com sucesso!',
      event: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ message: 'Erro ao criar evento' }, { status: 500 });
  }
}

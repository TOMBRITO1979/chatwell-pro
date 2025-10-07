import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if WAHA_API_KEY is provided
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.WAHA_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, data, timestamp } = body;

    console.log('WAHA Webhook received:', { event, timestamp });

    // Store webhook data for processing
    await query(
      `INSERT INTO notifications_outbox (account_id, topic, payload_json, status)
       VALUES ($1, $2, $3, $4)`,
      ['system', 'waha_webhook', JSON.stringify(body), 'pending']
    );

    // Process different webhook events
    switch (event) {
      case 'message':
        await handleIncomingMessage(data);
        break;
      case 'session.status':
        await handleSessionStatus(data);
        break;
      case 'qr':
        await handleQRCode(data);
        break;
      default:
        console.log('Unknown WAHA webhook event:', event);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('WAHA webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(data: any) {
  // Process incoming WhatsApp messages
  console.log('Processing incoming message:', data);

  // You can add logic here to:
  // - Update customer records
  // - Create notifications
  // - Trigger automated responses
}

async function handleSessionStatus(data: any) {
  // Handle WhatsApp session status changes
  console.log('Processing session status:', data);

  // Update connection status in database
  if (data.sessionId) {
    await query(
      `UPDATE waha_connections
       SET status = $1, session_id = $2
       WHERE session_id = $3 OR session_id IS NULL`,
      [data.status, data.sessionId, data.sessionId]
    );
  }
}

async function handleQRCode(data: any) {
  // Handle QR code for WhatsApp authentication
  console.log('Processing QR code:', data);

  // Store QR code for user authentication
  // This would typically be sent to the frontend via WebSocket or stored for polling
}
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    const dbResult = await query('SELECT 1 as healthy');
    const dbHealthy = dbResult.rows.length > 0;

    // Check Redis if available
    let redisHealthy = true;
    try {
      // Redis check would go here if Redis client is configured
      // await redis.ping();
    } catch (error) {
      redisHealthy = false;
    }

    const serviceType = process.env.SERVICE_TYPE || 'app';
    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: serviceType,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        service: process.env.SERVICE_TYPE || 'app',
      },
      { status: 503 }
    );
  }
}
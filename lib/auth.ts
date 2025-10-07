import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: user.account_id
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      accountId: user.account_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function createUser(data: RegisterData): Promise<User> {
  const hashedPassword = await hashPassword(data.password);

  // First create an account for the user
  const accountResult = await query(
    'INSERT INTO accounts (name) VALUES ($1) RETURNING id',
    [`Conta de ${data.name}`]
  );

  const accountId = accountResult.rows[0].id;

  // Then create the user
  const userResult = await query(
    `INSERT INTO users (account_id, name, email, phone, password_digest, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, account_id, name, email, phone, role, created_at`,
    [accountId, data.name, data.email, data.phone, hashedPassword, 'owner']
  );

  return userResult.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT id, account_id, name, email, phone, role, email_verified_at, created_at FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

export async function findUserByEmailWithPassword(email: string): Promise<User & { password_digest: string } | null> {
  const result = await query(
    'SELECT id, account_id, name, email, phone, role, email_verified_at, created_at, password_digest FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

export async function validateLogin(credentials: LoginCredentials): Promise<User | null> {
  const user = await findUserByEmailWithPassword(credentials.email);

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(credentials.password, user.password_digest);

  if (!isValidPassword) {
    return null;
  }

  // Return user without password
  const { password_digest, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const hashedToken = await hashPassword(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await query(
    'INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashedToken, expiresAt]
  );
}

export async function markEmailAsVerified(userId: string): Promise<void> {
  await query(
    'UPDATE users SET email_verified_at = NOW() WHERE id = $1',
    [userId]
  );
}

export function generateEmailVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generatePasswordResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
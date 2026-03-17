import * as crypto from 'node:crypto';
import { db } from './client';

/**
 * Hash a password using Django's PBKDF2-SHA256 format.
 * Produces a string that Django's `check_password` will accept.
 */
function hashDjangoPassword(password: string): string {
  const iterations = 720000; // Django 4.2 default
  const salt = crypto
    .randomBytes(12)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, 22);
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64')}`;
}

export async function createSuperuser(
  username: string,
  password: string,
): Promise<{ userId: number; username: string }> {
  const passwordHash = hashDjangoPassword(password);
  const result = await db.query(
    `INSERT INTO mathesar_user
      (password, is_superuser, is_staff, is_active, username, date_joined,
       password_change_needed, display_language)
     VALUES ($1, true, true, true, $2, NOW(), false, 'en')
     ON CONFLICT (username) DO NOTHING
     RETURNING id, username`,
    [passwordHash, username],
  );
  if (result.rows.length === 0) {
    const existing = await db.query(
      'SELECT id, username FROM mathesar_user WHERE username = $1',
      [username],
    );
    return {
      userId: existing.rows[0].id,
      username: existing.rows[0].username,
    };
  }
  return { userId: result.rows[0].id, username: result.rows[0].username };
}

/**
 * Log in via HTTP to get a valid Django session cookie.
 * Returns session ID and CSRF token for use in browser cookies.
 */
export async function loginViaHttp(
  baseUrl: string,
  username: string,
  password: string,
): Promise<{ sessionId: string; csrfToken: string }> {
  // GET login page to obtain CSRF token
  const loginPageRes = await fetch(`${baseUrl}/auth/login/`, {
    redirect: 'manual',
  });
  const pageCookies = getSetCookies(loginPageRes);
  const csrfToken = extractCookieValue(pageCookies, 'csrftoken');
  if (!csrfToken) {
    throw new Error('Failed to get CSRF token from login page');
  }

  // POST login credentials
  const body = new URLSearchParams({
    username,
    password,
    csrfmiddlewaretoken: csrfToken,
  });
  const loginRes = await fetch(`${baseUrl}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `csrftoken=${csrfToken}`,
    },
    body: body.toString(),
    redirect: 'manual',
  });

  const loginCookies = getSetCookies(loginRes);
  const sessionId = extractCookieValue(loginCookies, 'sessionid');
  if (!sessionId) {
    throw new Error(
      `Login failed for user '${username}'. Status: ${loginRes.status}`,
    );
  }

  // Get updated CSRF token (Django rotates it on login)
  const newCsrf =
    extractCookieValue(loginCookies, 'csrftoken') || csrfToken;

  return { sessionId, csrfToken: newCsrf };
}

function getSetCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

function extractCookieValue(
  cookies: string[],
  name: string,
): string | undefined {
  for (const cookie of cookies) {
    const match = cookie.match(new RegExp(`${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

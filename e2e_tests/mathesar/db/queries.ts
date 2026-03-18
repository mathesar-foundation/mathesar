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

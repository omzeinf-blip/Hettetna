import { DataError, anonKey, authHeaders, supabaseUrl } from "@/lib/supabase/rest";

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
};

async function authFetch(path: string, init: RequestInit, token?: string): Promise<Response> {
  const key = anonKey();
  try {
    return await fetch(`${supabaseUrl()}/auth/v1/${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...authHeaders(key, token),
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    throw new DataError("network_error", 503, String(error));
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const response = await authFetch("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new DataError("invalid_credentials", response.status);
  return (await response.json()) as AuthSession;
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const response = await authFetch("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) throw new DataError("refresh_failed", response.status);
  return (await response.json()) as AuthSession;
}

/** Server-side verification of an access token (signature + revocation checked by Supabase Auth). */
export async function getUser(token: string): Promise<{ id: string; email?: string }> {
  const response = await authFetch("user", { method: "GET" }, token);
  if (!response.ok) throw new DataError("invalid_token", response.status);
  const user = (await response.json()) as { id?: string; email?: string };
  if (!user.id) throw new DataError("invalid_token", 401);
  return { id: user.id, email: user.email };
}

export async function signOut(token: string): Promise<void> {
  await authFetch("logout?scope=local", { method: "POST" }, token);
}

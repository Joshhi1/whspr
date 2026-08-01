import { supabase } from './supabase';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean; // include the Supabase access token (default true)
  isForm?: boolean;
}

export async function api(path: string, options: RequestOptions = {}) {
  const { auth = true, isForm = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      finalHeaders['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  if (!isForm && rest.body && !(rest.body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${path}`, { ...rest, headers: finalHeaders });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.error || 'Something went wrong', json.code || 'ERR_UNKNOWN', res.status);
  }
  return json;
}

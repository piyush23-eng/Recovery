let activeApiKey: string = (import.meta as any).env?.VITE_RECOVERY_API_KEY || '';

export async function initApiKey(): Promise<string> {
  if (activeApiKey) return activeApiKey;
  try {
    const res = await fetch('/api/auth/config');
    if (res.ok) {
      const data = await res.json();
      if (data.api_key) {
        activeApiKey = data.api_key;
        return activeApiKey;
      }
    }
  } catch (err) {
    console.warn('Could not fetch auth config:', err);
  }
  return activeApiKey;
}

export function getApiKey(): string {
  return activeApiKey;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const key = await initApiKey();
  const headers = new Headers(options.headers || {});
  if (key) {
    headers.set('X-API-Key', key);
  }
  return fetch(url, {
    ...options,
    headers,
  });
}

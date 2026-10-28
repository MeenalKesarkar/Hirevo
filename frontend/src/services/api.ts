export type HirevoUser = {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter" | "admin";
};

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "hirevoAccessToken";
const USER_KEY = "hirevoUser";
const AUTH_EVENT = "hirevo:auth-change";
let refreshRequest: Promise<boolean> | undefined;

function readStoredValue(key: string): string | null {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function storeSession(accessToken: string, user: HirevoUser, rememberMe: boolean): void {
  const preferred = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  preferred.setItem(TOKEN_KEY, accessToken);
  preferred.setItem(USER_KEY, JSON.stringify(user));
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAccessToken(): string | null {
  return readStoredValue(TOKEN_KEY);
}

export function getCurrentUser(): HirevoUser | null {
  const value = readStoredValue(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as HirevoUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function subscribeToAuthChanges(callback: () => void): () => void {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function signIn(email: string, password: string, rememberMe: boolean): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({})) as {
    error?: string;
    accessToken?: string;
    user?: HirevoUser;
  };
  if (!response.ok || !payload.accessToken || !payload.user) {
    throw new Error(payload.error ?? "Sign in failed. Please check your details and try again.");
  }
  storeSession(payload.accessToken, payload.user, rememberMe);
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Could not create your account. Please try again.");
  }
}

async function renewAccessToken(): Promise<boolean> {
  if (!getAccessToken()) return false;
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).then(async (response) => {
      if (!response.ok) return false;
      const payload = await response.json() as { accessToken?: string };
      if (!payload.accessToken) return false;
      const tokenStore = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      tokenStore.setItem(TOKEN_KEY, payload.accessToken);
      return true;
    }).catch(() => false).finally(() => {
      refreshRequest = undefined;
    });
  }
  const renewed = await refreshRequest;
  if (!renewed) clearSession();
  return renewed;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  };

  let response = await send();
  if (response.status === 401 && await renewAccessToken()) response = await send();
  const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : "Something went wrong. Please try again.";
    throw new Error(error);
  }
  return payload as T;
}

export async function signOut(): Promise<void> {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/** Small fetch wrapper for the admin screens. Redirects to the login page on 401. */
export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return { ok: false, error: "Session expired", status: 401 };
    }
    return res.ok ? { ok: true, data: data as T } : { ok: false, error: data.error || "Something went wrong.", status: res.status };
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

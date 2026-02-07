const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const USER_ID =
  process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "x-user-id": USER_ID },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { "x-user-id": USER_ID }
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export function sseUrl() {
  return `${API_URL}/events`;
}

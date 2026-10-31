import type { ChatResponse, ServiceVertical, SessionStatus } from "./contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body;
}

export const api = {
  session: () => request<SessionStatus>("/api/session"),
  startSwiggy: () => request<{ url: string }>("/api/auth/swiggy/start", { method: "POST" }),
  disconnectSwiggy: () => request<{ connected: false }>("/api/auth/swiggy/disconnect", { method: "POST" }),
  sendMessage: (vertical: ServiceVertical, conversationId: string, message: string, options?: { allowCombined?: boolean; selectedAddressId?: string }) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ vertical, conversationId, message, ...options }),
    }),
};

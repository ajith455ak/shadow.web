/**
 * API client for Shadow Nexus.
 * All requests prefixed with /api. Auth token from secure storage.
 */
import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";

let BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
if (Platform.OS === "web" && typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
  if (!BASE || isLocal) {
    BASE = `http://${host}:8001`;
  }
} else if (Platform.OS === "android" && (BASE.includes("localhost") || BASE.includes("127.0.0.1"))) {
  BASE = BASE.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}

const TOKEN_KEY = "sn_token";

export async function getToken(): Promise<string | null> {
  return (await storage.secureGet<string>(TOKEN_KEY, "")) || null;
}

export async function setToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || res.statusText;
    throw new ApiError(typeof msg === "string" ? msg : "Request failed", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) => request<T>(p, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(p: string, body?: any) => request<T>(p, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

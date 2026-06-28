import { supabase } from "./supabase.js";

export async function apiFetch(path, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // In production, use VITE_API_URL; in dev, use the Vite proxy (/api → localhost:5001)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  return res.json();
}

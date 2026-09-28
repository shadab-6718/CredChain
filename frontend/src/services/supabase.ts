import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseUrl = (): string => {
  const custom = localStorage.getItem("credchain_custom_supabase_url");
  if (custom && !custom.includes("your-project") && !custom.includes("placeholder")) {
    return custom;
  }
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    "https://glfnjnhjkyxtrbqtvcyb.supabase.co"
  );
};

export const getSupabaseAnonKey = (): string => {
  const customKey = localStorage.getItem("credchain_custom_supabase_anon_key");
  if (customKey && !customKey.includes("your-supabase") && !customKey.includes("placeholder")) {
    return customKey;
  }
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZm5qbmhqa3l4dHJicXR2Y3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDc0MjEsImV4cCI6MjEwNDE4MzQyMX0.N6TYyFUg8p9dWAF9ZKIh16Ls8M01-ZFSlGwFnZMNTLE"
  );
};

export let supabase: SupabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const updateSupabaseCredentials = (url: string, key?: string): SupabaseClient => {
  if (url) localStorage.setItem("credchain_custom_supabase_url", url.trim());
  if (key) localStorage.setItem("credchain_custom_supabase_anon_key", key.trim());
  supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
};


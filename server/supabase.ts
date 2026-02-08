import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables");
}

if (supabaseUrl.startsWith("eyJ") && supabaseKey.startsWith("http")) {
  const temp = supabaseUrl;
  supabaseUrl = supabaseKey;
  supabaseKey = temp;
} else if (supabaseUrl.startsWith("eyJ") && !supabaseKey.startsWith("http")) {
  const temp = supabaseUrl;
  supabaseUrl = `https://${supabaseKey}.supabase.co`;
  supabaseKey = temp;
}

if (!supabaseUrl.startsWith("http")) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const supabase = createClient(supabaseUrl, supabaseKey);

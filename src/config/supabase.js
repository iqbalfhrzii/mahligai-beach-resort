import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://jkgqsvpjbsvnmlebzttg.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ3FzdnBqYnN2bm1sZWJ6dHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDc3OTUsImV4cCI6MjA5ODU4Mzc5NX0.dJDnq_OZqg70PGH9N5jsJ1FjBsp1mmvF2Hrbc-KR5RQ";
export const BUCKET_NAME = "attendance-selfies";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

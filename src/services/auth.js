import { supabase } from "../config/supabase.js";

let currentUser = null;

export async function login(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes("Invalid login credentials")) {
      throw new Error("Email atau password salah.");
    }
    throw new Error(authError.message || "Gagal masuk. Silakan coba lagi.");
  }

  const user = authData.user;
  if (!user) throw new Error("Gagal mengambil data user.");

  // Fetch full user profile from "users" table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userData) {
    throw new Error("Profil pengguna tidak ditemukan di database.");
  }

  currentUser = userData;
  return currentUser;
}

export async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
}

export async function getCurrentUser() {
  if (currentUser) return currentUser;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) return null;

  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !userData) {
    await logout();
    return null;
  }

  currentUser = userData;
  return currentUser;
}

export function getCachedUser() {
  return currentUser;
}

export function setCachedUser(user) {
  currentUser = user;
}

export async function changePassword(currentPassword, newPassword) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    throw new Error("Sesi telah berakhir. Silakan login kembali.");
  }

  // 1. Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new Error("Kata sandi lama Anda salah.");
  }

  // 2. Update password in Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || "Gagal memperbarui kata sandi.");
  }

  // 3. Update plain-text password in users table to stay consistent with mobile app
  await supabase
    .from("users")
    .update({ password: newPassword })
    .eq("id", user.id);

  return true;
}

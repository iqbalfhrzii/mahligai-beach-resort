import { supabase } from "../config/supabase.js";

const DEFAULT_SHIFT = {
  id: "SHF001",
  name: "Shift Pagi",
  checkintime: "08:00",
  checkouttime: "16:00",
  latetoleranceminutes: 15,
};

export async function getShifts() {
  try {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("name");

    if (error || !data || data.length === 0) {
      return [DEFAULT_SHIFT];
    }

    return data.map((s) => ({
      ...s,
      latetoleranceminutes: Number(s.latetoleranceminutes ?? 15),
    }));
  } catch (e) {
    console.warn("Using default shift fallback:", e);
    return [DEFAULT_SHIFT];
  }
}

export function isCasualShift(shift) {
  return shift.checkintime === "00:00" && shift.checkouttime === "23:59";
}

export function isLate(shift, date = new Date()) {
  if (isCasualShift(shift)) return false;

  const [inHour, inMinute] = shift.checkintime.split(":").map(Number);
  const tol = Number(shift.latetoleranceminutes || 0);

  const limitTotalMinutes = inHour * 60 + inMinute + tol;
  const currentTotalMinutes = date.getHours() * 60 + date.getMinutes();

  return currentTotalMinutes > limitTotalMinutes;
}

export function isTooEarlyToCheckout(shift, date = new Date()) {
  if (isCasualShift(shift)) return false;

  const [outHour, outMinute] = shift.checkouttime.split(":").map(Number);
  const outTotalMinutes = outHour * 60 + outMinute;
  const currentTotalMinutes = date.getHours() * 60 + date.getMinutes();

  return currentTotalMinutes < outTotalMinutes;
}

export function getAllowedCheckoutTimeStr(shift) {
  if (isCasualShift(shift)) return "Fleksibel (Kapan saja)";
  const [outHour, outMinute] = shift.checkouttime.split(":").map(Number);
  const date = new Date();
  date.setHours(outHour, outMinute + 1, 0, 0);
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

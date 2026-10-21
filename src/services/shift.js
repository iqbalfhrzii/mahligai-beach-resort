import { supabase } from "../config/supabase.js";
import { getWitaNow } from "../utils/date.js";

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

export function isLate(shift, customTime = null) {
  if (isCasualShift(shift)) return false;

  const wita = customTime || getWitaNow();
  const [inHour, inMinute] = shift.checkintime.split(":").map(Number);
  const tol = Number(shift.latetoleranceminutes || 0);

  const limitTotalMinutes = inHour * 60 + inMinute + tol;
  const currentTotalMinutes = (wita.hours != null ? wita.hours : wita.getHours()) * 60 + (wita.minutes != null ? wita.minutes : wita.getMinutes());

  return currentTotalMinutes > limitTotalMinutes;
}

export function isTooEarlyToCheckout(shift, customTime = null) {
  if (isCasualShift(shift)) return false;

  const wita = customTime || getWitaNow();
  const [outHour, outMinute] = shift.checkouttime.split(":").map(Number);
  const outTotalMinutes = outHour * 60 + outMinute;
  const currentTotalMinutes = (wita.hours != null ? wita.hours : wita.getHours()) * 60 + (wita.minutes != null ? wita.minutes : wita.getMinutes());

  return currentTotalMinutes < outTotalMinutes;
}

export function getAllowedCheckoutTimeStr(shift) {
  if (isCasualShift(shift)) return "Fleksibel (Kapan saja)";
  const [outHour, outMinute] = shift.checkouttime.split(":").map(Number);
  let minute = outMinute + 1;
  let hour = outHour;
  if (minute >= 60) {
    minute -= 60;
    hour = (hour + 1) % 24;
  }
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

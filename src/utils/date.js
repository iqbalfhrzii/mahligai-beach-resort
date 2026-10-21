/**
 * Utilities for formatting and computing time in WITA (UTC+8 / Asia/Makassar).
 * Ensures consistency between Web and Mobile applications for Mahligai Beach Resort.
 */

const WITA_TIMEZONE = "Asia/Makassar";

/**
 * Get current time details specifically in WITA (UTC+8).
 */
export function getWitaNow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: WITA_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  });

  const parts = formatter.formatToParts(now);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));

  const daysIndo = {
    Sunday: "Minggu",
    Monday: "Senin",
    Tuesday: "Selasa",
    Wednesday: "Rabu",
    Thursday: "Kamis",
    Friday: "Jumat",
    Saturday: "Sabtu",
  };

  const monthsIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const hours = Number(p.hour === "24" ? 0 : p.hour);
  const minutes = Number(p.minute);
  const seconds = Number(p.second);

  const dayName = daysIndo[p.weekday] || p.weekday;
  const monthName = monthsIndo[month - 1];

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dayName,
    monthName,
    dateStr: `${p.year}-${p.month}-${p.day}`,
    timeStr: `${hh}:${mm}`,
    timeWithSeconds: `${hh}:${mm}:${ss}`,
    fullDateStr: `${dayName}, ${day} ${monthName} ${year}`,
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in WITA.
 */
export function getWitaTodayDateStr() {
  return getWitaNow().dateStr;
}

/**
 * Returns current month formatted as YYYY-MM in WITA.
 */
export function getWitaCurrentMonthStr() {
  const n = getWitaNow();
  return `${n.year}-${String(n.month).padStart(2, "0")}`;
}

/**
 * Format any ISO timestamp or Date object to HH:mm in WITA.
 */
export function formatTimeWita(isoOrDate) {
  if (!isoOrDate) return "--:--";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return "--:--";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WITA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const hh = (p.hour === "24" ? "00" : p.hour).padStart(2, "0");
  const mm = p.minute.padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Format any ISO timestamp or Date object to HH:mm:ss in WITA.
 */
export function formatTimeWithSecondsWita(isoOrDate) {
  if (!isoOrDate) return "--:--:--";
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return "--:--:--";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WITA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const hh = (p.hour === "24" ? "00" : p.hour).padStart(2, "0");
  const mm = p.minute.padStart(2, "0");
  const ss = p.second.padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Format date in Indonesian locale (e.g. "22 Oktober 2026") in WITA.
 */
export function formatIndoDateWita(isoOrDate, shortMonth = false) {
  if (!isoOrDate) return "-";

  // If date-only string like "2026-10-22"
  if (typeof isoOrDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
    const [y, m, day] = isoOrDate.trim().split("-").map(Number);
    const months = shortMonth
      ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
      : ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${day} ${months[m - 1]} ${y}`;
  }

  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WITA_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);

  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const day = Number(p.day);
  const month = Number(p.month);
  const year = p.year;

  const months = shortMonth
    ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    : ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return `${day} ${months[month - 1]} ${year}`;
}

/**
 * Get Indonesian day of week in WITA (e.g. "Kamis").
 */
export function getDayOfWeekWita(isoOrDate) {
  if (!isoOrDate) return "-";
  let d;
  if (typeof isoOrDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
    const [y, m, day] = isoOrDate.trim().split("-").map(Number);
    d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
  } else {
    d = new Date(isoOrDate);
  }
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WITA_TIMEZONE,
    weekday: "long",
  }).format(d);
}

/**
 * Calculate duration between two ISO timestamps.
 */
export function calculateWorkDuration(inIso, outIso) {
  if (!inIso || !outIso) return "-";
  const start = new Date(inIso);
  const end = new Date(outIso);
  let diffMs = end - start;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
  const totalMins = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

import { supabase, BUCKET_NAME } from "../config/supabase.js";
import { uploadAttendanceSelfie, deleteStorageFiles } from "./storage.js";

const TABLE_NAME = "attendances";

/**
 * Get today attendance (or unfinished attendance from night shift).
 */
export async function getTodayAttendance(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("userid", userId)
      .order("createdat", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // If latest record has not checked out, return it regardless of date (e.g. night shift)
    if (!data.checkouttime) {
      return data;
    }

    // If checked out, verify if it was today
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const recordDateStr = new Date(data.date).toISOString().split("T")[0];

    if (recordDateStr === todayStr) {
      return data;
    }

    return null;
  } catch (e) {
    console.error("Error fetching today attendance:", e);
    return null;
  }
}

/**
 * Perform Check-In
 */
export async function checkIn({
  userId,
  employeeName,
  shiftId,
  shiftName,
  latitude,
  longitude,
  distanceFromOffice,
  locationStatus = "inside",
  attendanceStatus = "present",
  photoBlob,
}) {
  const existing = await getTodayAttendance(userId);
  if (existing && !existing.checkouttime) {
    throw new Error("Anda memiliki sesi absensi yang belum selesai (belum Check Out).");
  }

  const now = new Date();
  let publicPhotoUrl = null;

  if (photoBlob) {
    publicPhotoUrl = await uploadAttendanceSelfie(photoBlob, userId, "checkin");
  }

  const newRecord = {
    userid: userId,
    employeename: employeeName,
    shiftid: shiftId,
    shiftname: shiftName,
    date: now.toISOString().split("T")[0],
    checkintime: now.toISOString(),
    checkinphotopath: publicPhotoUrl,
    latitude: latitude || null,
    longitude: longitude || null,
    distancefromoffice: distanceFromOffice != null ? Number(distanceFromOffice.toFixed(1)) : null,
    locationstatus: locationStatus, // inside | outside | unknown
    attendancestatus: attendanceStatus, // present | late_ | earlyLeave
    createdat: now.toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(newRecord)
    .select()
    .single();

  if (error) {
    throw new Error("Gagal menyimpan data absensi masuk: " + error.message);
  }

  return data;
}

/**
 * Perform Check-Out
 */
export async function checkOut({
  attendanceId,
  userId,
  photoBlob,
  attendanceStatus,
}) {
  const { data: record, error: findError } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", attendanceId)
    .single();

  if (findError || !record) {
    throw new Error("Catatan absensi tidak ditemukan.");
  }

  if (!record.checkintime) {
    throw new Error("Anda belum melakukan absen masuk.");
  }

  if (record.checkouttime) {
    throw new Error("Anda sudah melakukan absen pulang.");
  }

  const now = new Date();
  let publicPhotoUrl = null;

  if (photoBlob) {
    publicPhotoUrl = await uploadAttendanceSelfie(photoBlob, userId || record.userid, "checkout");
  }

  const updates = {
    checkouttime: now.toISOString(),
    checkoutphotopath: publicPhotoUrl || record.checkoutphotopath,
  };

  if (attendanceStatus) {
    updates.attendancestatus = attendanceStatus;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", attendanceId)
    .select()
    .single();

  if (error) {
    throw new Error("Gagal memperbarui absensi pulang: " + error.message);
  }

  return data;
}

/**
 * Get user attendance history
 */
export async function getUserHistory(userId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("userid", userId)
    .order("date", { ascending: false })
    .order("checkintime", { ascending: false });

  if (error) throw new Error("Gagal memuat riwayat: " + error.message);
  return data || [];
}

/**
 * Get all attendances (for admin)
 */
export async function getAllAttendances(monthFilter = null) {
  let query = supabase
    .from(TABLE_NAME)
    .select("*")
    .order("date", { ascending: false })
    .order("checkintime", { ascending: false });

  if (monthFilter) {
    // monthFilter is "YYYY-MM"
    const [year, month] = monthFilter.split("-").map(Number);
    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) throw new Error("Gagal memuat rekap admin: " + error.message);
  return data || [];
}

/**
 * Delete records by month
 */
export async function deleteAttendancesByMonth(year, month) {
  const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const end = new Date(year, month, 0).toISOString().split("T")[0];

  const { data: records, error: fetchErr } = await supabase
    .from(TABLE_NAME)
    .select("checkinphotopath, checkoutphotopath")
    .gte("date", start)
    .lte("date", end);

  if (fetchErr) throw fetchErr;

  // Extract storage paths to delete files
  const storagePaths = [];
  const bucketKey = `/${BUCKET_NAME}/`;

  (records || []).forEach((r) => {
    [r.checkinphotopath, r.checkoutphotopath].forEach((url) => {
      if (url && url.includes(bucketKey)) {
        const parts = url.split(bucketKey);
        if (parts[1]) storagePaths.push(decodeURIComponent(parts[1]));
      }
    });
  });

  if (storagePaths.length > 0) {
    await deleteStorageFiles(storagePaths);
  }

  const { error: deleteErr } = await supabase
    .from(TABLE_NAME)
    .delete()
    .gte("date", start)
    .lte("date", end);

  if (deleteErr) throw deleteErr;
}

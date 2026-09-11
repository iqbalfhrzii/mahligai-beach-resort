import { supabase, BUCKET_NAME } from "../config/supabase.js";

/**
 * Upload selfie image (Blob or File) to Supabase Storage.
 * Folder format: userId/YYYY-MM-DD/attendanceType_timestamp.jpg
 */
export async function uploadAttendanceSelfie(fileBlob, userId, attendanceType = "checkin") {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timestamp = now.getTime();
    const fileName = `${attendanceType}_${timestamp}.jpg`;

    const path = `${userId}/${dateStr}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, fileBlob, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Gagal mengupload foto selfie: " + uploadError.message);
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("Storage upload error:", err);
    throw err;
  }
}

export async function deleteStorageFiles(paths) {
  if (!paths || paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
  if (error) console.error("Error deleting storage files:", error);
}

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get current browser GPS location.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("Perangkat atau browser Anda tidak mendukung GPS / Geolokasi."));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = "Gagal mengambil lokasi GPS.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = "Izin akses lokasi (GPS) ditolak. Silakan aktifkan izin lokasi di browser / pengaturan iPhone.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "Sinyal GPS tidak tersedia atau tidak akurat. Pastikan GPS aktif.";
            break;
          case err.TIMEOUT:
            msg = "Waktu permintaan lokasi habis. Coba lagi.";
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

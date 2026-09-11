import confetti from "canvas-confetti";
import { getPrimaryOffice } from "../services/office.js";
import { getShifts, isLate, isTooEarlyToCheckout, getAllowedCheckoutTimeStr } from "../services/shift.js";
import { getCurrentPosition, calculateDistance } from "../services/location.js";
import { getTodayAttendance, checkIn, checkOut } from "../services/attendance.js";
import { openCameraModal } from "../components/camera-modal.js";
import { openPhotoModal } from "../components/photo-modal.js";
import { initMapCard, destroyMap } from "../components/map-card.js";
import { showToast } from "../components/toast.js";

let clockInterval = null;

export async function renderHomeView(container, user) {
  // Clear any previous interval
  if (clockInterval) clearInterval(clockInterval);

  container.innerHTML = `
    <div class="home-view-wrapper animate-fade-in">
      <!-- Live Clock & Greeting Header -->
      <section class="clock-hero-card">
        <div class="clock-top-row">
          <div class="clock-date" id="live-date">...</div>
          <div class="clock-live-pill">
            <span class="live-dot"></span> LIVE
          </div>
        </div>
        <div class="clock-time-display" id="live-clock">00:00:00</div>
        <div class="clock-greeting">
          <p class="greeting-sub">Selamat bertugas,</p>
          <h2 class="greeting-name">${escapeHtml(user.fullname)}</h2>
          <div class="employee-meta-row">
            <span class="meta-tag">🆔 ${escapeHtml(user.employeecode || "-")}</span>
            <span class="meta-tag">💼 ${user.role === "admin" ? "Administrator" : "Karyawan"}</span>
          </div>
        </div>
      </section>

      <!-- Office & GPS Geofence Card -->
      <section class="card geofence-card">
        <div class="card-header">
          <div class="card-header-icon location-icon-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="card-header-text">
            <h3 class="card-title" id="office-name">Memeriksa Kantor...</h3>
            <span class="card-subtitle">Verifikasi Lokasi & Geofencing</span>
          </div>
          <button id="refresh-gps-btn" class="icon-refresh-btn" title="Perbarui Lokasi GPS">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>

        <div class="geofence-body">
          <div class="location-status-badge status-loading" id="location-status-badge">
            <div class="spinner-sm"></div>
            <span>Mengakses GPS perangkat...</span>
          </div>

          <div class="location-info-grid">
            <div class="info-cell">
              <span class="info-label">Jarak ke Kantor</span>
              <span class="info-value" id="distance-text">-</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Radius Izin</span>
              <span class="info-value" id="radius-text">-</span>
            </div>
          </div>

          <!-- Map Toggle -->
          <div class="map-toggle-wrapper">
            <button id="toggle-map-btn" class="btn btn-ghost btn-sm">
              <span id="toggle-map-text">📍 Tampilkan Peta Radius</span>
            </button>
          </div>

          <div id="map-container" class="map-wrapper hidden">
            <div id="home-map" class="home-map"></div>
          </div>
        </div>
      </section>

      <!-- Shift Schedule Card -->
      <section class="card shift-card">
        <div class="card-header">
          <div class="card-header-icon shift-icon-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Jadwal Shift Kerja</h3>
            <span class="card-subtitle">Pilih jadwal absen Anda</span>
          </div>
        </div>

        <div class="shift-body">
          <div class="form-group mb-0">
            <select id="shift-select" class="form-select"></select>
          </div>
          <div class="shift-details-bar" id="shift-details">
            <span class="shift-time-pill" id="shift-time-pill">08:00 - 16:00</span>
            <span class="shift-tolerance" id="shift-tolerance">Toleransi: 15 menit</span>
          </div>
        </div>
      </section>

      <!-- Attendance Today Summary -->
      <section class="card today-attendance-card">
        <div class="card-header">
          <div class="card-header-icon attendance-icon-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Status Absensi Hari Ini</h3>
            <span class="card-subtitle" id="attendance-status-label">Belum Absen Masuk</span>
          </div>
        </div>

        <div class="attendance-summary-grid">
          <!-- Check In Box -->
          <div class="summary-box">
            <div class="box-header">
              <span class="box-title">Jam Masuk</span>
              <span class="badge badge-sm" id="checkin-badge">-</span>
            </div>
            <div class="box-time" id="checkin-time-text">--:--</div>
            <div id="checkin-photo-btn-container" class="box-action hidden">
              <button id="view-checkin-photo-btn" class="btn btn-link btn-xs">
                📷 Lihat Foto Masuk
              </button>
            </div>
          </div>

          <!-- Check Out Box -->
          <div class="summary-box">
            <div class="box-header">
              <span class="box-title">Jam Pulang</span>
              <span class="badge badge-sm" id="checkout-badge">-</span>
            </div>
            <div class="box-time" id="checkout-time-text">--:--</div>
            <div id="checkout-photo-btn-container" class="box-action hidden">
              <button id="view-checkout-photo-btn" class="btn btn-link btn-xs">
                📷 Lihat Foto Pulang
              </button>
            </div>
          </div>
        </div>

        <!-- Duration Row -->
        <div class="duration-row">
          <span class="duration-label">Durasi Kerja:</span>
          <span class="duration-value" id="work-duration-text">-</span>
        </div>
      </section>

      <!-- Action Button Section -->
      <section class="attendance-actions-section" id="action-section">
        <button id="action-checkin-btn" class="btn btn-success btn-block btn-xl hidden">
          <span class="btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
          </span>
          <span class="btn-label">Absen Masuk (Check In)</span>
        </button>

        <button id="action-checkout-btn" class="btn btn-danger btn-block btn-xl hidden">
          <span class="btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </span>
          <span class="btn-label">Absen Pulang (Check Out)</span>
        </button>

        <div id="attendance-complete-banner" class="complete-banner hidden">
          <div class="complete-icon">🎉</div>
          <div class="complete-text">
            <h4>Absensi Selesai!</h4>
            <p>Terima kasih atas dedikasi Anda hari ini.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // DOM Elements
  const liveClock = container.querySelector("#live-clock");
  const liveDate = container.querySelector("#live-date");
  const officeNameEl = container.querySelector("#office-name");
  const statusBadge = container.querySelector("#location-status-badge");
  const distanceText = container.querySelector("#distance-text");
  const radiusText = container.querySelector("#radius-text");
  const refreshGpsBtn = container.querySelector("#refresh-gps-btn");
  const toggleMapBtn = container.querySelector("#toggle-map-btn");
  const toggleMapText = container.querySelector("#toggle-map-text");
  const mapContainer = container.querySelector("#map-container");
  const shiftSelect = container.querySelector("#shift-select");
  const shiftTimePill = container.querySelector("#shift-time-pill");
  const shiftTolerance = container.querySelector("#shift-tolerance");
  const statusLabel = container.querySelector("#attendance-status-label");
  const checkinTimeText = container.querySelector("#checkin-time-text");
  const checkinBadge = container.querySelector("#checkin-badge");
  const checkinPhotoBtnContainer = container.querySelector("#checkin-photo-btn-container");
  const viewCheckinPhotoBtn = container.querySelector("#view-checkin-photo-btn");
  const checkoutTimeText = container.querySelector("#checkout-time-text");
  const checkoutBadge = container.querySelector("#checkout-badge");
  const checkoutPhotoBtnContainer = container.querySelector("#checkout-photo-btn-container");
  const viewCheckoutPhotoBtn = container.querySelector("#view-checkout-photo-btn");
  const workDurationText = container.querySelector("#work-duration-text");
  const actionCheckinBtn = container.querySelector("#action-checkin-btn");
  const actionCheckoutBtn = container.querySelector("#action-checkout-btn");
  const completeBanner = container.querySelector("#attendance-complete-banner");

  // State
  let office = null;
  let userLocation = null;
  let isInsideRadius = false;
  let currentDistance = null;
  let shiftsList = [];
  let selectedShift = null;
  let todayAttendance = null;
  let isMapOpen = false;

  // 1. Setup Live Clock
  function updateClock() {
    const now = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    liveDate.textContent = `${dayName}, ${dateNum} ${monthName} ${year}`;

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    liveClock.textContent = `${hh}:${mm}:${ss}`;
  }

  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  // 2. Fetch Data & Location
  async function loadInitialData() {
    try {
      // Load Office
      office = await getPrimaryOffice();
      officeNameEl.textContent = office.name;
      radiusText.textContent = `${office.radiusmeter} meter`;

      // Load Shifts
      shiftsList = await getShifts();
      shiftSelect.innerHTML = shiftsList.map(
        (s) => `<option value="${s.id}">${escapeHtml(s.name)} (${s.checkintime} - ${s.checkouttime})</option>`
      ).join("");

      selectedShift = shiftsList[0];
      updateShiftDetails(selectedShift);

      // Load Today Attendance
      await refreshTodayAttendance();

      // Fetch GPS Location
      await updateLocation();
    } catch (err) {
      console.error("Initial load error:", err);
      showToast("Gagal memuat beberapa data awal.", "warning");
    }
  }

  function updateShiftDetails(s) {
    if (!s) return;
    shiftTimePill.textContent = `${s.checkintime} - ${s.checkouttime}`;
    shiftTolerance.textContent = `Toleransi: ${s.latetoleranceminutes} menit`;
  }

  shiftSelect.addEventListener("change", (e) => {
    selectedShift = shiftsList.find((s) => s.id === e.target.value) || shiftsList[0];
    updateShiftDetails(selectedShift);
  });

  // 3. Location & Geofence Checking
  async function updateLocation() {
    statusBadge.className = "location-status-badge status-loading";
    statusBadge.innerHTML = `<div class="spinner-sm"></div><span>Memperbarui lokasi GPS...</span>`;
    refreshGpsBtn.classList.add("rotating");

    try {
      userLocation = await getCurrentPosition();
      if (!office) office = await getPrimaryOffice();

      currentDistance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        office.latitude,
        office.longitude
      );

      isInsideRadius = currentDistance <= office.radiusmeter;

      if (isInsideRadius) {
        statusBadge.className = "location-status-badge status-inside";
        statusBadge.innerHTML = `<span>✅ Di Dalam Area Kantor</span>`;
      } else {
        statusBadge.className = "location-status-badge status-outside";
        statusBadge.innerHTML = `<span>⚠️ Di Luar Area Kantor</span>`;
      }

      distanceText.textContent = `${currentDistance.toFixed(1)} m`;

      if (isMapOpen) {
        initMapCard("home-map", office, userLocation, isInsideRadius);
      }
    } catch (err) {
      statusBadge.className = "location-status-badge status-outside";
      statusBadge.innerHTML = `<span>❌ GPS Tidak Terdeteksi</span>`;
      distanceText.textContent = "-";
      showToast(err.message || "Gagal mendapatkan lokasi GPS.", "error");
    } finally {
      refreshGpsBtn.classList.remove("rotating");
    }
  }

  refreshGpsBtn.addEventListener("click", updateLocation);

  // Toggle Mini Map
  toggleMapBtn.addEventListener("click", () => {
    isMapOpen = !isMapOpen;
    if (isMapOpen) {
      mapContainer.classList.remove("hidden");
      toggleMapText.textContent = "▲ Sembunyikan Peta";
      if (office) {
        initMapCard("home-map", office, userLocation, isInsideRadius);
      }
    } else {
      mapContainer.classList.add("hidden");
      toggleMapText.textContent = "📍 Tampilkan Peta Radius";
      destroyMap();
    }
  });

  // 4. Refresh Today Attendance UI
  async function refreshTodayAttendance() {
    todayAttendance = await getTodayAttendance(user.id);

    // Reset UI
    actionCheckinBtn.classList.add("hidden");
    actionCheckoutBtn.classList.add("hidden");
    completeBanner.classList.add("hidden");
    checkinPhotoBtnContainer.classList.add("hidden");
    checkoutPhotoBtnContainer.classList.add("hidden");

    if (!todayAttendance) {
      // Case 1: Has not checked in today
      statusLabel.textContent = "Belum Melakukan Absensi";
      checkinTimeText.textContent = "--:--";
      checkoutTimeText.textContent = "--:--";
      checkinBadge.textContent = "Belum";
      checkinBadge.className = "badge badge-sm badge-outline";
      checkoutBadge.textContent = "-";
      checkoutBadge.className = "badge badge-sm badge-outline";
      workDurationText.textContent = "-";

      actionCheckinBtn.classList.remove("hidden");
      shiftSelect.disabled = false;
    } else if (todayAttendance.checkintime && !todayAttendance.checkouttime) {
      // Case 2: Checked In, but has not Checked Out
      statusLabel.textContent = "Sedang Bertugas (Sudah Check In)";

      const inDate = new Date(todayAttendance.checkintime);
      checkinTimeText.textContent = formatTimeStr(inDate);

      // Status badge
      const isLateStatus = todayAttendance.attendancestatus === "late_";
      checkinBadge.textContent = isLateStatus ? "Terlambat" : "Tepat Waktu";
      checkinBadge.className = isLateStatus ? "badge badge-sm badge-warning" : "badge badge-sm badge-success";

      if (todayAttendance.checkinphotopath) {
        checkinPhotoBtnContainer.classList.remove("hidden");
        viewCheckinPhotoBtn.onclick = () => openPhotoModal(todayAttendance.checkinphotopath, "Foto Absen Masuk");
      }

      checkoutTimeText.textContent = "--:--";
      checkoutBadge.textContent = "Belum";
      checkoutBadge.className = "badge badge-sm badge-outline";

      workDurationText.textContent = "Sedang berlangsung...";

      actionCheckoutBtn.classList.remove("hidden");

      // Lock shift select to match ongoing record
      if (todayAttendance.shiftid) {
        shiftSelect.value = todayAttendance.shiftid;
        shiftSelect.disabled = true;
        selectedShift = shiftsList.find((s) => s.id === todayAttendance.shiftid) || selectedShift;
        updateShiftDetails(selectedShift);
      }
    } else if (todayAttendance.checkintime && todayAttendance.checkouttime) {
      // Case 3: Completed attendance
      statusLabel.textContent = "Absensi Hari Ini Selesai";

      const inDate = new Date(todayAttendance.checkintime);
      const outDate = new Date(todayAttendance.checkouttime);

      checkinTimeText.textContent = formatTimeStr(inDate);
      const isLateStatus = todayAttendance.attendancestatus === "late_";
      checkinBadge.textContent = isLateStatus ? "Terlambat" : "Tepat Waktu";
      checkinBadge.className = isLateStatus ? "badge badge-sm badge-warning" : "badge badge-sm badge-success";

      checkoutTimeText.textContent = formatTimeStr(outDate);
      checkoutBadge.textContent = "Selesai";
      checkoutBadge.className = "badge badge-sm badge-success";

      if (todayAttendance.checkinphotopath) {
        checkinPhotoBtnContainer.classList.remove("hidden");
        viewCheckinPhotoBtn.onclick = () => openPhotoModal(todayAttendance.checkinphotopath, "Foto Absen Masuk");
      }
      if (todayAttendance.checkoutphotopath) {
        checkoutPhotoBtnContainer.classList.remove("hidden");
        viewCheckoutPhotoBtn.onclick = () => openPhotoModal(todayAttendance.checkoutphotopath, "Foto Absen Pulang");
      }

      // Calculate duration
      let diffMs = outDate - inDate;
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      const totalMinutes = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      workDurationText.textContent = hrs > 0 ? `${hrs} jam ${mins} menit` : `${mins} menit`;

      completeBanner.classList.remove("hidden");
      shiftSelect.disabled = true;
    }
  }

  // 5. Handle Check-In Click
  actionCheckinBtn.addEventListener("click", async () => {
    // 1. Re-verify GPS
    await updateLocation();

    if (!userLocation) {
      showToast("Lokasi GPS belum tersedia. Pastikan izin lokasi aktif.", "error");
      return;
    }

    if (!isInsideRadius) {
      alert(`⚠️ Anda berada di luar radius kantor (${currentDistance.toFixed(1)}m dari kantor, batas: ${office.radiusmeter}m).\nAbsensi tidak dapat dilanjutkan. Harap berada di area kantor.`);
      return;
    }

    // 2. Open Camera Modal for Selfie
    openCameraModal({
      title: "Selfie Absen Masuk",
      onCapture: async (photoBlob) => {
        actionCheckinBtn.disabled = true;
        showToast("Menyimpan absensi masuk...", "info");

        try {
          const now = new Date();
          const late = selectedShift ? isLate(selectedShift, now) : false;
          const status = late ? "late_" : "present";

          await checkIn({
            userId: user.id,
            employeeName: user.fullname,
            shiftId: selectedShift.id,
            shiftName: selectedShift.name,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            distanceFromOffice: currentDistance,
            locationStatus: "inside",
            attendanceStatus: status,
            photoBlob,
          });

          // Trigger Confetti!
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });

          showToast("Absensi masuk berhasil dicatat!", "success");
          await refreshTodayAttendance();
        } catch (err) {
          showToast(err.message || "Gagal melakukan absensi masuk.", "error");
        } finally {
          actionCheckinBtn.disabled = false;
        }
      },
    });
  });

  // 6. Handle Check-Out Click
  actionCheckoutBtn.addEventListener("click", async () => {
    if (!todayAttendance) return;

    // Check if early leave
    const now = new Date();
    const isEarly = selectedShift ? isTooEarlyToCheckout(selectedShift, now) : false;

    if (isEarly) {
      const allowedTime = getAllowedCheckoutTimeStr(selectedShift);
      const confirmEarly = confirm(
        `⏰ PERINGATAN: Jam pulang shift Anda adalah ${selectedShift.checkouttime}.\nAnda baru dapat pulang normal pada ${allowedTime}.\n\nApakah Anda yakin ingin Check Out lebih awal sekarang?`
      );
      if (!confirmEarly) return;
    }

    // Open Camera Modal for Checkout Selfie
    openCameraModal({
      title: "Selfie Absen Pulang",
      onCapture: async (photoBlob) => {
        actionCheckoutBtn.disabled = true;
        showToast("Menyimpan absensi pulang...", "info");

        try {
          const status = isEarly ? "earlyLeave" : (todayAttendance.attendancestatus || "present");

          await checkOut({
            attendanceId: todayAttendance.id,
            userId: user.id,
            photoBlob,
            attendanceStatus: status,
          });

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          showToast("Absensi pulang berhasil dicatat. Sampai jumpa besok!", "success");
          await refreshTodayAttendance();
        } catch (err) {
          showToast(err.message || "Gagal melakukan absensi pulang.", "error");
        } finally {
          actionCheckoutBtn.disabled = false;
        }
      },
    });
  });

  // Initialize view data
  await loadInitialData();
}

function formatTimeStr(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

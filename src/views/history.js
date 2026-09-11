import { getUserHistory } from "../services/attendance.js";
import { openPhotoModal } from "../components/photo-modal.js";
import { showToast } from "../components/toast.js";

export async function renderHistoryView(container, user) {
  container.innerHTML = `
    <div class="history-view-wrapper animate-fade-in">
      <!-- Header with Month Filter -->
      <div class="view-header-row">
        <div>
          <h2 class="view-title">Riwayat Absensi</h2>
          <p class="view-subtitle">Catatan kehadiran dan jam kerja Anda</p>
        </div>
        <div class="filter-box">
          <input type="month" id="history-month-filter" class="form-input form-input-sm" />
        </div>
      </div>

      <!-- Loading State -->
      <div id="history-loading" class="loading-state">
        <div class="spinner"></div>
        <span>Memuat riwayat kehadiran...</span>
      </div>

      <!-- History List -->
      <div id="history-list" class="history-list-container hidden"></div>

      <!-- Empty State -->
      <div id="history-empty" class="empty-state hidden">
        <div class="empty-icon">📅</div>
        <h3>Belum Ada Riwayat</h3>
        <p>Belum ada catatan absensi untuk periode yang dipilih.</p>
      </div>
    </div>
  `;

  const loadingEl = container.querySelector("#history-loading");
  const listEl = container.querySelector("#history-list");
  const emptyEl = container.querySelector("#history-empty");
  const monthFilter = container.querySelector("#history-month-filter");

  // Default month filter to current year-month
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  monthFilter.value = currentYm;

  let allRecords = [];

  async function loadHistory() {
    loadingEl.classList.remove("hidden");
    listEl.classList.add("hidden");
    emptyEl.classList.add("hidden");

    try {
      allRecords = await getUserHistory(user.id);
      applyFilter();
    } catch (err) {
      showToast(err.message || "Gagal memuat riwayat.", "error");
    } finally {
      loadingEl.classList.add("hidden");
    }
  }

  function applyFilter() {
    const selectedMonth = monthFilter.value; // "YYYY-MM"
    let filtered = allRecords;

    if (selectedMonth) {
      filtered = allRecords.filter((r) => {
        const d = new Date(r.date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return ym === selectedMonth;
      });
    }

    if (filtered.length === 0) {
      listEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    listEl.classList.remove("hidden");

    listEl.innerHTML = filtered.map((item) => renderHistoryCard(item)).join("");

    // Attach photo click listeners
    filtered.forEach((item) => {
      if (item.checkinphotopath) {
        const inBtn = listEl.querySelector(`#photo-in-${item.id}`);
        if (inBtn) {
          inBtn.addEventListener("click", () => {
            openPhotoModal(item.checkinphotopath, `Foto Masuk - ${formatIndoDate(item.date)}`);
          });
        }
      }
      if (item.checkoutphotopath) {
        const outBtn = listEl.querySelector(`#photo-out-${item.id}`);
        if (outBtn) {
          outBtn.addEventListener("click", () => {
            openPhotoModal(item.checkoutphotopath, `Foto Pulang - ${formatIndoDate(item.date)}`);
          });
        }
      }
    });
  }

  monthFilter.addEventListener("change", applyFilter);

  await loadHistory();
}

function renderHistoryCard(item) {
  const inTimeStr = item.checkintime ? formatTimeOnly(item.checkintime) : "--:--";
  const outTimeStr = item.checkouttime ? formatTimeOnly(item.checkouttime) : "--:--";
  const durationStr = calculateWorkDuration(item.checkintime, item.checkouttime);

  const statusObj = getStatusBadge(item.attendancestatus);

  return `
    <div class="card history-item-card">
      <div class="history-item-top">
        <div class="history-date-box">
          <span class="history-day">${getDayOfWeek(item.date)}</span>
          <span class="history-full-date">${formatIndoDate(item.date)}</span>
        </div>
        <div class="history-badges">
          <span class="badge ${statusObj.badgeClass}">${statusObj.label}</span>
          <span class="badge badge-outline">${escapeHtml(item.shiftname || "Shift")}</span>
        </div>
      </div>

      <div class="history-times-grid">
        <div class="time-col">
          <span class="col-lbl">Masuk</span>
          <span class="col-val">${inTimeStr}</span>
          ${item.checkinphotopath ? `
            <button id="photo-in-${item.id}" class="btn-thumb-photo" title="Lihat Foto Masuk">
              <img src="${item.checkinphotopath}" alt="Foto Masuk" class="mini-thumb" />
            </button>
          ` : ""}
        </div>

        <div class="time-divider-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        <div class="time-col">
          <span class="col-lbl">Pulang</span>
          <span class="col-val">${outTimeStr}</span>
          ${item.checkoutphotopath ? `
            <button id="photo-out-${item.id}" class="btn-thumb-photo" title="Lihat Foto Pulang">
              <img src="${item.checkoutphotopath}" alt="Foto Pulang" class="mini-thumb" />
            </button>
          ` : ""}
        </div>

        <div class="time-col duration-col">
          <span class="col-lbl">Durasi</span>
          <span class="col-val text-primary">${durationStr}</span>
        </div>
      </div>
    </div>
  `;
}

function getStatusBadge(status) {
  switch (status) {
    case "present":
      return { label: "✅ Hadir", badgeClass: "badge-success" };
    case "late_":
      return { label: "⏰ Terlambat", badgeClass: "badge-warning" };
    case "earlyLeave":
      return { label: "🏃 Pulang Awal", badgeClass: "badge-warning" };
    case "sick":
      return { label: "🤒 Sakit", badgeClass: "badge-info" };
    case "permission":
      return { label: "📋 Izin", badgeClass: "badge-info" };
    case "absent":
      return { label: "❌ Tidak Hadir", badgeClass: "badge-danger" };
    default:
      return { label: "Hadir", badgeClass: "badge-success" };
  }
}

function calculateWorkDuration(inIso, outIso) {
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

function formatTimeOnly(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatIndoDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[d.getDay()];
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

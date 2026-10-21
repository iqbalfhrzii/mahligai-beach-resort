import { getUserHistory } from "../services/attendance.js";
import { openPhotoModal } from "../components/photo-modal.js";
import { showToast } from "../components/toast.js";
import {
  formatTimeWita,
  formatIndoDateWita,
  getDayOfWeekWita,
  calculateWorkDuration,
  getWitaCurrentMonthStr,
} from "../utils/date.js";

export async function renderHistoryView(container, user) {
  container.innerHTML = `
    <div class="history-view-wrapper animate-fade-in">
      <!-- Header with Month Filter -->
      <div class="view-header-row">
        <div>
          <h2 class="view-title">Riwayat Absensi</h2>
          <p class="view-subtitle">Catatan kehadiran dan jam kerja Anda (WITA)</p>
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
      <div id="history-list" class="history-cards-list hidden"></div>

      <!-- Empty State -->
      <div id="history-empty" class="empty-state hidden">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h4 class="empty-title">Tidak Ada Riwayat</h4>
        <p class="empty-desc">Belum ada catatan absensi untuk bulan yang dipilih.</p>
      </div>
    </div>
  `;

  const loadingEl = container.querySelector("#history-loading");
  const listEl = container.querySelector("#history-list");
  const emptyEl = container.querySelector("#history-empty");
  const monthFilter = container.querySelector("#history-month-filter");

  // Default month filter to current year-month in WITA
  monthFilter.value = getWitaCurrentMonthStr();

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
      filtered = allRecords.filter((r) => (r.date || "").startsWith(selectedMonth));
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
            openPhotoModal(item.checkinphotopath, `Foto Masuk - ${formatIndoDateWita(item.date)}`);
          });
        }
      }
      if (item.checkoutphotopath) {
        const outBtn = listEl.querySelector(`#photo-out-${item.id}`);
        if (outBtn) {
          outBtn.addEventListener("click", () => {
            openPhotoModal(item.checkoutphotopath, `Foto Pulang - ${formatIndoDateWita(item.date)}`);
          });
        }
      }
    });
  }

  monthFilter.addEventListener("change", applyFilter);

  await loadHistory();
}

function renderHistoryCard(item) {
  const inTimeStr = item.checkintime ? formatTimeWita(item.checkintime) : "--:--";
  const outTimeStr = item.checkouttime ? formatTimeWita(item.checkouttime) : "--:--";
  const durationStr = calculateWorkDuration(item.checkintime, item.checkouttime);

  const statusObj = getStatusBadge(item.attendancestatus);

  return `
    <div class="card history-item-card">
      <div class="history-item-top">
        <div class="history-date-box">
          <span class="history-day">${getDayOfWeekWita(item.date)}</span>
          <span class="history-full-date">${formatIndoDateWita(item.date)}</span>
        </div>
        <div class="history-badges">
          <span class="badge ${statusObj.badgeClass}">${statusObj.label}</span>
          <span class="badge badge-outline">${escapeHtml(item.shiftname || "Shift")}</span>
        </div>
      </div>

      <div class="history-times-grid">
        <div class="time-col">
          <span class="col-lbl">Masuk (WITA)</span>
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
          <span class="col-lbl">Pulang (WITA)</span>
          <span class="col-val">${outTimeStr}</span>
          ${item.checkoutphotopath ? `
            <button id="photo-out-${item.id}" class="btn-thumb-photo" title="Lihat Foto Pulang">
              <img src="${item.checkoutphotopath}" alt="Foto Pulang" class="mini-thumb" />
            </button>
          ` : ""}
        </div>

        <div class="time-divider-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <div class="time-col">
          <span class="col-lbl">Durasi</span>
          <span class="col-val duration-val">${durationStr}</span>
        </div>
      </div>

      <div class="history-item-footer">
        <div class="history-loc-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${item.locationstatus === "inside" ? "Dalam Radius Kantor" : "Luar Radius Kantor"}</span>
          ${item.distancefromoffice != null ? `<span class="text-muted">(${item.distancefromoffice}m)</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function getStatusBadge(status) {
  switch (status) {
    case "present":
      return { label: "Tepat Waktu", badgeClass: "badge-success" };
    case "late_":
      return { label: "Terlambat", badgeClass: "badge-warning" };
    case "earlyLeave":
      return { label: "Pulang Awal", badgeClass: "badge-warning" };
    case "permit":
      return { label: "📋 Izin", badgeClass: "badge-info" };
    case "absent":
      return { label: "❌ Tidak Hadir", badgeClass: "badge-danger" };
    default:
      return { label: "Hadir", badgeClass: "badge-success" };
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

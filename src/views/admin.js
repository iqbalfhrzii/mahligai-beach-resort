import * as XLSX from "xlsx";
import { getAllAttendances, deleteAttendancesByMonth } from "../services/attendance.js";
import { openPhotoModal } from "../components/photo-modal.js";
import { showToast } from "../components/toast.js";

export async function renderAdminView(container, user) {
  if (user.role !== "admin") {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚫</div>
        <h3>Akses Terbatas</h3>
        <p>Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="admin-view-wrapper animate-fade-in">
      <!-- Header -->
      <div class="view-header-row">
        <div>
          <h2 class="view-title">Laporan & Rekap Absensi</h2>
          <p class="view-subtitle">Kelola dan ekspor data kehadiran seluruh karyawan</p>
        </div>
      </div>

      <!-- Controls Row: Month, Search, Export, Delete -->
      <div class="admin-controls-card card">
        <div class="controls-grid">
          <div class="form-group mb-0">
            <label class="form-label-sm">Filter Bulan</label>
            <input type="month" id="admin-month-filter" class="form-input form-input-sm" />
          </div>

          <div class="form-group mb-0">
            <label class="form-label-sm">Cari Karyawan</label>
            <input type="text" id="admin-search-input" class="form-input form-input-sm" placeholder="Ketik nama karyawan..." />
          </div>

          <div class="controls-buttons-group">
            <button id="export-excel-btn" class="btn btn-success btn-sm">
              📊 Ekspor ke Excel (.xlsx)
            </button>
            <button id="delete-month-btn" class="btn btn-outline-danger btn-sm">
              🗑️ Hapus Data Bulan Ini
            </button>
          </div>
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="admin-metrics-grid">
        <div class="metric-card card">
          <span class="metric-title">Total Absensi</span>
          <span class="metric-value" id="metric-total">0</span>
        </div>
        <div class="metric-card card">
          <span class="metric-title">Tepat Waktu</span>
          <span class="metric-value text-success" id="metric-present">0</span>
        </div>
        <div class="metric-card card">
          <span class="metric-title">Terlambat</span>
          <span class="metric-value text-warning" id="metric-late">0</span>
        </div>
      </div>

      <!-- Loading State -->
      <div id="admin-loading" class="loading-state">
        <div class="spinner"></div>
        <span>Memuat data rekap karyawan...</span>
      </div>

      <!-- Table Container -->
      <div id="admin-table-container" class="card admin-table-card hidden">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Karyawan</th>
                <th>Shift</th>
                <th>Masuk</th>
                <th>Pulang</th>
                <th>Status</th>
                <th>Foto</th>
              </tr>
            </thead>
            <tbody id="admin-table-body"></tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div id="admin-empty" class="empty-state hidden">
        <div class="empty-icon">📑</div>
        <h3>Tidak Ada Data Absensi</h3>
        <p>Tidak ditemukan rekaman absensi untuk kriteria pencarian ini.</p>
      </div>
    </div>
  `;

  const monthFilter = container.querySelector("#admin-month-filter");
  const searchInput = container.querySelector("#admin-search-input");
  const exportBtn = container.querySelector("#export-excel-btn");
  const deleteBtn = container.querySelector("#delete-month-btn");
  const loadingEl = container.querySelector("#admin-loading");
  const tableContainer = container.querySelector("#admin-table-container");
  const tableBody = container.querySelector("#admin-table-body");
  const emptyEl = container.querySelector("#admin-empty");
  const metricTotal = container.querySelector("#metric-total");
  const metricPresent = container.querySelector("#metric-present");
  const metricLate = container.querySelector("#metric-late");

  // Default month filter
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  monthFilter.value = currentYm;

  let records = [];

  async function loadData() {
    loadingEl.classList.remove("hidden");
    tableContainer.classList.add("hidden");
    emptyEl.classList.add("hidden");

    try {
      records = await getAllAttendances(monthFilter.value);
      renderTable();
    } catch (err) {
      showToast(err.message || "Gagal memuat rekap.", "error");
    } finally {
      loadingEl.classList.add("hidden");
    }
  }

  function renderTable() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = records;

    if (query) {
      filtered = filtered.filter(
        (r) => (r.employeename || "").toLowerCase().includes(query)
      );
    }

    // Update Metrics
    metricTotal.textContent = filtered.length;
    metricPresent.textContent = filtered.filter((r) => r.attendancestatus === "present").length;
    metricLate.textContent = filtered.filter((r) => r.attendancestatus === "late_").length;

    if (filtered.length === 0) {
      tableContainer.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    tableContainer.classList.remove("hidden");

    tableBody.innerHTML = filtered.map((r) => {
      const inTime = r.checkintime ? formatTimeOnly(r.checkintime) : "--:--";
      const outTime = r.checkouttime ? formatTimeOnly(r.checkouttime) : "--:--";
      const statusBadge = getStatusBadge(r.attendancestatus);

      return `
        <tr>
          <td>
            <div class="fw-semibold">${formatIndoDate(r.date)}</div>
          </td>
          <td>
            <div class="fw-bold">${escapeHtml(r.employeename || "-")}</div>
          </td>
          <td>
            <span class="badge badge-outline">${escapeHtml(r.shiftname || "-")}</span>
          </td>
          <td><span class="font-mono">${inTime}</span></td>
          <td><span class="font-mono">${outTime}</span></td>
          <td>
            <span class="badge ${statusBadge.badgeClass}">${statusBadge.label}</span>
          </td>
          <td>
            <div class="photo-actions-cell">
              ${r.checkinphotopath ? `
                <button class="btn-table-photo" id="adm-photo-in-${r.id}" title="Foto Masuk">
                  📸 Masuk
                </button>
              ` : ""}
              ${r.checkoutphotopath ? `
                <button class="btn-table-photo" id="adm-photo-out-${r.id}" title="Foto Pulang">
                  📸 Pulang
                </button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach photo listeners
    filtered.forEach((r) => {
      if (r.checkinphotopath) {
        const btn = tableBody.querySelector(`#adm-photo-in-${r.id}`);
        if (btn) btn.onclick = () => openPhotoModal(r.checkinphotopath, `Foto Masuk: ${r.employeename}`);
      }
      if (r.checkoutphotopath) {
        const btn = tableBody.querySelector(`#adm-photo-out-${r.id}`);
        if (btn) btn.onclick = () => openPhotoModal(r.checkoutphotopath, `Foto Pulang: ${r.employeename}`);
      }
    });
  }

  // Export to Excel (.xlsx)
  exportBtn.addEventListener("click", () => {
    if (records.length === 0) {
      showToast("Tidak ada data untuk diekspor.", "warning");
      return;
    }

    try {
      const exportData = records.map((r, index) => ({
        "No": index + 1,
        "Tanggal": r.date,
        "Nama Karyawan": r.employeename,
        "Shift": r.shiftname,
        "Jam Masuk": r.checkintime ? new Date(r.checkintime).toLocaleTimeString("id-ID") : "-",
        "Jam Pulang": r.checkouttime ? new Date(r.checkouttime).toLocaleTimeString("id-ID") : "-",
        "Status Kehadiran": r.attendancestatus === "present" ? "Hadir" : (r.attendancestatus === "late_" ? "Terlambat" : r.attendancestatus),
        "Status Lokasi": r.locationstatus === "inside" ? "Di Dalam Area" : "Di Luar Area",
        "Jarak (m)": r.distancefromoffice || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");

      const selectedMonth = monthFilter.value || "Semua";
      const fileName = `Rekap_Absensi_Mahligai_${selectedMonth}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      showToast("Berhasil mengekspor file Excel!", "success");
    } catch (err) {
      showToast("Gagal mengekspor: " + err.message, "error");
    }
  });

  // Delete Month Attendances
  deleteBtn.addEventListener("click", async () => {
    const ym = monthFilter.value;
    if (!ym) {
      showToast("Pilih bulan yang ingin dihapus.", "warning");
      return;
    }

    const [year, month] = ym.split("-").map(Number);
    const confirm1 = confirm(`⚠️ PERINGATAN BAHAYA:\nApakah Anda yakin ingin MENGHAPUS SEMUA data absensi & foto untuk bulan ${ym}?`);
    if (!confirm1) return;

    const confirm2 = confirm(`Konfirmasi terakhir: Tindakan ini tidak dapat dibatalkan. Lanjutkan hapus bulan ${ym}?`);
    if (!confirm2) return;

    deleteBtn.disabled = true;
    showToast("Menghapus data...", "info");

    try {
      await deleteAttendancesByMonth(year, month);
      showToast(`Data absensi bulan ${ym} berhasil dihapus.`, "success");
      await loadData();
    } catch (err) {
      showToast(err.message || "Gagal menghapus riwayat.", "error");
    } finally {
      deleteBtn.disabled = false;
    }
  });

  monthFilter.addEventListener("change", loadData);
  searchInput.addEventListener("input", renderTable);

  await loadData();
}

function getStatusBadge(status) {
  switch (status) {
    case "present":
      return { label: "Hadir", badgeClass: "badge-success" };
    case "late_":
      return { label: "Terlambat", badgeClass: "badge-warning" };
    case "earlyLeave":
      return { label: "Pulang Awal", badgeClass: "badge-warning" };
    default:
      return { label: status || "-", badgeClass: "badge-outline" };
  }
}

function formatTimeOnly(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatIndoDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

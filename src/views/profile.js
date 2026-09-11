import { logout, changePassword } from "../services/auth.js";
import { showToast } from "../components/toast.js";

export function renderProfileView(container, user, onLogoutSuccess) {
  const initials = getInitials(user.fullname || "User");
  const roleLabel = user.role === "admin" ? "Administrator" : (user.role === "casual" ? "Casual" : "Karyawan");

  container.innerHTML = `
    <div class="profile-view-wrapper animate-fade-in">
      <!-- Profile Card -->
      <section class="card profile-hero-card">
        <div class="profile-avatar-large">${initials}</div>
        <h2 class="profile-name">${escapeHtml(user.fullname)}</h2>
        <span class="badge badge-primary profile-role-pill">${roleLabel}</span>
        
        <div class="profile-details-list">
          <div class="profile-detail-item">
            <span class="detail-label">Kode Karyawan</span>
            <span class="detail-val font-mono">${escapeHtml(user.employeecode || "-")}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-val">${escapeHtml(user.email || "-")}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label">Bergabung Sejak</span>
            <span class="detail-val">${formatJoinDate(user.createdat)}</span>
          </div>
        </div>
      </section>

      <!-- iOS Safari PWA Guide Card -->
      <section class="card ios-guide-card">
        <div class="card-header">
          <div class="card-header-icon apple-icon-bg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.77 1.04-1.85.93-2.93-1 .04-2.17.67-2.85 1.46-.57.65-1.07 1.73-.93 2.78 1.11.09 2.23-.55 2.85-1.31z"/>
            </svg>
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Gunakan Seperti Aplikasi iPhone</h3>
            <span class="card-subtitle">Panduan Tambahkan ke Layar Utama</span>
          </div>
        </div>
        <div class="ios-guide-body">
          <ol class="ios-steps-list">
            <li>Buka website ini di <strong>Safari</strong> iPhone.</li>
            <li>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak panah ke atas di bilah bawah Safari).</li>
            <li>Pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
            <li>Buka dari layar iPhone Anda untuk pengalaman fullscreen tanpa bar alamat!</li>
          </ol>
        </div>
      </section>

      <!-- Change Password Section -->
      <section class="card change-password-card">
        <div class="card-header">
          <div class="card-header-icon key-icon-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-2-2l2 2m0 0l-5 5-2-2-4 4 2 2-3 3-2-2-3 3 2 2-2 2H3v-3l8-8 2 2 4-4-2-2 5-5z"/>
            </svg>
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Ganti Kata Sandi</h3>
            <span class="card-subtitle">Perbarui keamanan akun Anda</span>
          </div>
        </div>

        <form id="change-pass-form" class="change-pass-form">
          <div class="form-group">
            <label for="current-pass-input" class="form-label">Kata Sandi Saat Ini</label>
            <input type="password" id="current-pass-input" class="form-input" required placeholder="Masukkan kata sandi lama" />
          </div>

          <div class="form-group">
            <label for="new-pass-input" class="form-label">Kata Sandi Baru</label>
            <input type="password" id="new-pass-input" class="form-input" required minlength="6" placeholder="Minimal 6 karakter" />
          </div>

          <div class="form-group">
            <label for="confirm-pass-input" class="form-label">Konfirmasi Kata Sandi Baru</label>
            <input type="password" id="confirm-pass-input" class="form-input" required minlength="6" placeholder="Ulangi kata sandi baru" />
          </div>

          <button type="submit" id="submit-change-pass-btn" class="btn btn-primary btn-block">
            <span class="btn-text">Simpan Kata Sandi Baru</span>
            <div class="btn-spinner hidden"></div>
          </button>
        </form>
      </section>

      <!-- Logout Action -->
      <section class="logout-section">
        <button type="button" id="logout-btn" class="btn btn-danger btn-block btn-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Keluar dari Akun</span>
        </button>
      </section>

      <div class="profile-version-footer">
        <p>Mahligai Attendance Web v1.0.0</p>
        <p>Aplikasi Absensi Karyawan berbasis Geolocation & Selfie</p>
      </div>
    </div>
  `;

  // Change Password logic
  const form = container.querySelector("#change-pass-form");
  const currentPassInput = container.querySelector("#current-pass-input");
  const newPassInput = container.querySelector("#new-pass-input");
  const confirmPassInput = container.querySelector("#confirm-pass-input");
  const submitBtn = container.querySelector("#submit-change-pass-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cur = currentPassInput.value;
    const next = newPassInput.value;
    const confirm = confirmPassInput.value;

    if (next !== confirm) {
      showToast("Konfirmasi kata sandi baru tidak cocok.", "error");
      return;
    }

    if (next.length < 6) {
      showToast("Kata sandi baru minimal 6 karakter.", "warning");
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = "Menyimpan...";
    btnSpinner.classList.remove("hidden");

    try {
      await changePassword(cur, next);
      showToast("Kata sandi berhasil diperbarui!", "success");
      form.reset();
    } catch (err) {
      showToast(err.message || "Gagal mengubah kata sandi.", "error");
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = "Simpan Kata Sandi Baru";
      btnSpinner.classList.add("hidden");
    }
  });

  // Logout with custom in-app confirmation modal
  const logoutBtn = container.querySelector("#logout-btn");
  logoutBtn.addEventListener("click", () => {
    showLogoutConfirmModal(async () => {
      try {
        await logout();
        showToast("Berhasil keluar dari akun.", "info");
        onLogoutSuccess();
      } catch (err) {
        showToast(err.message || "Gagal keluar.", "error");
      }
    });
  });
}

function showLogoutConfirmModal(onConfirm) {
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;

  const overlay = document.createElement("div");
  overlay.className = "logout-modal-overlay animate-fade-in";
  overlay.innerHTML = `
    <div class="logout-modal-card animate-scale-up">
      <div class="logout-modal-icon">🚪</div>
      <h3 class="logout-modal-title">Keluar dari Akun?</h3>
      <p class="logout-modal-desc">Anda akan keluar dari sesi akun ini dan kembali ke halaman login.</p>
      <div class="logout-modal-actions">
        <button type="button" id="cancel-logout-btn" class="btn btn-secondary">Batal</button>
        <button type="button" id="confirm-logout-btn" class="btn btn-danger">Ya, Keluar</button>
      </div>
    </div>
  `;

  modalContainer.appendChild(overlay);

  const close = () => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
  };

  overlay.querySelector("#cancel-logout-btn").onclick = close;
  overlay.querySelector("#confirm-logout-btn").onclick = async () => {
    close();
    await onConfirm();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

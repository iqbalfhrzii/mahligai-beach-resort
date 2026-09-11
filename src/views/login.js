import { login } from "../services/auth.js";
import { showToast } from "../components/toast.js";

export function renderLoginView(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-view-wrapper">
      <div class="login-card animate-scale-up">
        <!-- Logo & Branding -->
        <div class="login-brand-section">
          <div class="login-logo-glow">
            <img src="/img/logoMahligai.png" alt="Mahligai Beach Resort" class="login-brand-logo" />
          </div>
          <h1 class="login-title">Mahligai Attendance</h1>
          <p class="login-subtitle">Portal Absensi Karyawan Mahligai Beach Resort</p>
        </div>

        <!-- Form -->
        <form id="login-form" class="login-form">
          <div id="login-alert" class="alert alert-error hidden"></div>

          <div class="form-group">
            <label for="login-email" class="form-label">Email Perusahaan</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                type="email"
                id="login-email"
                class="form-input"
                placeholder="nama@perusahaan.com"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">Kata Sandi</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="password"
                id="login-password"
                class="form-input"
                placeholder="Masukkan kata sandi"
                required
                autocomplete="current-password"
              />
              <button type="button" id="toggle-password-btn" class="input-action-btn" title="Lihat password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block btn-lg">
            <span class="btn-text">Masuk</span>
            <div class="btn-spinner hidden"></div>
          </button>
        </form>

        <div class="login-footer">
          <p class="login-footer-hint">
            💡 Versi Web Khusus Karyawan & Pengguna iOS Safari
          </p>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector("#login-form");
  const emailInput = container.querySelector("#login-email");
  const passwordInput = container.querySelector("#login-password");
  const togglePassBtn = container.querySelector("#toggle-password-btn");
  const submitBtn = container.querySelector("#login-submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  const alertEl = container.querySelector("#login-alert");

  // Toggle password visibility
  togglePassBtn.addEventListener("click", () => {
    const isPass = passwordInput.type === "password";
    passwordInput.type = isPass ? "text" : "password";
  });

  // Handle Login Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertEl.classList.add("hidden");
    alertEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alertEl.textContent = "Silakan isi email dan kata sandi.";
      alertEl.classList.remove("hidden");
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    btnText.textContent = "Memverifikasi...";
    btnSpinner.classList.remove("hidden");

    try {
      const user = await login(email, password);
      showToast(`Selamat datang kembali, ${user.fullname}!`, "success");
      onLoginSuccess(user);
    } catch (err) {
      alertEl.textContent = err.message || "Gagal masuk.";
      alertEl.classList.remove("hidden");
      showToast(err.message || "Gagal masuk.", "error");
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = "Masuk";
      btnSpinner.classList.add("hidden");
    }
  });
}

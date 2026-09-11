/**
 * Navigation Bar Component (Top Header & iOS Bottom Tab Bar)
 */
export function renderHeader(user) {
  const initials = user ? getInitials(user.fullname || "User") : "U";
  const roleLabel = user?.role === "admin" ? "Admin" : (user?.role === "casual" ? "Casual" : "Karyawan");

  return `
    <header class="app-header">
      <div class="header-content">
        <div class="header-brand">
          <div class="brand-logo-wrapper">
            <img src="/img/logoMahligai.png" alt="Logo Mahligai" class="brand-logo-img" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Mahligai</h1>
            <span class="brand-subtitle">Attendance</span>
          </div>
        </div>

        <button id="header-profile-btn" class="header-user-btn" title="Lihat Profil">
          <div class="user-meta">
            <span class="user-name">${escapeHtml(user?.fullname || "Pengguna")}</span>
            <span class="user-role-badge badge-${user?.role || "employee"}">${roleLabel}</span>
          </div>
          <div class="user-avatar">${initials}</div>
        </button>
      </div>
    </header>
  `;
}

export function renderBottomNav(activeTab = "home", isAdmin = false) {
  return `
    <nav class="bottom-nav">
      <div class="nav-items-container">
        <button class="nav-tab ${activeTab === "home" ? "active" : ""}" data-tab="home">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="nav-label">Absen</span>
        </button>

        <button class="nav-tab ${activeTab === "history" ? "active" : ""}" data-tab="history">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span class="nav-label">Riwayat</span>
        </button>

        ${isAdmin ? `
        <button class="nav-tab ${activeTab === "admin" ? "active" : ""}" data-tab="admin">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <span class="nav-label">Laporan</span>
        </button>
        ` : ""}

        <button class="nav-tab ${activeTab === "profile" ? "active" : ""}" data-tab="profile">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="nav-label">Profil</span>
        </button>
      </div>
    </nav>
  `;
}

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

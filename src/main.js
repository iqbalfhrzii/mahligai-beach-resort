import "./style.css";
import { getCurrentUser, setCachedUser } from "./services/auth.js";
import { renderHeader, renderBottomNav } from "./components/navbar.js";
import { renderLoginView } from "./views/login.js";
import { renderHomeView } from "./views/home.js";
import { renderHistoryView } from "./views/history.js";
import { renderProfileView } from "./views/profile.js";
import { renderAdminView } from "./views/admin.js";

const app = document.getElementById("app");
let currentTab = "home";
let activeUser = null;

async function init() {
  // Show initial loading splash with official Mahligai logo
  app.innerHTML = `
    <div class="app-splash-screen animate-fade-in">
      <div class="splash-logo-wrapper">
        <img src="/img/logoMahligai.png" alt="Mahligai Beach Resort" class="splash-logo-img" />
      </div>
      <h1 class="splash-title">Mahligai</h1>
      <p class="splash-subtitle">Attendance Made Simple</p>
      <div class="spinner-sm mt-4"></div>
    </div>
  `;

  try {
    const user = await getCurrentUser();
    if (user) {
      activeUser = user;
      renderAppLayout();
    } else {
      renderAuthFlow();
    }
  } catch (err) {
    console.error("Init auth error:", err);
    renderAuthFlow();
  }
}

function renderAuthFlow() {
  activeUser = null;
  renderLoginView(app, (loggedInUser) => {
    activeUser = loggedInUser;
    setCachedUser(loggedInUser);
    currentTab = "home";
    renderAppLayout();
  });
}

function renderAppLayout() {
  const isAdmin = activeUser.role === "admin";

  app.innerHTML = `
    <div class="app-layout">
      ${renderHeader(activeUser)}
      
      <main id="view-content" class="main-content-viewport"></main>
      
      ${renderBottomNav(currentTab, isAdmin)}
    </div>
  `;

  // Attach Top Header Profile click
  const headerProfileBtn = app.querySelector("#header-profile-btn");
  if (headerProfileBtn) {
    headerProfileBtn.addEventListener("click", () => switchTab("profile"));
  }

  // Attach Bottom Nav Tab clicks
  const navTabs = app.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Render current tab view
  renderCurrentView();
}

function switchTab(tabName) {
  if (currentTab === tabName) return;
  currentTab = tabName;

  // Update active state in bottom nav
  const navTabs = app.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => {
    if (tab.getAttribute("data-tab") === tabName) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  renderCurrentView();
}

function renderCurrentView() {
  const container = document.getElementById("view-content");
  if (!container) return;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (currentTab === "home") {
    renderHomeView(container, activeUser);
  } else if (currentTab === "history") {
    renderHistoryView(container, activeUser);
  } else if (currentTab === "profile") {
    renderProfileView(container, activeUser, () => renderAuthFlow());
  } else if (currentTab === "admin") {
    renderAdminView(container, activeUser);
  }
}

// Start application
init();

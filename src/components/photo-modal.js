/**
 * Simple Lightbox Modal to preview attendance selfie photo
 */
export function openPhotoModal(imageUrl, title = "Foto Absensi") {
  const container = document.getElementById("modal-container");
  if (!container) return;

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "photo-modal-overlay animate-fade-in";

  modalOverlay.innerHTML = `
    <div class="photo-modal-card">
      <div class="photo-modal-header">
        <h3 class="photo-modal-title">${title}</h3>
        <button id="close-photo-btn" class="icon-close-btn" title="Tutup">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="photo-modal-body">
        <img src="${imageUrl}" alt="${title}" class="photo-modal-img" />
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector("#close-photo-btn");
  const close = () => {
    if (modalOverlay.parentElement) {
      modalOverlay.parentElement.removeChild(modalOverlay);
    }
  };

  closeBtn.addEventListener("click", close);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) close();
  });
}

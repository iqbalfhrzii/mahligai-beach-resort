/**
 * Camera Modal Component for Selfie Attendance
 * Highly optimized for iOS Safari & Web Browsers
 */
export function openCameraModal({ title = "Ambil Foto Selfie", onCapture, onCancel }) {
  const container = document.getElementById("modal-container");
  if (!container) return;

  let currentStream = null;
  let currentFacingMode = "user"; // front camera
  let capturedBlob = null;

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "camera-modal-overlay animate-fade-in";

  modalOverlay.innerHTML = `
    <div class="camera-modal-content">
      <!-- Header -->
      <div class="camera-header">
        <h2 class="camera-title">${title}</h2>
        <button id="close-camera-btn" class="icon-close-btn" title="Tutup">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Viewfinder Container -->
      <div class="viewfinder-wrapper">
        <div class="viewfinder-box">
          <video id="camera-video" class="camera-video" playsinline autoplay muted></video>
          <img id="camera-preview-img" class="camera-preview-img hidden" alt="Pratinjau Selfie" />
          <canvas id="camera-canvas" class="hidden"></canvas>
          
          <!-- Viewfinder Guideline Overlay -->
          <div id="viewfinder-guide" class="viewfinder-guide">
            <div class="face-guide-oval"></div>
            <p class="guide-text">Posisikan wajah Anda di dalam lingkaran</p>
          </div>

          <!-- Loading Spinner -->
          <div id="camera-loading" class="camera-loading">
            <div class="spinner"></div>
            <span>Menghubungkan ke kamera...</span>
          </div>

          <!-- Shutter Flash Effect -->
          <div id="camera-flash" class="camera-flash hidden"></div>
        </div>
      </div>

      <!-- Fallback info if camera is not allowed -->
      <div id="camera-error-banner" class="camera-error-banner hidden">
        <p>Akses kamera streaming tidak diizinkan atau tidak didukung.</p>
        <button id="trigger-file-capture-btn" class="btn btn-secondary btn-sm">
          📸 Buka Kamera Bawaan iPhone
        </button>
      </div>

      <!-- Hidden native file input fallback (works 100% on all iOS versions) -->
      <input type="file" id="native-camera-input" accept="image/*" capture="user" class="hidden" />

      <!-- Controls -->
      <div class="camera-controls">
        <!-- Live Camera Controls -->
        <div id="live-controls" class="controls-row">
          <button id="flip-camera-btn" class="control-btn" title="Ganti Kamera">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 16v4h-4M4 8V4h4"/>
              <path d="M4 16a8 8 0 0 1 14.14-5.36L20 12M20 8a8 8 0 0 1-14.14 5.36L4 12"/>
            </svg>
          </button>

          <button id="shutter-btn" class="shutter-button" title="Jepret Foto">
            <div class="shutter-inner"></div>
          </button>

          <button id="native-fallback-icon-btn" class="control-btn" title="Kamera Bawaan">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>

        <!-- Preview Controls (After photo is taken) -->
        <div id="preview-controls" class="controls-preview hidden">
          <button id="retake-photo-btn" class="btn btn-outline">
            🔄 Foto Ulang
          </button>
          <button id="confirm-photo-btn" class="btn btn-primary">
            ✓ Gunakan Foto Ini
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const video = modalOverlay.querySelector("#camera-video");
  const previewImg = modalOverlay.querySelector("#camera-preview-img");
  const canvas = modalOverlay.querySelector("#camera-canvas");
  const loading = modalOverlay.querySelector("#camera-loading");
  const guide = modalOverlay.querySelector("#viewfinder-guide");
  const flash = modalOverlay.querySelector("#camera-flash");
  const errorBanner = modalOverlay.querySelector("#camera-error-banner");
  const liveControls = modalOverlay.querySelector("#live-controls");
  const previewControls = modalOverlay.querySelector("#preview-controls");
  const shutterBtn = modalOverlay.querySelector("#shutter-btn");
  const flipBtn = modalOverlay.querySelector("#flip-camera-btn");
  const retakeBtn = modalOverlay.querySelector("#retake-photo-btn");
  const confirmBtn = modalOverlay.querySelector("#confirm-photo-btn");
  const nativeInput = modalOverlay.querySelector("#native-camera-input");
  const fallbackBtn = modalOverlay.querySelector("#trigger-file-capture-btn");
  const fallbackIconBtn = modalOverlay.querySelector("#native-fallback-icon-btn");
  const closeBtn = modalOverlay.querySelector("#close-camera-btn");

  // Start video stream
  async function startCamera(facingMode = "user") {
    stopCamera();
    loading.classList.remove("hidden");
    errorBanner.classList.add("hidden");

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = currentStream;
      await video.play();

      loading.classList.add("hidden");
      currentFacingMode = facingMode;

      // Mirror front camera video for natural selfie feel
      if (facingMode === "user") {
        video.classList.add("mirror-video");
      } else {
        video.classList.remove("mirror-video");
      }
    } catch (err) {
      console.warn("getUserMedia failed, using fallback:", err);
      loading.classList.add("hidden");
      errorBanner.classList.remove("hidden");
    }
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      currentStream = null;
    }
  }

  function closeModal() {
    stopCamera();
    if (modalOverlay.parentElement) {
      modalOverlay.parentElement.removeChild(modalOverlay);
    }
    if (onCancel) onCancel();
  }

  // Take photo from video stream
  function captureSnapshot() {
    if (!video.videoWidth || !video.videoHeight) return;

    // Trigger flash animation
    flash.classList.remove("hidden");
    setTimeout(() => flash.classList.add("hidden"), 150);

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (currentFacingMode === "user") {
      // Mirror the canvas for natural selfie image
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedBlob = blob;
        const imageUrl = URL.createObjectURL(blob);

        // Show preview
        previewImg.src = imageUrl;
        previewImg.classList.remove("hidden");
        video.classList.add("hidden");
        guide.classList.add("hidden");

        liveControls.classList.add("hidden");
        previewControls.classList.remove("hidden");

        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  }

  // Handle native file input fallback (iOS camera app)
  nativeInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    capturedBlob = file;
    const imageUrl = URL.createObjectURL(file);

    previewImg.src = imageUrl;
    previewImg.classList.remove("hidden");
    video.classList.add("hidden");
    guide.classList.add("hidden");
    loading.classList.add("hidden");
    errorBanner.classList.add("hidden");

    liveControls.classList.add("hidden");
    previewControls.classList.remove("hidden");

    stopCamera();
  });

  // Retake photo
  retakeBtn.addEventListener("click", () => {
    capturedBlob = null;
    previewImg.classList.add("hidden");
    video.classList.remove("hidden");
    guide.classList.remove("hidden");

    previewControls.classList.add("hidden");
    liveControls.classList.remove("hidden");

    startCamera(currentFacingMode);
  });

  // Confirm photo
  confirmBtn.addEventListener("click", () => {
    if (!capturedBlob) return;
    const blobToPass = capturedBlob;
    closeModal();
    if (onCapture) onCapture(blobToPass);
  });

  // Event Listeners
  shutterBtn.addEventListener("click", captureSnapshot);

  flipBtn.addEventListener("click", () => {
    const nextMode = currentFacingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  });

  fallbackBtn?.addEventListener("click", () => nativeInput.click());
  fallbackIconBtn?.addEventListener("click", () => nativeInput.click());
  closeBtn.addEventListener("click", closeModal);

  // Initialize camera
  startCamera("user");
}

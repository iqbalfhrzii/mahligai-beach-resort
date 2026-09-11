import L from "leaflet";

let activeMap = null;

export function initMapCard(containerId, office, userLocation, isInside) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Cleanup old map if exists
  if (activeMap) {
    activeMap.remove();
    activeMap = null;
  }

  // Center between office and user, or at office
  const centerLat = userLocation ? (office.latitude + userLocation.latitude) / 2 : office.latitude;
  const centerLng = userLocation ? (office.longitude + userLocation.longitude) / 2 : office.longitude;

  activeMap = L.map(containerId, {
    zoomControl: false,
    attributionControl: false,
  }).setView([centerLat, centerLng], 17);

  // Modern clean dark-themed or light-themed carto tiles
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd",
  }).addTo(activeMap);

  // Office Marker (Building icon)
  const officeIcon = L.divIcon({
    className: "custom-map-icon office-marker",
    html: `
      <div class="marker-pin office-pin">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const officeMarker = L.marker([office.latitude, office.longitude], { icon: officeIcon }).addTo(activeMap);
  officeMarker.bindPopup(`<b>${office.name}</b><br>Radius: ${office.radiusmeter}m`);

  // Radius Circle
  const circleColor = isInside ? "#10B981" : "#EF4444";
  const circleFill = isInside ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)";

  const circle = L.circle([office.latitude, office.longitude], {
    radius: office.radiusmeter,
    color: circleColor,
    weight: 2,
    dashArray: isInside ? null : "4, 4",
    fillColor: circleFill,
    fillOpacity: 1,
  }).addTo(activeMap);

  // User Marker
  if (userLocation) {
    const userIcon = L.divIcon({
      className: "custom-map-icon user-marker",
      html: `
        <div class="marker-pulse-container">
          <div class="marker-pulse"></div>
          <div class="marker-dot"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(activeMap);
    userMarker.bindPopup("<b>Posisi Anda Saat Ini</b>");

    // Fit bounds to include office, user, and radius
    const group = L.featureGroup([officeMarker, circle, userMarker]);
    activeMap.fitBounds(group.getBounds().pad(0.2));
  } else {
    activeMap.fitBounds(circle.getBounds().pad(0.3));
  }

  // Trigger leaflet resize to ensure correct rendering in modal/card
  setTimeout(() => {
    if (activeMap) activeMap.invalidateSize();
  }, 200);

  return activeMap;
}

export function destroyMap() {
  if (activeMap) {
    activeMap.remove();
    activeMap = null;
  }
}

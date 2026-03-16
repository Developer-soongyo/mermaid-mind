// ---------------------------------------------------------------------------
// Presentation mode
// ---------------------------------------------------------------------------
const ppz = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
let presZoomTimeout = null;
let presSvgNaturalW = 0;
let presSvgNaturalH = 0;

function applyPresTransform() {
  const canvas = document.getElementById("presCanvas");
  canvas.style.transform = `translate(${ppz.x}px, ${ppz.y}px) scale(${ppz.scale})`;
  const el = document.getElementById("presZoomIndicator");
  el.textContent = Math.round(ppz.scale * 100) + "%";
  el.classList.add("visible");
  clearTimeout(presZoomTimeout);
  presZoomTimeout = setTimeout(() => el.classList.remove("visible"), 1200);
}

function enterPresentation() {
  const srcSvg = document.querySelector("#previewCanvas svg");
  if (!srcSvg) return;

  const overlay = document.getElementById("presentationOverlay");
  const canvas = document.getElementById("presCanvas");

  // Clone SVG
  const clone = srcSvg.cloneNode(true);

  // Determine natural size from the source SVG
  const vb = clone.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    presSvgNaturalW = vb.width;
    presSvgNaturalH = vb.height;
  } else {
    // Use the original SVG's rendered size before we modify anything
    const origRect = srcSvg.getBoundingClientRect();
    presSvgNaturalW = parseFloat(srcSvg.getAttribute("width")) || origRect.width || 600;
    presSvgNaturalH = parseFloat(srcSvg.getAttribute("height")) || origRect.height || 400;
  }

  // Set explicit pixel dimensions on the clone so it has a known size
  clone.removeAttribute("style");
  clone.setAttribute("width", presSvgNaturalW);
  clone.setAttribute("height", presSvgNaturalH);

  canvas.innerHTML = "";
  canvas.appendChild(clone);

  const name = document.getElementById("diagramNameDisplay").textContent;
  document.getElementById("presentationTitle").textContent = name || "Untitled Diagram";

  // Reset transform
  ppz.scale = 1; ppz.x = 0; ppz.y = 0;
  canvas.style.transform = "";
  canvas.style.transformOrigin = "0 0";

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Fit after overlay is visible and laid out
  setTimeout(() => presFit(), 50);
}

function exitPresentation() {
  document.getElementById("presentationOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

function presFit() {
  const wrap = document.getElementById("presCanvasWrap");
  const wrapRect = wrap.getBoundingClientRect();

  if (presSvgNaturalW <= 0 || presSvgNaturalH <= 0) return;

  const padding = 80;
  const availW = wrapRect.width - padding;
  const availH = wrapRect.height - padding;

  // Scale to fit
  ppz.scale = Math.min(availW / presSvgNaturalW, availH / presSvgNaturalH);

  // Center
  const scaledW = presSvgNaturalW * ppz.scale;
  const scaledH = presSvgNaturalH * ppz.scale;
  ppz.x = (wrapRect.width - scaledW) / 2;
  ppz.y = (wrapRect.height - scaledH) / 2;

  applyPresTransform();
}

function presZoomAt(factor, cx, cy) {
  const wrap = document.getElementById("presCanvasWrap");
  const rect = wrap.getBoundingClientRect();
  const px = cx !== undefined ? cx - rect.left : rect.width / 2;
  const py = cy !== undefined ? cy - rect.top : rect.height / 2;
  const newScale = Math.max(0.05, Math.min(20, ppz.scale * factor));
  const ratio = newScale / ppz.scale;
  ppz.x = px - ratio * (px - ppz.x);
  ppz.y = py - ratio * (py - ppz.y);
  ppz.scale = newScale;
  applyPresTransform();
}

function presReset() {
  presFit();
}

function togglePresExport() {
  document.getElementById("presExportMenu").classList.toggle("open");
}

// Presentation pan & zoom events
const presWrap = document.getElementById("presCanvasWrap");

presWrap.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  presZoomAt(factor, e.clientX, e.clientY);
}, { passive: false });

presWrap.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  ppz.dragging = true;
  ppz.startX = e.clientX;
  ppz.startY = e.clientY;
  ppz.originX = ppz.x;
  ppz.originY = ppz.y;
  presWrap.classList.add("grabbing");
  e.preventDefault();
});

window.addEventListener("mousemove", (e) => {
  if (ppz.dragging) {
    ppz.x = ppz.originX + (e.clientX - ppz.startX);
    ppz.y = ppz.originY + (e.clientY - ppz.startY);
    applyPresTransform();
  }
});

window.addEventListener("mouseup", () => {
  if (ppz.dragging) {
    ppz.dragging = false;
    presWrap.classList.remove("grabbing");
  }
});

presWrap.addEventListener("dblclick", () => presFit());

// Esc to exit presentation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("presentationOverlay").classList.contains("active")) {
    exitPresentation();
  }
});

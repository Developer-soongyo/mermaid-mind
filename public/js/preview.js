// ---------------------------------------------------------------------------
// Mermaid rendering
// ---------------------------------------------------------------------------
async function renderPreview(code) {
  const canvas = document.getElementById("previewCanvas");
  if (!code || !code.trim()) {
    canvas.innerHTML = '<span class="preview-placeholder">Preview will appear here</span>';
    return;
  }
  try {
    renderCounter++;
    const id = "mm-" + renderCounter;
    const { svg } = await mermaid.render(id, code.trim());
    canvas.innerHTML = svg;
  } catch (err) {
    canvas.innerHTML = `<div class="preview-error">Syntax error: ${err.message || "Invalid diagram"}</div>`;
  }
}

// ---------------------------------------------------------------------------
// Pan & Zoom
// ---------------------------------------------------------------------------
const pz = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
let zoomIndicatorTimeout = null;

function applyTransform() {
  const canvas = document.getElementById("previewCanvas");
  canvas.style.transform = `translate(${pz.x}px, ${pz.y}px) scale(${pz.scale})`;
  showZoomIndicator();
}

function showZoomIndicator() {
  const el = document.getElementById("zoomIndicator");
  el.textContent = Math.round(pz.scale * 100) + "%";
  el.classList.add("visible");
  clearTimeout(zoomIndicatorTimeout);
  zoomIndicatorTimeout = setTimeout(() => el.classList.remove("visible"), 1200);
}

function zoomPreview(delta) {
  pz.scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pz.scale + delta));
  applyTransform();
}

function zoomAtPoint(factor, cx, cy) {
  const area = document.getElementById("previewArea");
  const rect = area.getBoundingClientRect();
  const px = cx - rect.left;
  const py = cy - rect.top;
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pz.scale * factor));
  const ratio = newScale / pz.scale;
  pz.x = px - ratio * (px - pz.x);
  pz.y = py - ratio * (py - pz.y);
  pz.scale = newScale;
  applyTransform();
}

function resetZoom() {
  pz.scale = 1;
  pz.x = 0;
  pz.y = 0;
  applyTransform();
}

function fitToScreen() {
  const area = document.getElementById("previewArea");
  const svg = area.querySelector("svg");
  if (!svg) return;
  const areaRect = area.getBoundingClientRect();
  const svgW = svg.viewBox?.baseVal?.width || svg.getBoundingClientRect().width;
  const svgH = svg.viewBox?.baseVal?.height || svg.getBoundingClientRect().height;
  if (!svgW || !svgH) return;
  const padding = 40;
  const scaleX = (areaRect.width - padding) / svgW;
  const scaleY = (areaRect.height - padding) / svgH;
  pz.scale = Math.min(scaleX, scaleY, 2);
  pz.x = (areaRect.width - svgW * pz.scale) / 2;
  pz.y = (areaRect.height - svgH * pz.scale) / 2;
  applyTransform();
}

// Mouse wheel zoom (zoom toward cursor)
document.getElementById("previewArea").addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  zoomAtPoint(factor, e.clientX, e.clientY);
}, { passive: false });

// Pan via mouse drag
const previewArea = document.getElementById("previewArea");

previewArea.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  pz.dragging = true;
  pz.startX = e.clientX;
  pz.startY = e.clientY;
  pz.originX = pz.x;
  pz.originY = pz.y;
  previewArea.classList.add("grabbing");
  e.preventDefault();
});

window.addEventListener("mousemove", (e) => {
  if (!pz.dragging) return;
  pz.x = pz.originX + (e.clientX - pz.startX);
  pz.y = pz.originY + (e.clientY - pz.startY);
  applyTransform();
});

window.addEventListener("mouseup", () => {
  if (pz.dragging) {
    pz.dragging = false;
    previewArea.classList.remove("grabbing");
  }
});

// Double-click to reset
previewArea.addEventListener("dblclick", () => {
  resetZoom();
});

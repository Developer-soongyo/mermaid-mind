// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
function toggleExport() {
  document.getElementById("exportMenu").classList.toggle("open");
}

async function exportClipboard() {
  const svg = document.querySelector("#previewCanvas svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.style.transform = "";
  const svgData = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement("canvas");
  const bbox = svg.getBoundingClientRect();
  const scale = 2;
  canvas.width = bbox.width * scale;
  canvas.height = bbox.height * scale;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = async () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showSettingsStatus("Copied to clipboard!", "success");
    } catch {
      showSettingsStatus("Clipboard copy failed", "error");
    }
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  toggleExport();
}

function exportSVG() {
  const svg = document.querySelector("#previewCanvas svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.style.transform = "";
  const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
  downloadBlob(blob, getDiagramFilename("svg"));
  toggleExport();
}

function exportPNG() {
  const svg = document.querySelector("#previewCanvas svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.style.transform = "";
  const svgData = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement("canvas");
  const bbox = svg.getBoundingClientRect();
  const scale = 2;
  canvas.width = bbox.width * scale;
  canvas.height = bbox.height * scale;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      downloadBlob(blob, getDiagramFilename("png"));
    });
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  toggleExport();
}

function exportPDF() {
  const svg = document.querySelector("#previewCanvas svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.style.transform = "";
  const svgData = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement("canvas");
  const bbox = svg.getBoundingClientRect();
  const scale = 2;
  canvas.width = bbox.width * scale;
  canvas.height = bbox.height * scale;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: bbox.width > bbox.height ? "landscape" : "portrait",
      unit: "px",
      format: [bbox.width, bbox.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, bbox.width, bbox.height);
    pdf.save(getDiagramFilename("pdf"));
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  toggleExport();
}

function getDiagramFilename(ext) {
  const name = document.getElementById("diagramNameDisplay").textContent || "diagram";
  const safe = name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
  return (safe || "diagram") + "." + ext;
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------------------------------------------------------------------------
// Copy code
// ---------------------------------------------------------------------------
async function copyCode() {
  const code = editor.value;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    const btn = document.getElementById("copyCodeBtn");
    btn.innerHTML = "&#10003; Copied";
    setTimeout(() => { btn.innerHTML = "&#128203; Copy"; }, 1500);
  } catch {
    showSettingsStatus("Copy failed", "error");
  }
}

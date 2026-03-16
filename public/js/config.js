// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API = "";
let currentDiagramId = null;
let previewZoom = 1;
let renderCounter = 0;
let debounceTimer = null;

// ---------------------------------------------------------------------------
// Mermaid init
// ---------------------------------------------------------------------------
// Mermaid initialized via applyAppTheme() in init

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Close dropdowns on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest(".snippets-wrap")) {
    document.getElementById("snippetsMenu").classList.remove("open");
  }
  if (!e.target.closest(".export-wrap")) {
    document.getElementById("exportMenu").classList.remove("open");
    document.getElementById("presExportMenu").classList.remove("open");
  }
});

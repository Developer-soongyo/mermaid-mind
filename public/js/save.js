// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "&#10003;" : type === "error" ? "&#10007;" : "&#8505;";
  toast.innerHTML = `${icon} ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function newDiagram() {
  currentDiagramId = null;
  editor.value = "";
  document.getElementById("diagramNameDisplay").textContent = "";
  updateLineNumbers();
  renderPreview("");
  loadHistory();
}

async function saveDiagram() {
  const code = editor.value.trim();
  if (!code) return;
  const saveBtn = document.querySelector('.save-bar .btn-primary');
  const origText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

  if (currentDiagramId) {
    try {
      const nameRes = await fetch(API + "/api/auto-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: code }),
      });
      const nameData = await nameRes.json();
      const name = nameData.name || undefined;

      const res = await fetch(API + "/api/history/" + currentDiagramId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: code, name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      document.getElementById("diagramNameDisplay").textContent = data.name;
      loadHistory();
      showToast("Diagram saved");
    } catch (e) {
      showToast("Save error: " + e.message, "error");
    }
  } else {
    try {
      const res = await fetch(API + "/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: code }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      currentDiagramId = data.id;
      document.getElementById("diagramNameDisplay").textContent = data.name;
      loadHistory();
      showToast("Diagram saved");
    } catch (e) {
      showToast("Save error: " + e.message, "error");
    }
  }
  saveBtn.disabled = false;
  saveBtn.textContent = origText;
}

async function saveVersion() {
  if (!currentDiagramId) {
    showToast("Save the diagram first", "error");
    return;
  }
  const code = editor.value.trim();
  if (!code) return;
  const vBtn = document.querySelector('.save-bar .btn-secondary:last-child');
  const origText = vBtn.textContent;
  vBtn.disabled = true;
  vBtn.innerHTML = '<span class="spinner"></span> Saving...';
  try {
    const res = await fetch(API + `/api/history/${currentDiagramId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mermaid: code }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Version snapshot saved");
      // Auto-expand versions for this diagram
      expandedVersions.add(currentDiagramId);
      loadHistory();
    }
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }
  vBtn.disabled = false;
  vBtn.textContent = origText;
}

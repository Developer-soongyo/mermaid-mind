// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
let allHistoryItems = [];
let activeTagFilter = null;
let expandedVersions = new Set(); // track which diagram IDs have versions expanded

function filterHistory() {
  const query = document.getElementById("historySearch").value.toLowerCase().trim();
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  let filtered = allHistoryItems;
  // Filter by tag
  if (activeTagFilter) {
    filtered = filtered.filter(item =>
      (item.tags || []).some(t => t.id === activeTagFilter)
    );
  }
  // Filter by search
  if (query) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.source && item.source.toLowerCase().includes(query)) ||
      (item.tags || []).some(t => t.name.includes(query))
    );
  }
  filtered.forEach((item) => renderHistoryItem(item, list));
}

async function loadTagFilters() {
  try {
    const res = await fetch(API + "/api/tags");
    const tags = await res.json();
    const bar = document.getElementById("tagFilterBar");
    bar.innerHTML = "";
    if (tags.length === 0) {
      document.getElementById("tagFilterWrap").style.display = "none";
      return;
    }
    document.getElementById("tagFilterWrap").style.display = "";
    // "All" chip
    const allChip = document.createElement("span");
    allChip.className = "tag-filter-chip" + (!activeTagFilter ? " active" : "");
    allChip.textContent = "All";
    allChip.onclick = () => { activeTagFilter = null; filterHistory(); loadTagFilters(); };
    bar.appendChild(allChip);
    tags.forEach(t => {
      const chip = document.createElement("span");
      chip.className = "tag-filter-chip" + (activeTagFilter === t.id ? " active" : "");
      chip.textContent = t.name;
      chip.onclick = () => {
        activeTagFilter = activeTagFilter === t.id ? null : t.id;
        filterHistory();
        loadTagFilters();
      };
      bar.appendChild(chip);
    });
  } catch {}
}

async function addTag(diagramId, inputEl) {
  const tag = inputEl.value.trim();
  if (!tag) return;
  try {
    await fetch(API + `/api/history/${diagramId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    inputEl.value = "";
    loadHistory();
  } catch {}
}

async function removeTag(diagramId, tagId) {
  try {
    await fetch(API + `/api/history/${diagramId}/tags/${tagId}`, { method: "DELETE" });
    loadHistory();
  } catch {}
}

function renderHistoryItem(item, list) {
  const div = document.createElement("div");
  div.className = "history-item" + (item.id === currentDiagramId ? " active" : "");
  div.dataset.diagramId = item.id;
  const tagsHtml = (item.tags || []).map(t =>
    `<span class="tag">${escapeHtml(t.name)}<span class="tag-remove" onclick="event.stopPropagation();removeTag(${item.id},${t.id})">&times;</span></span>`
  ).join("");
  div.innerHTML = `
    <div class="history-item-info" onclick="loadDiagram(${item.id})">
      <div class="history-item-name" ondblclick="event.stopPropagation();startRenameDiagram(${item.id}, this)" title="Double-click to rename">${escapeHtml(item.name)}</div>
      <div class="history-item-date">${formatDate(item.created_at)}</div>
      <div class="tags-row">${tagsHtml}
        <input class="tag-input" placeholder="+ tag"
          onclick="event.stopPropagation()"
          onkeydown="if(event.key==='Enter'){event.stopPropagation();addTag(${item.id},this)}" />
      </div>
    </div>
    <div class="history-item-actions">
      <button class="btn-icon" onclick="event.stopPropagation();startRenameDiagram(${item.id}, this.closest('.history-item').querySelector('.history-item-name'))" title="Rename">&#9998;</button>
      <button class="btn-icon version-toggle-btn" onclick="event.stopPropagation();toggleVersions(${item.id}, this)" title="Versions">&#8635;</button>
      <button class="btn-icon" onclick="event.stopPropagation();deleteDiagram(${item.id})" title="Delete">&#10005;</button>
    </div>
  `;
  list.appendChild(div);

  // Auto-expand versions if previously expanded
  if (expandedVersions.has(item.id)) {
    const btn = div.querySelector(".version-toggle-btn");
    loadVersionList(item.id, div);
  }
}

function startRenameDiagram(diagramId, nameEl) {
  const currentName = nameEl.textContent;
  const input = document.createElement("input");
  input.className = "history-item-name-edit";
  input.value = currentName;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  async function commitRename() {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      try {
        await fetch(API + "/api/history/" + diagramId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (currentDiagramId === diagramId) {
          document.getElementById("diagramNameDisplay").textContent = newName;
        }
      } catch {}
    }
    loadHistory();
  }

  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    if (e.key === "Escape") loadHistory();
  });
  input.addEventListener("blur", commitRename);
  input.addEventListener("click", (e) => e.stopPropagation());
}

async function loadHistory() {
  try {
    const res = await fetch(API + "/api/history");
    allHistoryItems = await res.json();
    filterHistory();
    loadTagFilters();
  } catch {}
}

async function loadDiagram(id) {
  try {
    const res = await fetch(API + "/api/history/" + id);
    const data = await res.json();
    editor.value = data.mermaid;
    currentDiagramId = data.id;
    document.getElementById("diagramNameDisplay").textContent = data.name;
    updateLineNumbers();
    renderPreview(data.mermaid);
    loadHistory();
  } catch {}
}

async function deleteDiagram(id) {
  const item = allHistoryItems.find(d => d.id === id);
  const name = item ? item.name : "this diagram";
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    await fetch(API + "/api/history/" + id, { method: "DELETE" });
    if (currentDiagramId === id) {
      currentDiagramId = null;
      editor.value = "";
      document.getElementById("diagramNameDisplay").textContent = "";
      updateLineNumbers();
      renderPreview("");
    }
    loadHistory();
    showToast("Diagram deleted");
  } catch {}
}

function startRenameCurrentDiagram() {
  if (!currentDiagramId) return;
  const span = document.getElementById("diagramNameDisplay");
  const currentName = span.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.style.cssText = "flex:1;font-size:13px;padding:2px 6px;background:var(--bg);border:1px solid var(--accent);border-radius:4px;color:var(--text);outline:none;font-family:inherit;";
  span.replaceWith(input);
  input.focus();
  input.select();

  async function commit() {
    const newName = input.value.trim();
    const newSpan = document.createElement("span");
    newSpan.id = "diagramNameDisplay";
    newSpan.setAttribute("ondblclick", "startRenameCurrentDiagram()");
    newSpan.title = "Double-click to rename";
    newSpan.style.cssText = "flex:1;font-size:13px;color:var(--text2);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    if (newName && newName !== currentName) {
      try {
        await fetch(API + "/api/history/" + currentDiagramId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        newSpan.textContent = newName;
        loadHistory();
      } catch {
        newSpan.textContent = currentName;
      }
    } else {
      newSpan.textContent = currentName;
    }
    input.replaceWith(newSpan);
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") {
      const newSpan = document.createElement("span");
      newSpan.id = "diagramNameDisplay";
      newSpan.setAttribute("ondblclick", "startRenameCurrentDiagram()");
      newSpan.title = "Double-click to rename";
      newSpan.style.cssText = "flex:1;font-size:13px;color:var(--text2);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      newSpan.textContent = currentName;
      input.replaceWith(newSpan);
    }
  });
  input.addEventListener("blur", commit);
}

async function toggleVersions(diagramId, btn) {
  const item = btn.closest(".history-item");
  let vList = item.nextElementSibling;
  if (vList && vList.classList.contains("version-list")) {
    vList.remove();
    expandedVersions.delete(diagramId);
    return;
  }
  expandedVersions.add(diagramId);
  await loadVersionList(diagramId, item);
}

async function loadVersionList(diagramId, historyItemEl) {
  // Remove existing version list if any
  let existing = historyItemEl.nextElementSibling;
  if (existing && existing.classList.contains("version-list")) {
    existing.remove();
  }
  try {
    const res = await fetch(API + "/api/history/" + diagramId + "/versions");
    const versions = await res.json();
    const div = document.createElement("div");
    div.className = "version-list";
    if (versions.length === 0) {
      div.innerHTML = '<div class="version-item" style="color:var(--text2);cursor:default;font-style:italic;">No versions yet</div>';
    } else {
      versions.forEach((v) => {
        const vItem = document.createElement("div");
        vItem.className = "version-item";
        vItem.innerHTML = `
          <span onclick="restoreVersion(${v.id}, ${diagramId})" style="flex:1;cursor:pointer;">${escapeHtml(v.name || "Snapshot")} &middot; ${formatDate(v.created_at)}</span>
          <button class="btn-icon" onclick="event.stopPropagation();deleteVersion(${v.id}, ${diagramId})" title="Delete version" style="font-size:11px;padding:0 3px;">&#10005;</button>
        `;
        div.appendChild(vItem);
      });
    }
    historyItemEl.after(div);
  } catch {}
}

async function deleteVersion(versionId, diagramId) {
  if (!confirm("Delete this version snapshot?")) return;
  try {
    await fetch(API + "/api/versions/" + versionId, { method: "DELETE" });
    showToast("Version deleted");
    // Refresh the version list
    const item = document.querySelector(`.history-item[data-diagram-id="${diagramId}"]`);
    if (item) await loadVersionList(diagramId, item);
  } catch {}
}

async function restoreVersion(versionId, diagramId) {
  try {
    const res = await fetch(API + "/api/versions/" + versionId);
    const data = await res.json();
    if (data.error) return;
    editor.value = data.mermaid;
    if (diagramId) currentDiagramId = diagramId;
    updateLineNumbers();
    renderPreview(data.mermaid);
    showToast("Version restored");
  } catch {}
}

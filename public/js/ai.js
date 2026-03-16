// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------
function toggleAIPrompt() {
  const wrap = document.getElementById("aiPromptWrap");
  wrap.classList.toggle("open");
  if (wrap.classList.contains("open")) {
    document.getElementById("aiPromptInput").focus();
  }
}

document.getElementById("aiPromptInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generateFromAI();
  }
});

async function generateFromAI() {
  const input = document.getElementById("aiPromptInput");
  const btn = document.getElementById("aiGenerateBtn");
  const desc = input.value.trim();
  if (!desc) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(API + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    editor.value = data.mermaid;
    currentDiagramId = data.id;
    document.getElementById("diagramNameDisplay").textContent = data.name;
    updateLineNumbers();
    renderPreview(data.mermaid);
    input.value = "";
    document.getElementById("aiPromptWrap").classList.remove("open");
    loadHistory();
  } catch (e) {
    showSettingsStatus("AI Error: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate";
  }
}

// ---------------------------------------------------------------------------
// AI Actions
// ---------------------------------------------------------------------------
const AI_ACTION_CONFIG = {
  theme: {
    title: "&#127912; AI Theme / Colors",
    desc: "Pick a preset or describe a custom color theme.",
    placeholder: "e.g. corporate blue, dark neon, pastel warm...",
    hasPresets: true,
  },
  expand: {
    title: "&#128300; AI Expand",
    desc: "Optionally describe what to expand (leave blank for auto-expand).",
    placeholder: "e.g. add error handling paths, add user roles...",
  },
};

let currentAIAction = null;

function openAIAction(action) {
  const code = editor.value.trim();
  if (!code) { showSettingsStatus("Write some code first", "error"); return; }
  const config = AI_ACTION_CONFIG[action];
  currentAIAction = action;
  activePreset = null;
  document.getElementById("aiModalTitle").innerHTML = config.title;
  document.getElementById("aiModalDesc").textContent = config.desc;
  document.getElementById("aiModalInput").placeholder = config.placeholder;
  document.getElementById("aiModalInput").value = "";

  // Render presets if applicable
  let presetsEl = document.getElementById("presetGrid");
  if (presetsEl) presetsEl.remove();
  if (config.hasPresets) {
    presetsEl = document.createElement("div");
    presetsEl.className = "preset-grid";
    presetsEl.id = "presetGrid";
    CHART_PRESETS.forEach((p, i) => {
      const btn = document.createElement("div");
      btn.className = "preset-btn";
      btn.innerHTML = `
        <div class="preset-swatches">
          <div class="preset-swatch" style="background:${p.colors.primary}"></div>
          <div class="preset-swatch" style="background:${p.colors.secondary}"></div>
          <div class="preset-swatch" style="background:${p.colors.tertiary}"></div>
          <div class="preset-swatch" style="background:${p.colors.accent}"></div>
        </div>
        ${p.name}
      `;
      btn.onclick = () => {
        document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activePreset = p;
        document.getElementById("aiModalInput").value = "";
        document.getElementById("aiModalInput").placeholder = `Using "${p.name}" preset...`;
      };
      presetsEl.appendChild(btn);
    });
    const input = document.getElementById("aiModalInput");
    input.parentElement.insertBefore(presetsEl, input);
  }

  document.getElementById("aiModalOverlay").classList.add("open");
  document.getElementById("aiModalInput").focus();
}

function closeAIModal() {
  document.getElementById("aiModalOverlay").classList.remove("open");
  currentAIAction = null;
}

document.getElementById("aiModalInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); submitAIModal(); }
  if (e.key === "Escape") closeAIModal();
});

async function submitAIModal() {
  let prompt = document.getElementById("aiModalInput").value.trim();
  const action = currentAIAction;
  // If a preset is selected and no custom text, use preset prompt
  if (activePreset && !prompt) {
    prompt = getPresetPrompt(activePreset);
  }
  closeAIModal();
  await runAIAction(action, prompt);
}

async function runAIAction(action, prompt) {
  const code = editor.value.trim();
  if (!code) { showSettingsStatus("Write some code first", "error"); return; }

  // Show loading state on the action button
  const btnMap = { theme: 0, fix: 1, explain: 2, expand: 3 };
  const btns = document.querySelectorAll(".btn-ai-action");
  const btn = btns[btnMap[action]];
  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(API + "/api/ai-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, mermaid: code, prompt }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    if (action === "explain") {
      document.getElementById("explainContent").innerHTML = marked.parse(data.result);
      document.getElementById("explainOverlay").classList.add("open");
    } else {
      // theme, fix, expand — try rendering, fallback to original if it breaks
      const originalCode = code;
      const newCode = data.result;
      try {
        renderCounter++;
        const testId = "mm-test-" + renderCounter;
        await mermaid.render(testId, newCode.trim());
        // Render succeeded — apply
        editor.value = newCode;
        updateLineNumbers();
        renderPreview(newCode);
      } catch {
        // AI output broke the diagram — revert and notify
        editor.value = originalCode;
        updateLineNumbers();
        renderPreview(originalCode);
        showSettingsStatus("AI output had syntax errors — reverted to original. Try again or use a different action.", "error");
      }
    }
  } catch (e) {
    showSettingsStatus("AI error: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
}

function closeExplain() {
  document.getElementById("explainOverlay").classList.remove("open");
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  const arrow = document.getElementById("settings-arrow");
  panel.classList.toggle("open");
  arrow.innerHTML = panel.classList.contains("open") ? "&#9660;" : "&#9654;";
}

async function loadSettingsUI() {
  try {
    const res = await fetch(API + "/settings");
    const data = await res.json();
    const fields = {
      azure_openai_api_key: { input: "set-api-key", badge: "badge-key" },
      azure_openai_endpoint: { input: "set-endpoint", badge: "badge-endpoint" },
      azure_openai_api_version: { input: "set-api-version", badge: "badge-version" },
      azure_openai_deployment: { input: "set-deployment", badge: "badge-deployment" },
    };
    for (const [key, { input, badge }] of Object.entries(fields)) {
      const el = document.getElementById(input);
      const bg = document.getElementById(badge);
      if (data[key]) {
        el.placeholder = data[key].value || "";
        bg.textContent = data[key].source === "none" ? "" :
          data[key].source === "env" ? "from .env" : "custom";
      }
    }
  } catch {}
}

async function saveSettings() {
  const body = {};
  const val = (id) => document.getElementById(id).value;
  if (val("set-api-key")) body.azure_openai_api_key = val("set-api-key");
  if (val("set-endpoint")) body.azure_openai_endpoint = val("set-endpoint");
  if (val("set-api-version")) body.azure_openai_api_version = val("set-api-version");
  if (val("set-deployment")) body.azure_openai_deployment = val("set-deployment");
  if (Object.keys(body).length === 0) return;
  try {
    await fetch(API + "/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showSettingsStatus("Saved!", "success");
    document.getElementById("set-api-key").value = "";
    document.getElementById("set-endpoint").value = "";
    document.getElementById("set-api-version").value = "";
    document.getElementById("set-deployment").value = "";
    loadSettingsUI();
  } catch (e) {
    showSettingsStatus("Error: " + e.message, "error");
  }
}

async function testConnection() {
  showSettingsStatus("Testing...", "info");
  try {
    const res = await fetch(API + "/settings/test", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showSettingsStatus("Connected!", "success");
    } else {
      showSettingsStatus(data.error || "Failed", "error");
    }
  } catch (e) {
    showSettingsStatus("Error: " + e.message, "error");
  }
}

function showSettingsStatus(msg, type) {
  const el = document.getElementById("settingsStatus");
  el.textContent = msg;
  el.style.color = type === "success" ? "var(--green)" :
    type === "error" ? "var(--red)" : "var(--yellow)";
  if (type !== "info") setTimeout(() => { el.textContent = ""; }, 4000);
}

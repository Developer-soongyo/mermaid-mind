require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Settings helpers (adapted from refine-addin)
// ---------------------------------------------------------------------------

const SETTINGS_PATH = path.join(__dirname, "settings.json");

const ENV_MAP = {
  azure_openai_api_key: "AZURE_OPENAI_API_KEY",
  azure_openai_endpoint: "AZURE_OPENAI_ENDPOINT",
  azure_openai_api_version: "AZURE_OPENAI_API_VERSION",
  azure_openai_deployment: "AZURE_OPENAI_DEPLOYMENT",
};

const SECRET_KEYS = new Set(["azure_openai_api_key"]);

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), {
    mode: 0o600,
  });
}

function getEffectiveSetting(key) {
  const settings = loadSettings();
  if (settings[key]) return settings[key];
  const envKey = ENV_MAP[key];
  return envKey ? process.env[envKey] || "" : "";
}

function maskValue(value) {
  if (!value || value.length <= 8) return value ? "****" : "";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

// ---------------------------------------------------------------------------
// Settings routes
// ---------------------------------------------------------------------------

app.get("/settings", (_req, res) => {
  const result = {};
  for (const key of Object.keys(ENV_MAP)) {
    const settings = loadSettings();
    const fromFile = settings[key] || "";
    const envKey = ENV_MAP[key];
    const fromEnv = envKey ? process.env[envKey] || "" : "";
    const effective = fromFile || fromEnv;
    const source = fromFile ? "settings" : fromEnv ? "env" : "none";
    result[key] = {
      value: SECRET_KEYS.has(key) ? maskValue(effective) : effective,
      source,
    };
  }
  res.json(result);
});

app.post("/settings", (req, res) => {
  const current = loadSettings();
  for (const [key, value] of Object.entries(req.body)) {
    if (!(key in ENV_MAP)) continue;
    if (typeof value === "string" && value.includes("****")) continue;
    if (value === "") {
      delete current[key];
    } else {
      current[key] = value;
    }
  }
  saveSettings(current);
  res.json({ success: true });
});

app.post("/settings/test", async (_req, res) => {
  try {
    const apiKey = getEffectiveSetting("azure_openai_api_key");
    const endpoint = getEffectiveSetting("azure_openai_endpoint");
    if (!apiKey || !endpoint) {
      return res.json({
        success: false,
        error: "API key and endpoint are required",
      });
    }
    const { AzureOpenAI } = require("openai");
    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion:
        getEffectiveSetting("azure_openai_api_version") || "2024-02-01",
      deployment: getEffectiveSetting("azure_openai_deployment") || "gpt-4o",
    });
    await client.chat.completions.create({
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Azure OpenAI helper
// ---------------------------------------------------------------------------

const GENERATE_SYSTEM = `You are a Mermaid.js diagram expert. Convert the user's description into valid Mermaid diagram code.

Rules:
- Return ONLY the raw Mermaid code. No markdown fences. No explanations. No extra text.
- Choose the most appropriate diagram type: flowchart (graph TD/LR), sequence, class, state, ER, gantt, pie, mindmap, timeline, quadrant, sankey, etc.
- Use clear, descriptive node labels.
- Keep the diagram readable.`;

const NAMING_SYSTEM = `Generate a short, descriptive name (3-6 words) for the given Mermaid diagram. Return ONLY the name. No quotes, no punctuation, no explanation.`;

async function callAI(systemPrompt, userMessage) {
  const { AzureOpenAI } = require("openai");
  const client = new AzureOpenAI({
    apiKey: getEffectiveSetting("azure_openai_api_key"),
    endpoint: getEffectiveSetting("azure_openai_endpoint"),
    apiVersion:
      getEffectiveSetting("azure_openai_api_version") || "2024-02-01",
    deployment: getEffectiveSetting("azure_openai_deployment") || "gpt-4o",
  });
  const res = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return res.choices[0].message.content;
}

async function autoName(mermaidCode) {
  try {
    const name = await callAI(NAMING_SYSTEM, mermaidCode);
    return name.trim().slice(0, 100);
  } catch {
    const now = new Date();
    return `Diagram ${now.toISOString().slice(0, 16).replace("T", " ")}`;
  }
}

// ---------------------------------------------------------------------------
// AI action prompts
// ---------------------------------------------------------------------------

const AI_ACTIONS = {
  theme: {
    system: `You are a Mermaid.js styling expert. The user will provide Mermaid diagram code and a color/theme description.
Your job is to add or modify styling to match the requested theme.

CRITICAL - Diagram type styling rules:
- flowchart/graph: Use classDef + class assignments, or inline style statements like "style A fill:#xxx,color:#xxx"
- sequence: Use %%{init: {'theme':'base','themeVariables':{'actorBkg':'#xxx','signalColor':'#xxx'}}}%% directive at the top
- class diagram: Use classDef + style statements
- state: Use classDef + class assignments
- pie/gantt/timeline/mindmap/quadrant/sankey/ER: These do NOT support classDef or style statements. Use %%{init: {'theme':'base','themeVariables':{...}}}%% directive at the top instead.

General rules:
- Return ONLY the complete modified Mermaid code with styles applied. No markdown fences. No explanations.
- FIRST detect the diagram type from the first line of the code.
- Choose the appropriate styling method for that diagram type.
- Preserve the diagram structure and labels exactly — only add/change styling.
- If no theme description is given, apply a professional, visually appealing color scheme.
- NEVER add classDef or class statements to diagram types that don't support them.`,
    buildMessage: (code, prompt) =>
      `Diagram code:\n${code}\n\nTheme/color request: ${prompt || "Apply a professional, visually appealing color scheme"}`,
  },

  fix: {
    system: `You are a Mermaid.js expert. Analyze the given diagram code and fix any issues.

Rules:
- Return ONLY the fixed/improved Mermaid code. No markdown fences. No explanations.
- Fix syntax errors if any.
- Improve node naming and label clarity.
- Improve layout direction if it would help readability.
- Add missing connections if obviously implied.
- Keep the same diagram type unless it's clearly wrong.
- Do NOT remove existing content, only fix and improve.`,
    buildMessage: (code) => code,
  },

  explain: {
    system: `You are a technical documentation expert. The user will provide Mermaid diagram code.
Explain what the diagram represents in clear, concise plain English.

Rules:
- Write 2-5 short paragraphs.
- Describe the overall purpose, the key components, and the flow/relationships.
- Use bullet points for listing components if helpful.
- Be concise and informative.`,
    buildMessage: (code) => code,
  },

  expand: {
    system: `You are a Mermaid.js diagram expert. The user will provide existing Mermaid diagram code and optionally a description of what to add.
Expand the diagram with more detail, nodes, and connections.

Rules:
- Return ONLY the complete expanded Mermaid code. No markdown fences. No explanations.
- Keep ALL existing nodes and connections intact.
- Add relevant detail based on the context of the diagram.
- Maintain the same diagram type and style.
- Add 3-8 new nodes/connections that logically extend the diagram.
- If the user specifies what to expand, focus on that area.`,
    buildMessage: (code, prompt) =>
      `Existing diagram:\n${code}${prompt ? `\n\nExpand with: ${prompt}` : ""}`,
  },
};

// ---------------------------------------------------------------------------
// AI action endpoint
// ---------------------------------------------------------------------------

app.post("/api/ai-action", async (req, res) => {
  try {
    const { action, mermaid, prompt } = req.body;
    if (!mermaid || !mermaid.trim()) {
      return res.status(400).json({ error: "Mermaid code is required" });
    }
    const config = AI_ACTIONS[action];
    if (!config) {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    const userMessage = config.buildMessage(mermaid.trim(), prompt);
    const result = await callAI(config.system, userMessage);
    res.json({ result: result.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Diagram routes
// ---------------------------------------------------------------------------

app.post("/api/auto-name", async (req, res) => {
  try {
    const { mermaid } = req.body;
    if (!mermaid || !mermaid.trim()) {
      return res.status(400).json({ error: "Mermaid code is required" });
    }
    const name = await autoName(mermaid.trim());
    res.json({ name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }
    const mermaid = await callAI(GENERATE_SYSTEM, description.trim());
    const name = await autoName(mermaid);
    const id = db.insertDiagram({ name, source: description.trim(), mermaid });
    const diagram = db.getDiagram(id);
    res.json(diagram);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    const { mermaid, name } = req.body;
    if (!mermaid || !mermaid.trim()) {
      return res.status(400).json({ error: "Mermaid code is required" });
    }
    const finalName = name && name.trim() ? name.trim() : await autoName(mermaid);
    const id = db.insertDiagram({ name: finalName, source: null, mermaid: mermaid.trim() });
    const diagram = db.getDiagram(id);
    res.json(diagram);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/history", (_req, res) => {
  res.json(db.getAllDiagrams());
});

app.get("/api/history/:id", (req, res) => {
  const diagram = db.getDiagram(req.params.id);
  if (!diagram) return res.status(404).json({ error: "Not found" });
  res.json(diagram);
});

app.put("/api/history/:id", async (req, res) => {
  try {
    const existing = db.getDiagram(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const name = req.body.name || existing.name;
    const mermaid = req.body.mermaid || existing.mermaid;
    db.updateDiagram(req.params.id, { name, mermaid });
    res.json(db.getDiagram(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/history/:id", (req, res) => {
  const changes = db.deleteDiagram(req.params.id);
  if (!changes) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// Version routes
app.get("/api/versions/:versionId", (req, res) => {
  const version = db.getVersion(req.params.versionId);
  if (!version) return res.status(404).json({ error: "Not found" });
  res.json(version);
});

app.get("/api/history/:id/versions", (req, res) => {
  const diagram = db.getDiagram(req.params.id);
  if (!diagram) return res.status(404).json({ error: "Not found" });
  res.json(db.getVersions(req.params.id));
});

app.post("/api/history/:id/versions", (req, res) => {
  const diagram = db.getDiagram(req.params.id);
  if (!diagram) return res.status(404).json({ error: "Not found" });
  const name = req.body.name || null;
  const mermaid = req.body.mermaid || diagram.mermaid;
  const versionId = db.insertVersion(req.params.id, { name, mermaid });
  res.json({ id: versionId, success: true });
});

// Tag routes
app.get("/api/tags", (_req, res) => {
  res.json(db.getAllTags());
});

app.post("/api/history/:id/tags", (req, res) => {
  const diagram = db.getDiagram(req.params.id);
  if (!diagram) return res.status(404).json({ error: "Not found" });
  const { tag } = req.body;
  if (!tag || !tag.trim()) return res.status(400).json({ error: "Tag is required" });
  const result = db.addTagToDiagram(req.params.id, tag);
  res.json(result);
});

app.delete("/api/history/:id/tags/:tagId", (req, res) => {
  db.removeTagFromDiagram(req.params.id, req.params.tagId);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3940;
app.listen(PORT, () => {
  console.log(`MermaidMind running on http://localhost:${PORT}`);
});

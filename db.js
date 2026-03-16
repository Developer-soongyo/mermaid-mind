const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "mermaid-mind.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS diagrams (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    source     TEXT,
    mermaid    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS versions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    name       TEXT,
    mermaid    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS diagram_tags (
    diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (diagram_id, tag_id)
  );
`);

// --- Prepared statements ---
const stmtAll = db.prepare(
  "SELECT id, name, source, created_at FROM diagrams ORDER BY created_at DESC"
);
const stmtGet = db.prepare("SELECT * FROM diagrams WHERE id = ?");
const stmtInsert = db.prepare(
  "INSERT INTO diagrams (name, source, mermaid) VALUES (?, ?, ?)"
);
const stmtUpdate = db.prepare(
  "UPDATE diagrams SET name = ?, mermaid = ? WHERE id = ?"
);
const stmtDelete = db.prepare("DELETE FROM diagrams WHERE id = ?");

const stmtVersions = db.prepare(
  "SELECT id, name, created_at FROM versions WHERE diagram_id = ? ORDER BY created_at DESC"
);
const stmtInsertVersion = db.prepare(
  "INSERT INTO versions (diagram_id, name, mermaid) VALUES (?, ?, ?)"
);
const stmtGetVersion = db.prepare("SELECT * FROM versions WHERE id = ?");
const stmtDeleteVersion = db.prepare("DELETE FROM versions WHERE id = ?");

// Tags
const stmtAllTags = db.prepare("SELECT * FROM tags ORDER BY name");
const stmtInsertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
const stmtGetTagByName = db.prepare("SELECT * FROM tags WHERE name = ?");
const stmtDiagramTags = db.prepare(
  "SELECT t.id, t.name FROM tags t JOIN diagram_tags dt ON dt.tag_id = t.id WHERE dt.diagram_id = ?"
);
const stmtAddDiagramTag = db.prepare(
  "INSERT OR IGNORE INTO diagram_tags (diagram_id, tag_id) VALUES (?, ?)"
);
const stmtRemoveDiagramTag = db.prepare(
  "DELETE FROM diagram_tags WHERE diagram_id = ? AND tag_id = ?"
);
const stmtDiagramsByTag = db.prepare(
  `SELECT DISTINCT d.id, d.name, d.source, d.created_at
   FROM diagrams d JOIN diagram_tags dt ON dt.diagram_id = d.id
   WHERE dt.tag_id = ? ORDER BY d.created_at DESC`
);

// Helper: get all diagrams with their tags
function getAllDiagramsWithTags() {
  const diagrams = stmtAll.all();
  for (const d of diagrams) {
    d.tags = stmtDiagramTags.all(d.id);
  }
  return diagrams;
}

// --- Exports ---
module.exports = {
  getAllDiagrams: getAllDiagramsWithTags,

  getDiagram: (id) => {
    const d = stmtGet.get(id);
    if (d) d.tags = stmtDiagramTags.all(id);
    return d;
  },

  insertDiagram: ({ name, source, mermaid }) => {
    const info = stmtInsert.run(name, source || null, mermaid);
    return info.lastInsertRowid;
  },

  updateDiagram: (id, { name, mermaid }) => {
    const info = stmtUpdate.run(name, mermaid, id);
    return info.changes;
  },

  deleteDiagram: (id) => {
    const info = stmtDelete.run(id);
    return info.changes;
  },

  getVersions: (diagramId) => stmtVersions.all(diagramId),

  getVersion: (id) => stmtGetVersion.get(id),

  deleteVersion: (id) => {
    const info = stmtDeleteVersion.run(id);
    return info.changes;
  },

  insertVersion: (diagramId, { name, mermaid }) => {
    const info = stmtInsertVersion.run(diagramId, name || null, mermaid);
    return info.lastInsertRowid;
  },

  // Tags
  getAllTags: () => stmtAllTags.all(),

  addTagToDiagram: (diagramId, tagName) => {
    const clean = tagName.trim().toLowerCase();
    if (!clean) return null;
    stmtInsertTag.run(clean);
    const tag = stmtGetTagByName.get(clean);
    stmtAddDiagramTag.run(diagramId, tag.id);
    return tag;
  },

  removeTagFromDiagram: (diagramId, tagId) => {
    stmtRemoveDiagramTag.run(diagramId, tagId);
    // Auto-remove orphan tags (not used by any diagram)
    db.prepare("DELETE FROM tags WHERE id = ? AND id NOT IN (SELECT tag_id FROM diagram_tags)").run(tagId);
  },

  getDiagramTags: (diagramId) => stmtDiagramTags.all(diagramId),

  getDiagramsByTag: (tagId) => stmtDiagramsByTag.all(tagId),
};

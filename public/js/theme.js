// ---------------------------------------------------------------------------
// App theme (dark/light)
// ---------------------------------------------------------------------------
let appTheme = localStorage.getItem("mermaidmind-theme") || "dark";

function applyAppTheme() {
  document.documentElement.setAttribute("data-theme", appTheme);
  const btn = document.getElementById("themeToggleBtn");
  btn.innerHTML = appTheme === "dark" ? "&#9790; Dark" : "&#9788; Light";
  // Update mermaid theme
  reinitMermaid();
}

function toggleAppTheme() {
  appTheme = appTheme === "dark" ? "light" : "dark";
  localStorage.setItem("mermaidmind-theme", appTheme);
  applyAppTheme();
  // Re-render current preview
  const code = editor.value.trim();
  if (code) renderPreview(code);
}

function getMermaidThemeVars() {
  if (appTheme === "light") {
    return {
      background: "transparent",
      // Use light pastel backgrounds with dark text for readability
      primaryColor: "#dbeafe",
      primaryTextColor: "#1e3a5f",
      primaryBorderColor: "#3b82f6",
      secondaryColor: "#ede9fe",
      secondaryTextColor: "#3b1f7e",
      secondaryBorderColor: "#8b5cf6",
      tertiaryColor: "#ccfbf1",
      tertiaryTextColor: "#134e4a",
      tertiaryBorderColor: "#06b6d4",
      lineColor: "#475569",
      textColor: "#1e293b",
      mainBkg: "#dbeafe",
      nodeBorder: "#3b82f6",
      clusterBkg: "#f1f5f9",
      clusterBorder: "#94a3b8",
      titleColor: "#0f172a",
      edgeLabelBackground: "#f8fafc",
      nodeTextColor: "#1e293b",
      // Notes
      noteBkgColor: "#fef3c7",
      noteTextColor: "#92400e",
      noteBorderColor: "#f59e0b",
      // Sequence diagrams
      actorBkg: "#dbeafe",
      actorBorder: "#3b82f6",
      actorTextColor: "#1e3a5f",
      actorLineColor: "#475569",
      signalColor: "#1e293b",
      signalTextColor: "#1e293b",
      labelBoxBkgColor: "#f1f5f9",
      labelBoxBorderColor: "#94a3b8",
      labelTextColor: "#1e293b",
      loopTextColor: "#1e293b",
      activationBorderColor: "#3b82f6",
      activationBkgColor: "#dbeafe",
      sequenceNumberColor: "#1e3a5f",
      // Gantt
      sectionBkgColor: "#f1f5f9",
      altSectionBkgColor: "#e2e8f0",
      sectionBkgColor2: "#f1f5f9",
      taskBkgColor: "#dbeafe",
      taskTextColor: "#1e3a5f",
      taskTextLightColor: "#1e3a5f",
      taskBorderColor: "#3b82f6",
      taskTextOutsideColor: "#1e293b",
      activeTaskBkgColor: "#ede9fe",
      activeTaskBorderColor: "#8b5cf6",
      gridColor: "#e2e8f0",
      doneTaskBkgColor: "#dcfce7",
      doneTaskBorderColor: "#16a34a",
      critBkgColor: "#fee2e2",
      critBorderColor: "#dc2626",
      todayLineColor: "#f59e0b",
      // Pie
      pie1: "#3b82f6", pie2: "#8b5cf6", pie3: "#06b6d4", pie4: "#16a34a",
      pie5: "#f59e0b", pie6: "#dc2626", pie7: "#ec4899", pie8: "#14b8a6",
      pie9: "#f97316", pie10: "#6366f1", pie11: "#84cc16", pie12: "#e11d48",
      pieTitleTextColor: "#0f172a",
      pieSectionTextColor: "#ffffff",
      pieLegendTextColor: "#1e293b",
      pieStrokeColor: "#ffffff",
      pieStrokeWidth: "2px",
      // Class diagram
      classText: "#1e293b",
      // State diagram
      stateBkg: "#dbeafe",
      stateLabelColor: "#1e3a5f",
      // ER
      relationColor: "#475569",
      relationLabelColor: "#1e293b",
      // Errors
      errorBkgColor: "#fee2e2",
      errorTextColor: "#991b1b",
      // Fill types for subgraphs
      fillType0: "#dbeafe",
      fillType1: "#ede9fe",
      fillType2: "#ccfbf1",
      fillType3: "#dcfce7",
      fillType4: "#fef3c7",
      fillType5: "#fee2e2",
      fillType6: "#fce7f3",
      fillType7: "#ccfbf1",
    };
  }
  // Dark theme vars (default)
  return {
    background: "transparent",
    primaryColor: "#3b82f6",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#60a5fa",
    secondaryColor: "#8b5cf6",
    secondaryTextColor: "#ffffff",
    secondaryBorderColor: "#a78bfa",
    tertiaryColor: "#06b6d4",
    tertiaryTextColor: "#ffffff",
    tertiaryBorderColor: "#67e8f9",
    noteBkgColor: "#fbbf24",
    noteTextColor: "#1e1e2e",
    noteBorderColor: "#f59e0b",
    lineColor: "#94a3b8",
    textColor: "#e2e8f0",
    mainBkg: "#3b82f6",
    nodeBorder: "#60a5fa",
    clusterBkg: "#1e293b",
    clusterBorder: "#475569",
    titleColor: "#f1f5f9",
    edgeLabelBackground: "#1e293b",
    nodeTextColor: "#ffffff",
    actorBkg: "#3b82f6",
    actorBorder: "#60a5fa",
    actorTextColor: "#ffffff",
    actorLineColor: "#94a3b8",
    signalColor: "#e2e8f0",
    signalTextColor: "#e2e8f0",
    labelBoxBkgColor: "#1e293b",
    labelBoxBorderColor: "#475569",
    labelTextColor: "#e2e8f0",
    loopTextColor: "#e2e8f0",
    activationBorderColor: "#60a5fa",
    activationBkgColor: "#1e3a5f",
    sequenceNumberColor: "#ffffff",
    sectionBkgColor: "#1e293b",
    altSectionBkgColor: "#0f172a",
    sectionBkgColor2: "#1e293b",
    taskBkgColor: "#3b82f6",
    taskTextColor: "#ffffff",
    taskTextLightColor: "#ffffff",
    taskBorderColor: "#60a5fa",
    taskTextOutsideColor: "#e2e8f0",
    activeTaskBkgColor: "#8b5cf6",
    activeTaskBorderColor: "#a78bfa",
    gridColor: "#334155",
    doneTaskBkgColor: "#22c55e",
    doneTaskBorderColor: "#4ade80",
    critBkgColor: "#ef4444",
    critBorderColor: "#f87171",
    todayLineColor: "#fbbf24",
    pie1: "#3b82f6", pie2: "#8b5cf6", pie3: "#06b6d4", pie4: "#22c55e",
    pie5: "#f59e0b", pie6: "#ef4444", pie7: "#ec4899", pie8: "#14b8a6",
    pie9: "#f97316", pie10: "#6366f1", pie11: "#84cc16", pie12: "#e11d48",
    pieTitleTextColor: "#f1f5f9",
    pieSectionTextColor: "#ffffff",
    pieLegendTextColor: "#e2e8f0",
    pieStrokeColor: "#1e1e2e",
    pieStrokeWidth: "2px",
    classText: "#ffffff",
    stateBkg: "#3b82f6",
    stateLabelColor: "#ffffff",
  };
}

function reinitMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: getMermaidThemeVars(),
  });
}

// ---------------------------------------------------------------------------
// Chart color presets
// ---------------------------------------------------------------------------
const CHART_PRESETS = [
  {
    name: "Default Blue",
    colors: { primary: "#3b82f6", secondary: "#8b5cf6", tertiary: "#06b6d4", accent: "#22c55e" },
  },
  {
    name: "Ocean",
    colors: { primary: "#0ea5e9", secondary: "#06b6d4", tertiary: "#14b8a6", accent: "#2dd4bf" },
  },
  {
    name: "Sunset",
    colors: { primary: "#f97316", secondary: "#ef4444", tertiary: "#f59e0b", accent: "#eab308" },
  },
  {
    name: "Forest",
    colors: { primary: "#16a34a", secondary: "#15803d", tertiary: "#65a30d", accent: "#84cc16" },
  },
  {
    name: "Purple Haze",
    colors: { primary: "#8b5cf6", secondary: "#a855f7", tertiary: "#d946ef", accent: "#ec4899" },
  },
  {
    name: "Monochrome",
    colors: { primary: "#525252", secondary: "#737373", tertiary: "#a3a3a3", accent: "#404040" },
  },
  {
    name: "Corporate",
    colors: { primary: "#1e40af", secondary: "#1e3a8a", tertiary: "#3730a3", accent: "#312e81" },
  },
  {
    name: "Candy",
    colors: { primary: "#ec4899", secondary: "#f43f5e", tertiary: "#a855f7", accent: "#f472b6" },
  },
];

let activePreset = null;

function getPresetPrompt(preset) {
  const c = preset.colors;
  return `Apply this exact color palette to the diagram:
- Primary/main nodes: ${c.primary}
- Secondary nodes: ${c.secondary}
- Tertiary/supporting nodes: ${c.tertiary}
- Accent/highlight: ${c.accent}
- Use white (#ffffff) text on colored backgrounds.
- Apply consistent styling across all nodes using classDef and class assignments.
- Name the theme "${preset.name}".`;
}

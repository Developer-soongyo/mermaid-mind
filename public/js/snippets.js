// ---------------------------------------------------------------------------
// Snippets
// ---------------------------------------------------------------------------
const SNIPPETS = [
  { name: "Flowchart", code: "flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]" },
  { name: "Sequence", code: "sequenceDiagram\n  Alice->>Bob: Hello Bob\n  Bob-->>Alice: Hi Alice" },
  { name: "Class Diagram", code: "classDiagram\n  class Animal {\n    +String name\n    +makeSound()\n  }\n  class Dog {\n    +fetch()\n  }\n  Animal <|-- Dog" },
  { name: "State", code: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Active: start\n  Active --> Idle: stop\n  Active --> [*]: finish" },
  { name: "ER Diagram", code: "erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains\n  PRODUCT ||--o{ LINE-ITEM : includes" },
  { name: "Gantt", code: "gantt\n  title Project Plan\n  dateFormat YYYY-MM-DD\n  section Phase 1\n    Task A :a1, 2024-01-01, 30d\n    Task B :after a1, 20d\n  section Phase 2\n    Task C :2024-02-15, 25d" },
  { name: "Pie Chart", code: "pie title Browser Market Share\n  \"Chrome\" : 65\n  \"Firefox\" : 15\n  \"Safari\" : 12\n  \"Other\" : 8" },
  { name: "Mindmap", code: "mindmap\n  root((Project))\n    Design\n      UI\n      UX\n    Development\n      Frontend\n      Backend\n    Testing" },
  { name: "Timeline", code: "timeline\n  title Company History\n  2020 : Founded\n  2021 : First Product Launch\n  2022 : Series A Funding\n  2023 : International Expansion" },
];

function initSnippets() {
  const menu = document.getElementById("snippetsMenu");
  SNIPPETS.forEach((s) => {
    const div = document.createElement("div");
    div.className = "snippet-item";
    div.textContent = s.name;
    div.onclick = () => {
      editor.value = s.code;
      updateLineNumbers();
      renderPreview(s.code);
      toggleSnippets();
    };
    menu.appendChild(div);
  });
}

function toggleSnippets() {
  document.getElementById("snippetsMenu").classList.toggle("open");
}

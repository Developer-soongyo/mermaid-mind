// ---------------------------------------------------------------------------
// Editor + Line numbers
// ---------------------------------------------------------------------------
const editor = document.getElementById("codeEditor");
const lineNums = document.getElementById("lineNumbers");

function updateLineNumbers() {
  const lines = editor.value.split("\n").length;
  lineNums.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
}

editor.addEventListener("input", () => {
  updateLineNumbers();
  if (document.getElementById("autoUpdate").checked) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderPreview(editor.value), 300);
  }
});

// When auto-update is toggled ON, immediately render current code
document.getElementById("autoUpdate").addEventListener("change", (e) => {
  if (e.target.checked && editor.value.trim()) {
    renderPreview(editor.value);
  }
});

editor.addEventListener("scroll", () => {
  lineNums.scrollTop = editor.scrollTop;
});

editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    editor.dispatchEvent(new Event("input"));
  }
});

// ---------------------------------------------------------------------------
// Resizable panels
// ---------------------------------------------------------------------------
function initResize(handleId, getLeft, getRight, dir) {
  const handle = document.getElementById(handleId);
  let startX, leftStartW, rightStartW, leftEl, rightEl;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    leftEl = getLeft();
    rightEl = getRight();
    startX = e.clientX;
    leftStartW = leftEl.getBoundingClientRect().width;
    rightStartW = rightEl.getBoundingClientRect().width;
    handle.classList.add("active");
    document.body.classList.add("resizing");

    function onMove(e) {
      const dx = e.clientX - startX;
      const newLeft = leftStartW + dx;
      const newRight = rightStartW - dx;
      const minL = parseInt(getComputedStyle(leftEl).minWidth) || 150;
      const minR = parseInt(getComputedStyle(rightEl).minWidth) || 150;
      if (newLeft < minL || newRight < minR) return;
      leftEl.style.width = newLeft + "px";
      leftEl.style.flex = "none";
      if (dir === "flex") {
        rightEl.style.width = newRight + "px";
        rightEl.style.flex = "none";
      }
    }

    function onUp() {
      handle.classList.remove("active");
      document.body.classList.remove("resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

// Sidebar ↔ Main
initResize(
  "sidebarHandle",
  () => document.querySelector(".sidebar"),
  () => document.querySelector(".main"),
  "auto"
);

// Editor ↔ Preview
initResize(
  "editorHandle",
  () => document.querySelector(".editor-pane"),
  () => document.querySelector(".preview-pane"),
  "flex"
);

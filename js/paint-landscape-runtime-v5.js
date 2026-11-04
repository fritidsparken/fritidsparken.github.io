/* Landscape painter v5: applied after the editor creates its own styles. */
(() => {
  const style = document.createElement("style");
  style.id = "fp-painter-landscape-v5";
  style.textContent = `
.fp-paint-back .fp-paint-dialog.fp-landscape-painter {
  display: grid !important;
  box-sizing: border-box !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  padding: clamp(4px, 0.8vh, 10px) !important;
  gap: clamp(3px, 0.5vh, 7px) clamp(5px, 0.8vw, 12px) !important;
  grid-template-columns: minmax(250px, 40%) minmax(0, 1fr) !important;
  grid-template-rows: minmax(30px, auto) minmax(0, 1fr) auto 6px !important;
  overflow: hidden !important;
}
.fp-paint-back:has(.fp-landscape-painter) {
  box-sizing: border-box !important;
  padding: max(3px, env(safe-area-inset-top)) max(3px, env(safe-area-inset-right))
           max(3px, env(safe-area-inset-bottom)) max(3px, env(safe-area-inset-left)) !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-head {
  display: flex !important;
  grid-column: 1 / -1 !important;
  grid-row: 1 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-height: 43px !important;
  gap: 6px !important;
  align-items: center !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-head > div {
  min-width: 0 !important;
  padding-top: 0 !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-head h2 {
  font-size: clamp(15px, 2.5vh, 20px) !important;
  line-height: 1.1 !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-head p { display: none !important; }
.fp-paint-back .fp-landscape-painter .fp-paint-navigation {
  position: static !important;
  transform: none !important;
  display: flex !important;
  gap: 4px !important;
  margin-inline: auto !important;
  flex: 0 0 auto !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-navigation button,
.fp-paint-back .fp-landscape-painter .fp-paint-close {
  box-sizing: border-box !important;
  width: clamp(28px, 5vh, 38px) !important;
  height: clamp(28px, 5vh, 38px) !important;
  min-height: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-tools {
  box-sizing: border-box !important;
  display: grid !important;
  grid-column: 1 !important;
  grid-row: 2 !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  grid-template-rows: repeat(5, minmax(0, 1fr)) !important;
  grid-auto-flow: row !important;
  grid-auto-rows: minmax(0, 1fr) !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  height: 100% !important;
  width: 100% !important;
  gap: clamp(2px, 0.5vh, 6px) !important;
  padding: 0 !important;
  margin: 0 !important;
  align-items: stretch !important;
  align-content: stretch !important;
  overflow: visible !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-tools button,
.fp-paint-back .fp-landscape-painter .fp-paint-tools select {
  box-sizing: border-box !important;
  min-width: 0 !important;
  min-height: 0 !important;
  height: 100% !important;
  width: 100% !important;
  font-size: clamp(9px, 1.9vh, 13px) !important;
  font-weight: 650 !important;
  line-height: 1.06 !important;
  border-radius: 8px !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  padding: 2px 3px !important;
  text-align: center !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-palette {
  box-sizing: border-box !important;
  display: flex !important;
  grid-column: 1 !important;
  grid-row: 3 !important;
  flex-wrap: wrap !important;
  justify-content: flex-start !important;
  align-items: center !important;
  align-content: center !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  height: auto !important;
  width: 100% !important;
  gap: clamp(2px, 0.4vh, 6px) !important;
  padding: 2px !important;
  margin: 0 !important;
  overflow: visible !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-swatch {
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
  width: clamp(17px, 3.3vh, 29px) !important;
  height: clamp(17px, 3.3vh, 29px) !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-custom {
  grid-column: auto !important;
  display: flex !important;
  gap: 3px !important;
  font-size: clamp(9px, 1.6vh, 12px) !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-custom input {
  height: clamp(18px, 3.4vh, 28px) !important;
  width: clamp(18px, 3.4vh, 28px) !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-stage {
  box-sizing: border-box !important;
  grid-column: 2 !important;
  grid-row: 2 / 4 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
.fp-paint-back .fp-landscape-painter .fp-auto-progress {
  grid-column: 1 / -1 !important;
  grid-row: 4 !important;
  height: 6px !important;
  margin: 0 !important;
}
.fp-paint-back .fp-landscape-painter .fp-paint-status {
  display: none !important;
}
@media (max-height: 390px) {
  .fp-paint-back .fp-landscape-painter .fp-paint-swatch { width: 18px !important; height: 18px !important; }
  .fp-paint-back .fp-landscape-painter .fp-paint-palette { gap: 2px !important; }
}
`;
  function placeStyleLast() {
    if (document.head.lastElementChild !== style) document.head.appendChild(style);
  }
  function update() {
    const landscape = window.innerWidth > window.innerHeight;
    const dialog = document.querySelector(".fp-paint-back .fp-paint-dialog");
    if (!dialog) return;
    dialog.classList.toggle("fp-landscape-painter", landscape);
    dialog.setAttribute("data-paint-layout", landscape ? "landscape-v5" : "portrait");
    if (landscape) placeStyleLast();
  }
  const observer = new MutationObserver(update);
  function start() {
    observer.observe(document.body, {childList: true, subtree: true});
    update();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once: true});
  } else start();
  window.addEventListener("resize", update, {passive: true});
  window.addEventListener("orientationchange", update, {passive: true});
})();

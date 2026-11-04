/* Painter landscape v6. Direct inline important styles bypass older painter CSS. */
(() => {
  const rules = [
    ["dialog", "display:grid;width:100%;height:100%;max-width:100%;max-height:100%;box-sizing:border-box;grid-template-columns:minmax(260px,41%) minmax(0,1fr);grid-template-rows:34px minmax(0,1fr) auto 6px;gap:4px 8px;padding:6px;overflow:hidden;border-radius:12px"],
    ["head","grid-column:1/-1;grid-row:1;min-width:0;min-height:0;max-height:34px;display:flex;align-items:center;gap:6px"],
    ["headTitle","padding-top:0;min-width:0"],
    ["headSubtitle","display:none"],
    ["navigation","position:static;left:auto;top:auto;transform:none;display:flex;margin-left:auto;margin-right:auto;gap:4px"],
    ["tools","grid-column:1;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);grid-auto-flow:row;align-content:stretch;align-items:stretch;gap:3px;width:100%;height:100%;max-height:none;min-height:0;min-width:0;overflow:visible;padding:0;margin:0;box-sizing:border-box"],
    ["palette","grid-column:1;grid-row:3;display:flex;flex-wrap:wrap;align-items:center;align-content:center;justify-content:flex-start;gap:3px;width:100%;height:auto;max-height:none;min-height:0;min-width:0;overflow:visible;margin:0;padding:2px;box-sizing:border-box"],
    ["stage","grid-column:2;grid-row:2/4;min-width:0;min-height:0;width:100%;height:100%;box-sizing:border-box"],
    ["progress","grid-column:1/-1;grid-row:4;height:6px;margin:0"],
    ["status","display:none"]
  ];
  const selectors = {
    dialog:".fp-paint-dialog",head:".fp-paint-head",headTitle:".fp-paint-head > div",
    headSubtitle:".fp-paint-head p",navigation:".fp-paint-navigation",tools:".fp-paint-tools",
    palette:".fp-paint-palette",stage:".fp-paint-stage",progress:".fp-auto-progress",
    status:".fp-paint-status"
  };
  const childrenRule = "box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;padding:2px 3px;font-size:clamp(9px,1.8vh,13px);line-height:1.1;white-space:normal;overflow-wrap:anywhere;text-align:center;border-radius:8px";
  const swatchRule = "box-sizing:border-box;flex:0 0 auto;width:clamp(18px,3vh,28px);height:clamp(18px,3vh,28px)";
  const customRule = "grid-column:auto;font-size:11px;gap:3px";
  const customInputRule = "width:24px;height:24px";
  const headButtonRule = "width:32px;height:32px;min-height:0;padding:0";
  const backdropRule = "padding:max(3px,env(safe-area-inset-top)) max(3px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(3px,env(safe-area-inset-left))";
  const active = new Map();
  const set = (node, css) => {
    if (!node) return;
    if (!active.has(node)) active.set(node, new Map());
    const original = active.get(node);
    for (const rule of css.split(";")) {
      const i = rule.indexOf(":");
      if (i < 1) continue;
      const property = rule.slice(0,i).trim(), value = rule.slice(i+1).trim();
      if (!property || !value) continue;
      if (!original.has(property)) original.set(property, [node.style.getPropertyValue(property), node.style.getPropertyPriority(property)]);
      node.style.setProperty(property,value,"important");
    }
  };
  const restore = () => {
    for (const [element, properties] of active) {
      for (const [property, old] of properties) {
        if (old[0]) element.style.setProperty(property,old[0],old[1]);
        else element.style.removeProperty(property);
      }
    }
    active.clear();
  };
  let lastDialog = null;
  function update() {
    const backdrop = document.querySelector(".fp-paint-back");
    const dialog = backdrop?.querySelector(".fp-paint-dialog");
    const landscape = window.innerWidth > window.innerHeight;
    if (!dialog || !landscape) {
      restore();
      if (lastDialog) lastDialog.removeAttribute("data-fp-layout");
      lastDialog = dialog;
      return;
    }
    if (dialog === lastDialog && active.size) return;
    restore();
    lastDialog = dialog;
    dialog.setAttribute("data-fp-layout","landscape-v6");
    set(backdrop,backdropRule);
    for (const [key,rule] of rules) set(dialog.querySelector(selectors[key]) || (key==="dialog" ? dialog : null),rule);
    dialog.querySelectorAll(".fp-paint-tools button,.fp-paint-tools select").forEach(el=>set(el,childrenRule));
    dialog.querySelectorAll(".fp-paint-swatch").forEach(el=>set(el,swatchRule));
    dialog.querySelectorAll(".fp-paint-custom").forEach(el=>set(el,customRule));
    dialog.querySelectorAll(".fp-paint-custom input").forEach(el=>set(el,customInputRule));
    dialog.querySelectorAll(".fp-paint-navigation button,.fp-paint-close").forEach(el=>set(el,headButtonRule));
    const header = dialog.querySelector(".fp-paint-head h2");
    if (header) {
      let indicator = header.querySelector(".fp-layout-indicator");
      if (!indicator) {
        indicator = document.createElement("small");
        indicator.className = "fp-layout-indicator";
        indicator.textContent = " · v6";
        indicator.style.cssText = "font-size:10px;color:#6a8071;font-weight:500;vertical-align:middle";
        header.append(indicator);
      }
    }
  }
  function start() {
    new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  window.addEventListener("resize",update,{passive:true});
  window.addEventListener("orientationchange",update,{passive:true});
})();

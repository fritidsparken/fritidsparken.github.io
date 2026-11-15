/* Banner controls for standalone activities. The main page owns site search
   and seasonal navigation; the light/dark preference is shared locally. */
(() => {
  const header = document.querySelector('.std-header');
  if (!header) return;
  const searchButton = header.querySelector('.std-header-search');
  const searchPanel = header.querySelector('.std-search-panel');
  const seasonButton = header.querySelector('#seasonPicker');
  const seasonPanel = header.querySelector('.std-season-panel');
  const themeButton = header.querySelector('#theme');
  const setOpen = (button, panel, open) => {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };
  searchButton.addEventListener('click', () => {
    const open = searchPanel.hidden;
    setOpen(seasonButton, seasonPanel, false);
    setOpen(searchButton, searchPanel, open);
    if (open) searchPanel.querySelector('input').focus();
  });
  seasonButton.addEventListener('click', () => {
    const open = seasonPanel.hidden;
    setOpen(searchButton, searchPanel, false);
    setOpen(seasonButton, seasonPanel, open);
  });
  document.addEventListener('click', event => {
    if (header.contains(event.target)) return;
    setOpen(searchButton, searchPanel, false);
    setOpen(seasonButton, seasonPanel, false);
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const trigger = !searchPanel.hidden ? searchButton : !seasonPanel.hidden ? seasonButton : null;
    setOpen(searchButton, searchPanel, false);
    setOpen(seasonButton, seasonPanel, false);
    trigger?.focus();
  });
  function applyDark(dark) {
    document.body.classList.toggle('dark', dark);
    themeButton.textContent = dark ? '☀️' : '🌙';
    themeButton.setAttribute('aria-pressed', String(dark));
  }
  try { applyDark(localStorage.fpDark === '1'); } catch {}
  themeButton.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    applyDark(dark);
    try { localStorage.fpDark = dark ? '1' : '0'; } catch {}
  });
  window.addEventListener('storage', event => {
    if (event.key === 'fpDark') applyDark(event.newValue === '1');
  });
})();

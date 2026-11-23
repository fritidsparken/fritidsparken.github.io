/* Print the selected gallery originals as a single PDF. */
(() => {
  const catalog = document.getElementById('catalog');
  const galleries = {
    coloring: { title: 'målarbilder', selected: new Map(), busy: false, notice: '' },
    dolls: { title: 'klippdockor', selected: new Map(), busy: false, notice: '' }
  };
  const originalLabels = new WeakMap();
  let loader;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function checkboxMarkup(motif, gallery = 'coloring') {
    const { selected } = galleries[gallery];
    const source = motif.pdf || motif.img;
    return `<label class="fp-color-select">
      <input type="checkbox" aria-label="Markera ${escapeHtml(motif.title)} för utskrift"
        value="${escapeHtml(source)}" data-print-preview="${escapeHtml(motif.img)}"
        data-print-title="${escapeHtml(motif.title)}"${selected.has(source) ? ' checked' : ''}>
    </label>`;
  }

  function toolbarMarkup(gallery = 'coloring') {
    return `<div class="fp-color-print-bar" data-print-gallery="${gallery}" hidden>
      <span role="status"></span>
      <button type="button" class="primary" data-color-print>Skriv ut</button>
      <button type="button" class="secondary" data-color-clear>Rensa val</button>
    </div>`;
  }

  function activeGallery() {
    return galleries[catalog.querySelector('[data-print-gallery]')?.dataset.printGallery];
  }

  function syncControls() {
    const toolbar = catalog.querySelector('.fp-color-print-bar');
    if (!toolbar) return;
    const { selected, busy, notice } = galleries[toolbar.dataset.printGallery];
    const count = selected.size;
    const batch = count > 1;
    toolbar.hidden = count === 0;
    const status = toolbar.querySelector('[role="status"]');
    const message = notice || (count === 1 ? '1 bild vald' : `${count} bilder valda`);
    if (status.textContent !== message) status.textContent = message;
    const print = toolbar.querySelector('[data-color-print]');
    const label = busy ? 'Förbereder …' : batch ? 'Skriv ut alla' : 'Skriv ut';
    print.disabled = busy;
    if (print.textContent !== label) print.textContent = label;

    for (const card of catalog.querySelectorAll('.mandala-card:has(> .fp-color-select)')) {
      const checkbox = card.querySelector('.fp-color-select input');
      checkbox.checked = selected.has(checkbox.value);
      for (const action of card.querySelectorAll('.mandala-links a, .fp-online-actions :is(a,button)')) {
        if (!batch) {
          if (originalLabels.has(action)) {
            action.textContent = originalLabels.get(action);
            originalLabels.delete(action);
            action.removeAttribute('data-color-print-all');
          }
          continue;
        }
        if (/^(?:🖨️?\s*)?(?:Öppna\s*\/\s*)?Skriv ut$/i.test(action.textContent.trim())) {
          originalLabels.set(action, action.textContent);
        }
        if (!originalLabels.has(action)) continue;
        if (action.textContent !== 'Skriv ut alla') action.textContent = 'Skriv ut alla';
        action.setAttribute('data-color-print-all', '');
      }
    }
  }

  function loadPdfLibrary() {
    if (!loader) {
      loader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/js/vendor/pdf-lib-1.17.1.min.js';
        script.onload = () => resolve(window.PDFLib);
        script.onerror = () => {
          script.remove();
          loader = undefined;
          reject(new Error('PDF library unavailable'));
        };
        document.head.append(script);
      });
    }
    return loader;
  }

  async function fetchOriginal(source) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not load ${source}`);
    return response.blob();
  }

  async function addImage(pdf, blob) {
    const url = URL.createObjectURL(blob);
    const canvas = document.createElement('canvas');
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('Could not prepare image');
      const picture = await pdf.embedPng(await png.arrayBuffer());
      const [width, height] = [595.28, 841.89];
      const margin = 34;
      const size = picture.scaleToFit(width - margin * 2, height - margin * 2);
      pdf.addPage([width, height]).drawImage(picture, {
        x: (width - size.width) / 2, y: (height - size.height) / 2, ...size
      });
    } finally {
      canvas.width = canvas.height = 0;
      URL.revokeObjectURL(url);
    }
  }

  async function addMotif(PDFDocument, output, motif) {
    try {
      const original = await fetchOriginal(motif.source);
      if (original.type === 'application/pdf' || /\.pdf$/i.test(new URL(motif.source, location.href).pathname)) {
        const pdf = await PDFDocument.load(await original.arrayBuffer());
        const pages = await output.copyPages(pdf, pdf.getPageIndices());
        for (const page of pages) output.addPage(page);
      } else {
        await addImage(output, original);
      }
    } catch (error) {
      if (motif.source === motif.preview) throw error;
      await addImage(output, await fetchOriginal(motif.preview));
    }
  }

  async function printSelection(gallery) {
    if (gallery.busy || !gallery.selected.size) return;
    const motifs = [...gallery.selected.values()];
    const popup = window.open('', '_blank');
    if (!popup) {
      gallery.notice = 'Tillåt popupfönster för att öppna utskriften.';
      syncControls();
      return;
    }

    gallery.busy = true;
    gallery.notice = '';
    syncControls();
    popup.opener = null;
    popup.document.title = `Fritidsparken – skriv ut ${gallery.title}`;
    const progress = popup.document.createElement('p');
    popup.document.body.append(progress);
    progress.textContent = 'Förbereder utskriften …';
    let current;
    try {
      const { PDFDocument } = await loadPdfLibrary();
      const output = await PDFDocument.create();
      output.setTitle(`Fritidsparken – ${gallery.title}`);
      for (const [index, motif] of motifs.entries()) {
        if (popup.closed) return;
        current = motif;
        progress.textContent = `Förbereder bild ${index + 1} av ${motifs.length} …`;
        await addMotif(PDFDocument, output, motif);
      }
      const bytes = await output.save();
      if (popup.closed) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      popup.location.replace(url);
      const watcher = setInterval(() => {
        if (!popup.closed) return;
        clearInterval(watcher);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      console.error('Could not prepare printable pages', error);
      gallery.notice = current
        ? `Kunde inte läsa ”${current.title}”. Avmarkera bilden eller försök igen.`
        : 'Kunde inte öppna utskriften. Försök igen.';
      if (!popup.closed) progress.textContent = gallery.notice;
    } finally {
      gallery.busy = false;
      syncControls();
    }
  }

  catalog.addEventListener('change', event => {
    const input = event.target.closest('.fp-color-select input');
    const gallery = input && activeGallery();
    if (!gallery) return;
    const { selected } = gallery;
    if (input.checked) {
      selected.set(input.value, {
        source: input.value, preview: input.dataset.printPreview, title: input.dataset.printTitle
      });
    } else {
      selected.delete(input.value);
    }
    gallery.notice = '';
    syncControls();
  });

  catalog.addEventListener('click', event => {
    const control = event.target.closest('[data-color-clear], [data-color-print], [data-color-print-all]');
    const gallery = control && activeGallery();
    if (!gallery) return;
    if (control.hasAttribute('data-color-clear')) {
      gallery.selected.clear();
      gallery.notice = '';
      syncControls();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    printSelection(gallery);
  }, true);

  new MutationObserver(syncControls).observe(catalog, { childList: true, subtree: true });
  window.FPColoringPrint = { checkboxMarkup, toolbarMarkup };
})();

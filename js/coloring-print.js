/* Print ready-to-use pages in the browser’s native print dialog. */
(() => {
  const catalog = document.getElementById('catalog');
  const galleries = {
    coloring: { title: 'målarbilder', selected: new Map(), busy: false, notice: '' },
    dolls: { title: 'klippdockor', selected: new Map(), busy: false, notice: '' }
  };
  const originalLabels = new WeakMap();
  let loader;
  let printDocument;

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

  function loadPdfRenderer() {
    if (!loader) {
      loader = import('/js/vendor/pdfjs-4.10.38/pdf.min.mjs').then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = '/js/vendor/pdfjs-4.10.38/pdf.worker.min.mjs';
        return pdfjs;
      }).catch(error => {
        loader = undefined;
        throw error;
      });
    }
    return loader;
  }

  async function fetchOriginal(source) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not load ${source}`);
    return response.blob();
  }

  function createPrintDocument(title) {
    const frame = document.createElement('iframe');
    frame.title = title;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:718px;height:1040px;border:0';
    document.body.append(frame);

    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html lang="sv"><head><meta charset="utf-8"><style>
      @page { size: A4 portrait; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
      .print-sheet {
        box-sizing: border-box;
        display: block;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 10mm;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      /* Percentages follow the actual printable page area, including the user's
         paper and margin settings. A fixed height can spill onto a blank sheet. */
      /* Start a new sheet only between motifs; never create a trailing blank page. */
      .print-sheet + .print-sheet {
        break-before: page;
        page-break-before: always;
      }
      .print-sheet img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    </style></head><body></body></html>`);
    doc.close();
    doc.title = title;
    const urls = [];
    return {
      doc, urls,
      dispose() {
        frame.remove();
        for (const url of urls) URL.revokeObjectURL(url);
      }
    };
  }

  async function appendImage(print, pages, blob) {
    const image = print.doc.createElement('img');
    const url = URL.createObjectURL(blob);
    print.urls.push(url);
    image.src = url;
    await image.decode();

    const sheet = print.doc.createElement('section');
    sheet.className = 'print-sheet';
    sheet.append(image);
    pages.append(sheet);
  }

  async function appendPdf(print, pages, blob) {
    const { getDocument } = await loadPdfRenderer();
    const task = getDocument({
      data: await blob.arrayBuffer(),
      ownerDocument: print.doc,
      isEvalSupported: false,
      useSystemFonts: true
    });
    try {
      const pdf = await task.promise;
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 1800 / Math.max(base.width, base.height) });
        const canvas = print.doc.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        try {
          await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport,
            intent: 'print',
            background: '#fff'
          }).promise;
          const image = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          if (!image) throw new Error('Could not prepare PDF page');
          await appendImage(print, pages, image);
        } finally {
          canvas.width = canvas.height = 0;
          page.cleanup();
        }
      }
    } finally {
      await task.destroy();
    }
  }

  async function appendMotif(print, motif) {
    const firstUrl = print.urls.length;
    let pages = print.doc.createDocumentFragment();
    try {
      const original = await fetchOriginal(motif.source);
      const path = new URL(motif.source, location.href).pathname;
      if (original.type === 'application/pdf' || /\.pdf$/i.test(path)) {
        await appendPdf(print, pages, original);
      } else {
        await appendImage(print, pages, original);
      }
    } catch (error) {
      for (const url of print.urls.splice(firstUrl)) URL.revokeObjectURL(url);
      if (motif.source === motif.preview) throw error;
      pages = print.doc.createDocumentFragment();
      await appendImage(print, pages, await fetchOriginal(motif.preview));
    }
    print.doc.body.append(pages);
  }

  async function printSelection(gallery) {
    if (!gallery.selected.size || Object.values(galleries).some(item => item.busy)) return;
    const motifs = [...gallery.selected.values()];
    gallery.busy = true;
    gallery.notice = '';
    syncControls();
    let current;
    try {
      printDocument?.dispose();
      printDocument = createPrintDocument(`Fritidsparken – ${gallery.title}`);
      for (const motif of motifs) {
        current = motif;
        await appendMotif(printDocument, motif);
      }
      // Let the browser finish the image/layout task before entering print mode.
      await new Promise(resolve => setTimeout(resolve, 0));
      // All pages and images are ready before showing the native dialog.
      current = undefined;
      const view = printDocument.doc.defaultView;
      view.focus();
      view.print();
    } catch (error) {
      console.error('Could not print selected pages', error);
      printDocument?.dispose();
      printDocument = undefined;
      gallery.notice = current
        ? `Kunde inte läsa ”${current.title}”. Avmarkera bilden eller försök igen.`
        : 'Kunde inte öppna utskriften. Försök igen.';
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

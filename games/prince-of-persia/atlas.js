"use strict";

// Standard ZIP (stored entries). The PNG images are already compressed.
function imageArchive(files) {
  const crcTable = Uint32Array.from({
    length: 256
  }, (_, i) => {
    let c = i;
    for (let n = 0; n < 8; n++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1;
    return c >>> 0;
  });
  const crc = buf => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 255] ^ c >>> 8;
    return (c ^ 0xffffffff) >>> 0;
  };
  function header(len, fields) {
    const u = new Uint8Array(len),
      v = new DataView(u.buffer);
    for (const [off, bytes, value] of fields) {
      if (bytes === 4) v.setUint32(off, value, true);else v.setUint16(off, value, true);
    }
    return u;
  }
  const parts = [],
    centers = [];
  let offset = 0,
    centralSize = 0;
  for (const file of files) {
    const nm = new TextEncoder().encode(file.name),
      buf = file.bytes,
      len = buf.length,
      hash = crc(buf);
    const a = header(30, [[0, 4, 0x04034b50], [4, 2, 20], [6, 2, 0x0800], [12, 2, 0x0021], [14, 4, hash], [18, 4, len], [22, 4, len], [26, 2, nm.length]]);
    const b = header(46, [[0, 4, 0x02014b50], [4, 2, 20], [6, 2, 20], [8, 2, 0x0800], [14, 2, 0x0021], [16, 4, hash], [20, 4, len], [24, 4, len], [28, 2, nm.length], [42, 4, offset]]);
    parts.push(a, nm, buf);
    centers.push(b, nm);
    centralSize += b.length + nm.length;
    offset += a.length + nm.length + len;
  }
  const end = header(22, [[0, 4, 0x06054b50], [8, 2, files.length], [10, 2, files.length], [12, 4, centralSize], [16, 4, offset]]);
  return new Blob([...parts, ...centers, end], {
    type: 'application/zip'
  });
}
function showReference(n) {
  atlasIndex = (n + 10) % 10;
  const r = ROOMS[atlasIndex];
  nextPaint = 0;
  $('artName').textContent = r.name;
  $('artNo').textContent = String(atlasIndex + 1).padStart(2, '0') + ' / 10';
  $('artDesc').textContent = r.line;
  Array.from($('thumbs').children).forEach((el, i) => el.setAttribute('aria-pressed', String(i === atlasIndex)));
}
$('atlas').onclick = () => {
  clearInput();
  atlasOpen = true;
  albumTime = ambientTime;
  $('art').append(palaceSurface);
  activeRoom = -1;
  showReference(Math.min(9, route.index));
  $('book').showModal();
};
$('closeBook').onclick = () => $('book').close();
$('book').addEventListener('close', () => {
  atlasOpen = false;
  canvas.before(palaceSurface);
  activeRoom = -1;
  nextPaint = 0;
  clearInput();
  last = performance.now();
});
$('prevArt').onclick = () => showReference(atlasIndex - 1);
$('nextArt').onclick = () => showReference(atlasIndex + 1);
function asPNG(r) {
  const c = document.createElement('canvas');
  c.width = 1672;
  c.height = 941;
  c.getContext('2d').drawImage(images[r.key === 'guardianRoom' ? 'guardianReference' : r.key], 0, 0);
  return new Promise((resolve, reject) => c.toBlob(blob => blob ? resolve(blob) : reject(Error('PNG')), 'image/png'));
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
$('saveArt').onclick = async () => {
  const r = ROOMS[atlasIndex];
  downloadBlob(await asPNG(r), r.key + '.png');
};
$('saveAll').onclick = async () => {
  const b = $('saveAll');
  b.disabled = true;
  try {
    const files = [];
    for (let i = 0; i < 10; i++) {
      b.textContent = 'Packar ' + (i + 1) + ' / 10';
      const r = ROOMS[i];
      files.push({
        name: r.key + '.png',
        bytes: new Uint8Array(await (await asPNG(r)).arrayBuffer())
      });
    }
    downloadBlob(imageArchive(files), 'Solportens_vag_10_referensbilder.zip');
  } catch {
    msg('Bilderna kunde inte packas. De kan även hämtas en i taget.');
  } finally {
    b.disabled = false;
    b.textContent = 'Hämta alla 10 (ZIP)';
  }
};
for (let n = 0; n < 10; n++) {
  const r = ROOMS[n],
    tick = document.createElement('i');
  $('progress').append(tick);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = r.name;
  btn.setAttribute('aria-label', n + 1 + '. ' + r.name);
  btn.onclick = () => showReference(n);
  const im = document.createElement('img');
  im.alt = '';
  im.loading = 'lazy';
  im.src = sources[r.key === 'guardianRoom' ? 'guardianReference' : r.key];
  btn.append(im);
  const num = document.createElement('span');
  num.textContent = String(n + 1).padStart(2, '0');
  btn.append(num);
  $('thumbs').append(btn);
}

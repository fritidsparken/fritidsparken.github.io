// The reference artwork is raster. Find pen routes in its chalk marks, then
// reveal the original pixels along those routes, including the chalk texture.
(() => {
 const scale = 2;
 const columns = 186, rows = 249, size = columns * rows;
 const around = [-columns, 1-columns, 1, 1+columns, columns, columns-1, -1, -1-columns];
 const cardinal = [-columns, 1, columns, -1];

 function readPanel(reference, index) {
  const panel = document.createElement('canvas');
  panel.width = columns * scale;
  panel.height = rows * scale;
  const ctx = panel.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(reference, index * 388, 0, panel.width, panel.height, 0, 0, panel.width, panel.height);
  return ctx.getImageData(0, 0, panel.width, panel.height);
 }

 function inkPixels(image, colored) {
  const {data, width} = image;
  const ink = new Uint8Array(size);
  const shade = new Int16Array(size);
  let badgeRight = 0, badgeBottom = 0;
  for (let y = 3; y < rows-3; y++) {
   for (let x = 3; x < columns-3; x++) {
    let r = -1, g = 0, b = 0;
    for (let dy = 0; dy < scale; dy++) {
     for (let dx = 0; dx < scale; dx++) {
      const at = ((y*scale+dy)*width+x*scale+dx)*4;
      if (data[at] > r) [r, g, b] = [data[at], data[at+1], data[at+2]];
     }
    }
    const at = y*columns+x;
    if (x < 43 && y < 44 && r > 145 && r-g > 42 && g-b > 12) {
     badgeRight = Math.max(badgeRight, x);
     badgeBottom = Math.max(badgeBottom, y);
    }
    ink[at] = (r > 56 && r*1.32 > g) || (colored && ((r+g+b > 145 && r+g > b*2.6) || b > 70));
    // Group adjacent colored pixels with a similar hue for progressive fills.
    shade[at] = Math.round((r-g)/36) + 10*Math.round((g-b)/36) + 100*Math.round((r+g+b)/240);
   }
  }
  if (badgeRight && badgeBottom) {
   for (let y = 0; y <= badgeBottom+1; y++) {
    for (let x = 0; x <= badgeRight+1; x++) ink[y*columns+x] = 0;
   }
  }
  return {ink, shade};
 }

 // Zhang–Suen thinning keeps one centerline through each connected mark.
 function centerlines(ink) {
  const lines = ink.slice();
  let changed;
  do {
   changed = false;
   for (let pass = 0; pass < 2; pass++) {
    const remove = [];
    for (let p = columns; p < size-columns; p++) {
     if (!lines[p]) continue;
     const n = around.map(offset => lines[p+offset]);
     const neighbors = n.reduce((sum, value) => sum+value, 0);
     if (neighbors < 2 || neighbors > 6) continue;
     const turns = n.reduce((sum, value, i) => sum+(!value && n[(i+1)%8]), 0);
     if (turns !== 1) continue;
     const joins = pass ? n[0]*n[2]*n[6] || n[0]*n[4]*n[6] : n[0]*n[2]*n[4] || n[2]*n[4]*n[6];
     if (!joins) remove.push(p);
    }
    for (const p of remove) lines[p] = 0;
    changed ||= remove.length > 0;
   }
  } while (changed);
  return lines;
 }

 function penRoutes(lines) {
  function neighbors(p) {
   return around.map((offset, i) => {
    // At square corners, a diagonal would cut across a real orthogonal join.
    if (i%2 && (lines[p+around[i-1]] || lines[p+around[(i+1)%8]])) return -1;
    return p+offset;
   }).filter(q => lines[q]);
  }

  const visited = new Uint8Array(size);
  const routes = [];
  function trace(start) {
   const route = [];
   let p = start, previous = -1;
   while (p !== undefined) {
    route.push(p);
    visited[p] = 1;
    const choices = neighbors(p).filter(q => !visited[q]);
    if (choices.length > 1 && previous >= 0) {
     const dx = p%columns-previous%columns, dy = (p/columns|0)-(previous/columns|0);
     const direction = q => {
      const x = q%columns-p%columns, y = (q/columns|0)-(p/columns|0);
      return (dx*x+dy*y)/Math.hypot(x,y);
     };
     choices.sort((a,b) => direction(b)-direction(a));
    }
    previous = p;
    p = choices[0];
   }
   routes.push(route);
  }

  for (let p = 0; p < size; p++) if (lines[p] && !visited[p] && neighbors(p).length === 1) trace(p);
  for (let p = 0; p < size; p++) if (lines[p] && !visited[p]) trace(p);
  return routes.sort((a,b) => b.length-a.length);
 }

 function colorRegions(ink, shade) {
  const regions = [], seen = new Uint8Array(size);
  for (let p = 0; p < size; p++) {
   if (!ink[p] || seen[p]) continue;
   const region = [p];
   seen[p] = 1;
   for (let i = 0; i < region.length; i++) {
    for (const offset of around) {
     const q = region[i]+offset;
     if (!ink[q] || seen[q] || shade[q] !== shade[p]) continue;
     seen[q] = 1;
     region.push(q);
    }
   }
   regions.push(region);
  }
  return regions.sort((a,b) => b.length-a.length);
 }

 function nearestPixels(ink, seeds, offsets) {
  const owner = new Int32Array(size).fill(-1);
  const queue = new Int32Array(size);
  let end = 0;
  for (const p of seeds) {
   owner[p] = p;
   queue[end++] = p;
  }
  for (let i = 0; i < end; i++) {
   const p = queue[i], x = p%columns;
   for (const offset of offsets) {
    if ((x === 0 && (p+offset)%columns === columns-1) ||
        (x === columns-1 && (p+offset)%columns === 0)) continue;
    const q = p+offset;
    if (q < 0 || q >= size || owner[q] !== -1 || !ink[q]) continue;
    owner[q] = owner[p];
    queue[end++] = q;
   }
  }
  return owner;
 }

 function retainedRoute(route, previousInk) {
  if (!previousInk) return false;
  let matching = 0;
  for (const p of route) {
   // The successive reference drawings can shift slightly within their panels.
   for (let dy = -3; dy <= 3; dy++) {
    const row = (p/columns|0)+dy, x = p%columns;
    if (row < 0 || row >= rows) continue;
    if (!previousInk.subarray(row*columns+Math.max(0,x-3),row*columns+Math.min(columns,x+4)).includes(1)) continue;
    matching++;
    break;
   }
  }
  return matching > route.length*.85;
 }

 window.prepareDrawingReference = (reference, index) => {
  const source = readPanel(reference, index);
  const colored = index === 4;
  const {ink, shade} = inkPixels(source, colored);
  const previous = index ? readPanel(reference, index-1) : null;
  const previousInk = previous && !colored ? inkPixels(previous, false).ink : null;
  const groups = colored ? colorRegions(ink, shade) : penRoutes(centerlines(ink));
  const retained = groups.map(group => !colored && retainedRoute(group, previousInk));
  if (groups.length && !retained.some((keep, i) => !keep && groups[i].length >= 8)) retained[0] = false;
  const timing = new Float64Array(size);
  const points = [];
  let time = 0;
  groups.forEach((group, index) => {
   const duration = retained[index] ? 0 : colored ? 8*Math.sqrt(group.length) : group.length > 4 ? 55+group.length*9 : group.length*7;
   group.forEach((p, i) => {
    timing[p] = duration ? time+duration*(i+1)/group.length : 0;
    points.push(p);
   });
   time += duration;
  });

  // Include the antialiased fringe so waiting strokes leave no chalk outline.
  // Keep this separate from the centerline calculation.
  const reveal = ink.slice();
  if (!colored) {
   for (const p of ink.keys()) {
    if (!ink[p]) continue;
    for (const offset of around) {
     reveal[p+offset] = 1;
     reveal[p+2*offset] = 1;
    }
   }
  }
  const paper = [];
  for (let p = 0; p < size; p++) if (!reveal[p]) paper.push(p);
  const background = nearestPixels(reveal, paper, cardinal);
  const nearest = colored ? null : nearestPixels(reveal, points, around);
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const frame = ctx.createImageData(source.width, source.height);
  const original = new Uint32Array(source.data.buffer);
  const output = new Uint32Array(frame.data.buffer);
  output.set(original);

  function copyBlock(p, from, dest) {
   const width = source.width;
   const to = (Math.floor(p/columns)*width+p%columns)*scale;
   const start = (Math.floor(from/columns)*width+from%columns)*scale;
   for (let y = 0; y < scale; y++) {
    for (let x = 0; x < scale; x++) output[to+y*width+x] = dest[start+y*width+x];
   }
  }

  const prior = colored ? new Uint32Array(previous.data.buffer) : null;
  const updates = [];
  for (let p = 0; p < size; p++) {
   if (!reveal[p]) continue;
   const owner = nearest?.[p] ?? p;
   const delay = owner < 0 ? time : timing[owner];
   if (delay === 0) continue;
   // Start from the board underneath the ink, with the previous drawing
   // resting underneath the final coat of color.
   if (colored) {
    copyBlock(p, p, prior);
   } else {
    copyBlock(p, background[p], original);
   }
   updates.push({p, delay});
  }
  updates.sort((a,b) => a.delay-b.delay);
  const moving = points.filter(p => timing[p] > 0);
  let next = 0, penAt = 0;
  ctx.putImageData(frame, 0, 0);
  return {
   canvas,
   duration: Math.max(1800, Math.min(12500, time)),
   paint(progress) {
    const now = progress === 1 ? Infinity : progress*time;
    const displayed = next;
    while (next < updates.length && updates[next].delay <= now) {
     const {p} = updates[next++];
     copyBlock(p, p, original);
    }
    if (next !== displayed) ctx.putImageData(frame, 0, 0);
    if (colored || !moving.length) return null;
    while (penAt+1 < moving.length && timing[moving[penAt+1]] <= now) penAt++;
    const p = moving[penAt];
    return {x: (p%columns+.5)*scale, y: (Math.floor(p/columns)+.5)*scale};
   }
  };
 };
})();

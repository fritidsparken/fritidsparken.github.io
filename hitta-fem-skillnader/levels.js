/* The right image is composed from the same original and only these five removal masks. */
window.FP_DIFFERENCE_LEVELS = [{
  id: 'parken',
  title: 'Parken',
  image: 'assets/parken.webp',
  removedImage: 'assets/parken-utan.webp',
  width: 1536,
  height: 1024,
  targets: [
    { id: 'boll', label: 'bollen', x: 0.234, y: 0.830, rx: 0.042, ry: 0.061,
      mask: { x: 0.234, y: 0.838, rx: 0.048, ry: 0.067 } },
    { id: 'katt', label: 'katten', x: 0.588, y: 0.563, rx: 0.043, ry: 0.066,
      mask: { x: 0.588, y: 0.563, rx: 0.043, ry: 0.065 } },
    { id: 'anka', label: 'ankan', x: 0.762, y: 0.831, rx: 0.043, ry: 0.056,
      mask: { x: 0.762, y: 0.859, rx: 0.047, ry: 0.079 } },
    { id: 'drake', label: 'draken', x: 0.294, y: 0.162, rx: 0.052, ry: 0.079,
      mask: { x: 0.294, y: 0.162, rx: 0.060, ry: 0.090 } },
    { id: 'vattenkanna', label: 'vattenkannan', x: 0.860, y: 0.643, rx: 0.057, ry: 0.072,
      mask: { x: 0.860, y: 0.647, rx: 0.060, ry: 0.075 } }
  ]
}];

// Shared thumb control for Downhill and Skatepark. Up is positive throttle.
function createRideStick(base) {
  const stick = { x: 0, y: 0, reset };
  const knob = base.firstElementChild;
  let pointer = null;

  function reset() {
    const previous = pointer;
    pointer = null;
    if (previous !== null && base.hasPointerCapture(previous))
      base.releasePointerCapture(previous);
    stick.x = stick.y = 0;
    knob.style.transform = "";
  }
  function move(e) {
    if (e.pointerId !== pointer) return;
    const box = base.getBoundingClientRect();
    const radius = (box.width - knob.offsetWidth) / 2;
    const dx = (e.clientX - box.left - box.width / 2) / radius;
    const dy = (e.clientY - box.top - box.height / 2) / radius;
    const distance = Math.hypot(dx, dy);
    const scale = 1 / Math.max(1, distance);
    const x = dx * scale, y = dy * scale;
    knob.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    const axis = value => Math.sign(value) * Math.max(0, Math.abs(value) - 0.12) / 0.88;
    stick.x = axis(x);
    stick.y = axis(-y);
  }
  base.onpointerdown = e => {
    if (pointer !== null || e.button !== 0) return;
    e.preventDefault();
    pointer = e.pointerId;
    base.setPointerCapture(pointer);
    move(e);
  };
  base.onpointermove = move;
  base.onpointerup = base.onpointercancel = base.onlostpointercapture = e => {
    if (e.pointerId === pointer) reset();
  };
  return stick;
}

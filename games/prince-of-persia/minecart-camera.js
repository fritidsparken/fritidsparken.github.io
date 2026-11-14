// The camera shares the cart's heading on rails. At a fall, only its aim moves:
// its world position stays fixed above the rim until the checkpoint respawn.
export function createCartCamera(THREE, camera) {
  const offset = new THREE.Vector3(), target = new THREE.Vector3();
  const frozenPosition = new THREE.Vector3(), aim = new THREE.Vector3();
  const frozenRotation = new THREE.Quaternion();
  let falling = false, initialized = false;
  return {
    reset() { falling = false; initialized = false; },
    update(position, orientation, status, dt, portrait = false) {
      if (status === 'falling' && !falling && initialized) {
        frozenPosition.copy(camera.position);frozenRotation.copy(camera.quaternion);
        camera.getWorldDirection(aim).multiplyScalar(8).add(camera.position);
        falling = true;
      }
      if (status !== 'falling') falling = false;
      if (falling) {
        camera.position.copy(frozenPosition);
        camera.quaternion.copy(frozenRotation);
      } else {
        offset.set(0, portrait ? 3.8 : 3.6, portrait ? -8.3 : -6.8).applyQuaternion(orientation);
        camera.position.copy(position).add(offset);
        target.set(0, 1.65, 1).applyQuaternion(orientation).add(position);
        camera.up.set(0, 1, 0);
        camera.lookAt(target);
        initialized = true;
      }
    },
    get frozen() { return falling; }
  };
}

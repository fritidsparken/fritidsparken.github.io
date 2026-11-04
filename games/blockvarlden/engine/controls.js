export function controls(canvas,api){
 const keys=new Set(),$=id=>document.getElementById(id);let sx=0,sy=0,look=null,lastX=0,lastY=0,stickId=null;
 const clear=()=>{keys.clear();sx=sy=0;look=stickId=null;$('stick').firstElementChild.style.transform='';api.mine(false)};
 addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
 addEventListener('keydown',e=>{if(!api.active())return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','F5','Tab'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(e.code==='KeyE')api.pack();if(e.code==='Escape')api.pause();if(e.code==='F5'||e.code==='KeyV')api.camera();if(e.code==='KeyF')api.fly();if(/^Digit[1-9]$/.test(e.code))api.slot(+e.code.slice(-1)-1)});
 addEventListener('keyup',e=>keys.delete(e.code));document.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.onpointerdown=e=>{if(!api.active())return;if(e.pointerType==='mouse'){if(document.pointerLockElement!==canvas){const r=canvas.requestPointerLock?.();r?.catch?.(()=>{});return}if(e.button===0)api.mine(true);if(e.button===2)api.build()}else if(look===null){look=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(look)}};
 canvas.onpointermove=e=>{if(!api.active())return;if(e.pointerType==='mouse'&&document.pointerLockElement===canvas)api.turn(e.movementX,e.movementY);else if(e.pointerId===look){api.turn(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY}};
 const up=e=>{if(e.pointerId===look)look=null;if(e.pointerType==='mouse')api.mine(false)};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
 const stick=$('stick'),drag=e=>{const r=stick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/28,y=(e.clientY-r.top-r.height/2)/28;const n=Math.max(1,Math.hypot(x,y));sx=x/n;sy=-y/n;stick.firstElementChild.style.transform='translate('+sx*22+'px,'+-sy*22+'px)'};
 stick.onpointerdown=e=>{stickId=e.pointerId;stick.setPointerCapture(stickId);drag(e)};stick.onpointermove=e=>{if(e.pointerId===stickId)drag(e)};stick.onlostpointercapture=()=>{stickId=null;sx=sy=0;stick.firstElementChild.style.transform=''};
 for(const [id,code] of [['jump','Space'],['down','ShiftLeft'],['dig','Mine']]){const b=$(id);b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);if(code==='Mine')api.mine(true);else keys.add(code)};b.onlostpointercapture=()=>{if(code==='Mine')api.mine(false);else keys.delete(code)}}
 $('build').onclick=api.build;$('pack').onclick=api.pack;$('pause').onclick=api.pause;$('cam').onclick=api.camera;
 const has=(...c)=>c.some(k=>keys.has(k));
 return {clear,read:()=>({f:sy+has('KeyW','ArrowUp')-has('KeyS','ArrowDown'),r:sx+has('KeyD','ArrowRight')-has('KeyA','ArrowLeft'),up:has('Space'),down:has('ShiftLeft','ShiftRight'),sprint:has('ControlLeft','ControlRight')})}
}

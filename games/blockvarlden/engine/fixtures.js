// Walkable horizontal surfaces and body blockers in model-local coordinates.
const specs={stairs:[.50,.50,1],slab:[.50,.50,.5],bed:[.55,.90,.58],chest:[.48,.38,.8],table:[.58,.42,.92],workbench:[.56,.46,.94],chair:[.30,.30,.54],door:[.52,.10,1.9],window:[.5,.12,1],fence:[.52,.13,1.15],railing:[.52,.13,1.12]};
function local(p,o,pad){const id=o.userData.record.id,b=specs[id];if(!b)return null;const dx=p.x-o.position.x,dz=p.z-o.position.z,c=Math.cos(o.rotation.y),s=Math.sin(o.rotation.y),x=dx*c-dz*s,z=dx*s+dz*c;
 if(Math.abs(x)>=b[0]+pad||Math.abs(z)>=b[1]+pad)return null;return o.position.y+(id==='stairs'?Math.min(1,(Math.floor(Math.max(0,Math.min(.999,.5-z))*4)+1)/4):b[2])}
export function fixtureHit(root,p){for(const o of root.children){const top=local(p,o,.23);if(top!==null&&p.y<top-.002&&p.y+1.72>o.position.y)return true}return false}
export function stepHeight(root,p){let top=p.y;for(const o of root.children){const h=local(p,o,.23);if(h!==null&&h>=p.y-.01&&h<=p.y+.52)top=Math.max(top,h)}return top}

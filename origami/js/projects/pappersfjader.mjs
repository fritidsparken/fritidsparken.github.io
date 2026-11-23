// Two strips of dyed paper, in millimetres. Each arm crosses two cells per course.
const width = 5;
const courses = 26;
const pi = Math.PI;
const colors = ['#1886c4', '#ec3854'];
const zero = [0, 0, 0];
const clamp = t => Math.max(0, Math.min(1, t));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const point = (x, y) => [x, y, 0];

// Rotate around a crease in the original sheet. Applying the child hinge first
// carries its axis with the parent, including while the paper is off the table.
function crease([x, y, z], cx, cy, dx, dy, angle) {
  const u = (x-cx)*dx + (y-cy)*dy;
  const v = -(x-cx)*dy + (y-cy)*dx;
  const vy = v*Math.cos(angle) - z*Math.sin(angle);
  return [cx+dx*u-dy*vy, cy+dy*u+dx*vy, v*Math.sin(angle)+z*Math.cos(angle)];
}

const start = { blue: 0, red: 0, link: 0, left: 0, up: 0, folds: 0, turn: 0, stretch: 0, bend: 0 };
const instructions = [
  ['Vik den röda remsan till ett U nära mitten. Gör två sneda veck från samma hörn så att ändarna ligger bredvid varandra.', {red:1}],
  ['Vik den blå remsan likadant. Nu har du två U med två ändar på varje.', {blue:1}],
  ['Haka ihop böjarna i rät vinkel. De blå ändarna pekar åt höger och de röda nedåt.', {link:1}],
  ['Vik den övre blå änden tillbaka åt vänster över den röda böjen.', {left:1}],
  ['Vik den övre röda änden uppåt och håll i mitten. Nu pekar en ände åt varje håll.', {up:1}],
  ['Lås mitten. Vik de fyra ändarna runt i tur och ordning. Trä den sista under den första och dra åt tills du ser fyra rutor.', {folds:4}],
  ['Vik den högra blå änden åt vänster. Lämna en liten ögla vid vecket.', {folds:5}],
  ['Vik den nedre röda änden uppåt över den blå.', {folds:6}],
  ['Vik den vänstra blå änden åt höger över den röda.', {folds:7}],
  ['Trä den övre röda änden ned genom den första blå öglan. Dra försiktigt i alla fyra ändarna.', {folds:8}],
  ['Gör ett varv till från andra hållet. Vik blå, röd, blå och trä den sista röda änden under den första blå.', {folds:12}],
  ['Fortsätt på samma sätt. Byt håll efter varje varv och dra åt så att rutorna ligger kant i kant.', {folds:courses*4}],
  ['Lägg fjädern på sidan och dra varsamt isär ändarna. Nu syns de blå och röda vecken.', {turn:1,stretch:1}],
  ['Böj fjädern mjukt till en båge och släpp efter lite. Din pappersfjäder är klar!', {bend:1}]
];

const snapshots = [start];
for (const [,changes] of instructions) snapshots.push({...snapshots.at(-1),...changes});

// At the starter the two diagonal creases make a doubled end with the tails
// adjacent rather than stacked. Reversing the upper tail opens a 2 × 2 base.
function transformStarter(p, color, section, pose) {
  const fold = color === 0 ? pose.blue : pose.red;
  const open = color === 0 ? pose.left : pose.up;
  if (section >= 3) p = crease(p, width, 0, 0, -1, pi*open);
  if (section >= 2) p = crease(p, 0, 0, Math.SQRT1_2, -Math.SQRT1_2, -pi*smooth(fold*2-1));
  if (section >= 1) p = crease(p, 0, 0, Math.SQRT1_2, Math.SQRT1_2, -pi*smooth(fold*2));
  const angle = color === 0 ? -pi/2 - pose.link*pi/2 : -pi/2;
  const side = color === 0 ? 1 : -1;
  const x = p[0]*Math.cos(angle)-p[1]*Math.sin(angle)+side*2*width*(1-pose.link);
  const y = p[0]*Math.sin(angle)+p[1]*Math.cos(angle);
  return [x,y,p[2]+(color === 0 ? .045 + width*.4*Math.sin(pi*pose.link) : 0)];
}

// Transport each pleat around the centre curve as a rigid piece. The change
// in direction between courses models the softly bowed finished spring.
function displayPoint([x,y,z], s, total, pose) {
  if (!pose.turn) return [x,y,z];
  const roll = .47*pose.turn;
  [x,y] = [x*Math.cos(roll)-y*Math.sin(roll),x*Math.sin(roll)+y*Math.cos(roll)];
  const curvature = 2.28*pose.bend;
  const a = curvature*(s/total-.5);
  const radius = curvature ? total/curvature : 0;
  const cy = curvature ? radius*(Math.cos(-curvature/2)-Math.cos(a)) : 0;
  const cz = curvature ? radius*(Math.sin(a)-Math.sin(-curvature/2)) : s;
  const yy = cy + y*Math.cos(a) + (z-s)*Math.sin(a);
  const zz = cz - y*Math.sin(a) + (z-s)*Math.cos(a);
  const turn = 1.19*pose.turn;
  return [x*Math.cos(turn)+zz*Math.sin(turn), yy, -x*Math.sin(turn)+zz*Math.cos(turn)];
}

const arms = [
  {color:0,east:false}, // right, blue
  {color:1,east:true},  // top, red
  {color:0,east:true},  // left, blue
  {color:1,east:false}  // bottom, red
];

function stateAt(pose, splitCourses, focus) {
  const panels = [];
  const pitch = mix(.055,.20,pose.stretch) - .060*pose.bend;
  // The first and last courses are firmly pressed to leave a closed square
  // end. The interior pleats open farther, as in the flexible paper toy.
  const angles = Array.from({length:courses},(_,i)=> {
    const distance = Math.min(i,courses-1-i);
    return mix(mix(.055,.012,pose.stretch),pitch,Math.min(1,distance/2));
  });
  const levels = [0];
  for (const angle of angles) levels.push(levels.at(-1)+2*width*Math.sin(angle));
  const total = levels.at(-1);
  function panel(id,color,section,points,course=0,clearance=0) {
    const level = course===0 ? 0 : mix(levels[Math.floor(course)],levels[Math.ceil(course)],course%1);
    const cutEdges=points.flatMap((p,i)=>p[1]===points[(i+1)%points.length][1] ? [i] : []);
    const base=displayPoint(zero,level,total,pose);
    const layerOffset=clearance ? displayPoint([0,0,clearance],level,total,pose).map((v,i)=>v-base[i]) : zero;
    panels.push({id,material:color,color:colors[color],cutEdges,tags:[],front:true,layerOffset,
      points:points.map(p=>displayPoint(transformStarter(p,color,section,pose),level,total,pose))});
  }
  for (const color of [0,1]) {
    const a = point(-width,-width), b = point(0,0), c = point(width,-width);
    panel(color+'-base-0',color,0,[a,b,point(-width,0)]);
    panel(color+'-base-1',color,1,[a,c,b]);
    panel(color+'-base-2',color,2,[b,c,point(width,0)]);
    panel(color+'-base-3',color,3,[c,point(3*width,-width),point(3*width,0),point(width,0)]);
  }
  for (let arm=0; arm<4; arm++) {
    const {color,east} = arms[arm];
    let x = east ? 3*width : -width;
    let z = 0;
    let angle = 0;
    const section = east ? 3 : 0;
    function addLength(id,length,course,clearance=0) {
      const nx=x+(east?1:-1)*length*Math.cos(angle);
      const nz=z+(east?-1:1)*length*Math.sin(angle);
      panel(arm+'-'+id,color,section,[[x,-width,z],[nx,-width,nz],[nx,0,nz],[x,0,z]],course,clearance);
      x=nx; z=nz;
    }
    for (let j=0;j<splitCourses;j++) {
      // Every other course works in the opposite order. The last end slips
      // below the first: their opposing slopes cross over different cells.
      const order = j%2 ? (6-arm)%4 : arm;
      const t = clamp(pose.folds-(j*4+order));
      const target = j%2 ? angles[j] : pi-angles[j];
      angle = mix(angle,target,t);
      // Keep the first loop open while the fourth end is being threaded.
      if (order===0 && t===1) {
        const loop = clamp(j*4+4-pose.folds);
        angle += (j%2 ? 1 : -1)*.16*loop;
      }
      // A pressed end still has two paper thicknesses. Seat the last tip
      // over its neighbour in one cell and below it in the other.
      for (let cell=0;cell<2;cell++) {
        const clearance=j===courses-1 ? (cell?1:-1)*.14*pose.turn : 0;
        addLength(j+'-'+cell,width,j+.5,clearance);
      }
    }
    if (splitCourses<courses) addLength('tail',2*width*(courses-splitCourses),splitCourses);
  }
  const completed = Math.min(courses,pose.folds/4);
  const z=mix(levels[Math.floor(completed)],levels[Math.ceil(completed)],completed%1);
  const foldingWidth=width*8.3;
  const framing={center:[0,0,z*.84],width:focus};
  if (pose.turn>0) {
    const points=panels.flatMap(p=>p.points);
    const center=[0,1,2].map(axis=>{
      const values=points.map(p=>p[axis]); return (Math.max(...values)+Math.min(...values))/2;
    });
    framing.center=framing.center.map((v,i)=>mix(v,center[i],pose.turn));
    framing.width=mix(foldingWidth,Math.max(4*width,2*width+z)*1.16,pose.turn);
  }
  return {panels,creases:[],framing};
}

function sampleStep(i,t) {
  const before=snapshots[i],after=snapshots[i+1];
  const pose=Object.fromEntries(Object.keys(before).map(key=>[key,mix(before[key],after[key],t)]));
  const focus=i===0 ? mix(580,width*8.3,smooth(t*2)) : width*8.3;
  return stateAt(pose,Math.ceil(after.folds/4),focus);
}

export const paperSpring = {
  id:'pappersfjader',name:'Pappersfjäder',category:'Saker & leksaker',level:'Medel',minutes:'10–15 min',
  color:colors[0],paper:{width, height:(4+4*courses)*width, area:2*(4+4*courses)*width*width,
    label:'Två långa pappersremsor',minExtent:3.5*width,fixedColors:true,
    preparation:'Ta fram två lika långa remsor i olika färger, till exempel 5 mm × 54 cm. Här använder vi rött och blått.'},
  materials:'Två lika breda pappersremsor i olika färger. I guiden är de 5 mm breda och 54 cm långa. Du kan använda kortare remsor till en kortare fjäder.',
  source:{label:'Kinetic Spring av maminimu på YouTube',url:'https://www.youtube.com/shorts/UWdyK9RYY30',designer:'Vikguide av maminimu på YouTube'},
  initialState:()=>sampleStep(0,0),
  steps:instructions.map(([text],i)=>({kind:i===instructions.length-1?'finish':'weave',text,sample:t=>sampleStep(i,t)}))
};

const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
let unique=0;
export class PaperRenderer {
  constructor(svg,{thumbnail=false}={}) {
    this.svg=svg;this.thumbnail=thumbnail;this.id='paper-'+(++unique);this.color='#edb852';this.view='angle';
    svg.setAttribute('viewBox','-200 -200 400 400');
    const defs=el('defs');
    const filter=el('filter',{id:this.id+'-shadow',x:'-80%',y:'-80%',width:'260%',height:'260%'});
    filter.append(el('feGaussianBlur',{stdDeviation:thumbnail?4:6}));defs.append(filter);
    const marker=el('marker',{id:this.id+'-arrow',markerWidth:8,markerHeight:8,refX:5,refY:3,orient:'auto',markerUnits:'strokeWidth'});
    marker.append(el('path',{d:'M0 0 L6 3 L0 6',fill:'none',stroke:'#ffda82','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}));defs.append(marker);
    svg.replaceChildren(defs);this.shadows=el('g',{filter:`url(#${this.id}-shadow)`,opacity:.18});this.paper=el('g');this.guides=el('g');this.decor=el('g');svg.append(this.shadows,this.paper,this.guides,this.decor);
  }
  project(p,layer=0){
    const pitch=this.view==='top'?0:.43,yaw=this.view==='side'?.55:0;
    const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw)+layer*.08;
    return [x,p[1]*Math.cos(pitch)-z*Math.sin(pitch),z*Math.cos(pitch)+p[1]*Math.sin(pitch)];
  }
  draw(state,{step=null,progress=1,model=null,finished=false}={}) {
    const all=state.panels.flatMap(p=>p.points).map(p=>this.project(p));
    const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
    const extent=Math.max(150,Math.max(maxX-minX,maxY-minY)*1.35),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    this.svg.setAttribute('viewBox',`${cx-extent/2} ${cy-extent/2} ${extent} ${extent}`);
    const paths=state.panels.map((p,i)=>{
      const points=p.points.map(v=>this.project(v,i)),depth=p.points.reduce((s,v)=>s+v[2],0)/points.length+i*.12;
      let winding=0;points.forEach((v,j)=>{const q=points[(j+1)%points.length];winding+=v[0]*q[1]-q[0]*v[1];});
      // Winding follows the actual rotating paper normal; double-sided material.
      const front=(winding>=0)===(model?.paper.front!==false);
      return {p,points,depth,front};
    }).sort((a,b)=>a.depth-b.depth);
    this.paper.replaceChildren();this.shadows.replaceChildren();
    for(const item of paths) {
      const pts=item.points.map(v=>v.slice(0,2).join(',')).join(' ');
      const shadow=item.p.points.map(v=>this.project([v[0]+3,v[1]+8,0]).slice(0,2).join(',')).join(' ');
      this.shadows.append(el('polygon',{points:shadow,fill:'#001c13'}));
      const polygon=el('polygon',{points:pts,fill:item.front?this.color:'#fff7e8',stroke:item.front?'#7d603d':'#c6b89e','stroke-width':.65,'stroke-linejoin':'round'});
      this.paper.append(polygon);
      const zspread=Math.max(...item.p.points.map(v=>v[2]))-Math.min(...item.p.points.map(v=>v[2]));
      if(zspread>1)this.paper.append(el('polygon',{points:pts,fill:'#142b24',opacity:Math.min(.23,zspread/650),'pointer-events':'none'}));
    }
    this.guides.replaceChildren();this.decor.replaceChildren();
    if(step?.line&&!finished) {
      const a=this.project([...step.line[0],.8]),b=this.project([...step.line[1],.8]);
      this.guides.append(el('path',{d:`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,fill:'none',stroke:'#124e42','stroke-width':2.4,'stroke-dasharray':'5 5','stroke-linecap':'round',opacity:progress<1?.9:.5}));
      if(progress<.35) {
        const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*step.side,ny=dx/l*step.side,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
        const p=[cx+nx*45,cy+ny*45],q=[cx-nx*40,cy-ny*40];
        this.guides.append(el('path',{d:`M${p[0]} ${p[1]} Q${cx+dx/l*45} ${cy+dy/l*45} ${q[0]} ${q[1]}`,fill:'none',stroke:'#ffda82','stroke-width':3,'stroke-linecap':'round','marker-end':`url(#${this.id}-arrow)`}));
      }
    }
    if(finished&&model?.face) {
      const face=model.face;
      const mark=(x,y,r)=>{const p=this.project([x,y,2]);this.decor.append(el('circle',{cx:p[0],cy:p[1],r,fill:'#293b34'}));};
      mark(-face.eyes,face.y,3.2);mark(face.eyes,face.y,3.2);mark(0,face.y+16,3.5);
    }
  }
}

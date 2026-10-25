const T=window.THREE;
export class PaintSurface{
 constructor(base,size=1024,kind='face'){
  this.size=size;this.kind=kind;this.layers=new Map();this.base=document.createElement('canvas');this.base.width=this.base.height=size;const c=this.base.getContext('2d');c.fillStyle=base;c.fillRect(0,0,size,size);
  let seed=731;for(let i=0;i<size*9;i++){seed=(seed*1664525+1013904223)>>>0;const x=(seed%size);seed=(seed*1664525+1013904223)>>>0;const y=seed%size;c.fillStyle=i%2?'rgba(255,228,212,.025)':'rgba(87,39,29,.025)';c.fillRect(x,y,1,1);}
  this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=size;this.ctx=this.canvas.getContext('2d');this.texture=new T.CanvasTexture(this.canvas);this.texture.colorSpace=T.SRGBColorSpace;this.texture.anisotropy=4;this.texture.generateMipmaps=false;this.texture.minFilter=T.LinearFilter;this.compose();
 }
 layer(name){if(!this.layers.has(name)){const c=document.createElement('canvas');c.width=c.height=this.size;this.layers.set(name,c);}return this.layers.get(name);}
 compose(){this.ctx.drawImage(this.base,0,0);for(const name of ['foundation','blush','shadow','liner','mascara','lip','base','polish','glitter','sticker','top']){const c=this.layers.get(name);if(c)this.ctx.drawImage(c,0,0);}this.texture.needsUpdate=true;}
 snapshot(name){return {surface:this,name,data:this.layer(name).getContext('2d').getImageData(0,0,this.size,this.size)};}
 restore(s){this.layer(s.name).getContext('2d').putImageData(s.data,0,0);this.compose();}
 paint(uv,tool,color,radius,alpha,previous){const c=this.layer(tool).getContext('2d'),s=this.size,x=uv.x*s,y=(1-uv.y)*s,r=radius*s;const px=previous?previous.x*s:x,py=previous?(1-previous.y)*s:y;const d=Math.hypot(x-px,y-py);if(d>s*.8)previous=null;const n=Math.max(1,Math.ceil((previous?d:0)/Math.max(1,r*.22)));
 for(let i=1;i<=n;i++){const q=i/n,bx=previous?px+(x-px)*q:x,by=previous?py+(y-py)*q:y;c.globalAlpha=alpha;const g=c.createRadialGradient(bx,by,r*.12,bx,by,r);g.addColorStop(0,color);g.addColorStop(.65,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(bx-r,by-r,r*2,r*2);if(tool==='glitter'){c.globalAlpha=.85;for(let k=0;k<4;k++){const a=(k*2.399+i)*3,rr=r*(.15+k*.2);c.fillStyle=k%2?'#fff3d7':color;c.fillRect(bx+Math.cos(a)*rr,by+Math.sin(a)*rr,Math.max(1,s/400),Math.max(1,s/400));}}}c.globalAlpha=1;this.compose();
 }
 sticker(uv,color){const c=this.layer('sticker').getContext('2d'),x=uv.x*this.size,y=(1-uv.y)*this.size,r=this.size*.12;c.fillStyle=color;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();this.compose();}
 dispose(){this.texture.dispose();this.layers.clear();}
}
export class UndoHistory{
 constructor(){this.items=[];this.limit=12;this.maxBytes=24*1024*1024;}
 push(s){this.items.push(s);this.trim();}
 trim(){let bytes=this.items.reduce((n,s)=>n+(s.bytes||s.data?.data.byteLength||0),0);while(this.items.length>1&&(this.items.length>this.limit||bytes>this.maxBytes)){const s=this.items.shift();bytes-=s.bytes||s.data?.data.byteLength||0;}}
 undo(){const s=this.items.pop();if(s){if(s.restore)s.restore();else s.surface.restore(s);}return !!s;}
 clear(){this.items=[];}
}

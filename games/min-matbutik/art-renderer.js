import {GOODS,total} from './logic.js';
import {fitScene,shelfSlots,checkoutGeometry,checkoutPose,smooth} from './presentation.js';
export {fitScene,shelfSlots};
import {SHELF_X,direction,walkFrame} from './simulation.js';
export {SHELF_X};
export function projectFloor(x,z){const t=(z+8)/18;return {x:.5+x/22*(.6+.5*t),y:.33+.66*t};}
export function unprojectFloor(x,y){const t=(y-.33)/.66;return {x:(x-.5)*22/(.6+.5*t),z:t*18-8};}
const SHELVES=[[[.168,.676],[.30,.676],[.353,.431],[.27,.431]],[[.42,.676],[.583,.676],[.539,.426],[.465,.426]],[[.718,.676],[.853,.676],[.703,.438],[.648,.438]]];
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export class ArtRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ratio=1;this.images={};this.backdrop=document.createElement('canvas');this.lastScene='';this.view='store';}
 async load(){await Promise.all(Object.entries({store:'store-aisles.webp',checkout:'checkout-pov.webp',portraitCheckout:'checkout-portrait.webp',portraitShelf:'shelf-portrait.webp',hands:'hand-joints.webp',extra:'groceries-extra.webp',products:'groceries.webp',characters:'characters.webp',front:'walk-front.webp',back:'walk-back.webp',side:'walk-side.webp',straight:'walk-straight.webp',free:'walk-free.webp',fridge:'fridge.webp',fruit:'shelf-fruit.webp',cold:'shelf-cold.webp',pantry:'shelf-pantry.webp'}).map(async([name,file])=>{const img=new Image();img.src='assets/'+file;await img.decode();this.images[name]=img;}));this.prepareProducts();}
 prepareProducts(){this.productSprites=[];this.productURLs=[];for(let id=0;id<GOODS.length;id++){const atlas=id<12?this.images.products:this.images.extra,n=id%12,sw=atlas.width/4,sh=atlas.height/3,tmp=document.createElement('canvas');tmp.width=Math.ceil(sw);tmp.height=Math.ceil(sh);const t=tmp.getContext('2d',{willReadFrequently:true});t.drawImage(atlas,(n%4)*sw,Math.floor(n/4)*sh,sw,sh,0,0,tmp.width,tmp.height);const data=t.getImageData(0,0,tmp.width,tmp.height).data;let l=tmp.width,r=0,top=tmp.height,b=0;for(let y=0;y<tmp.height;y++)for(let x=0;x<tmp.width;x++)if(data[(y*tmp.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);}const out=document.createElement('canvas');out.width=Math.max(1,r-l+1);out.height=Math.max(1,b-top+1);out.getContext('2d').drawImage(tmp,l,top,out.width,out.height,0,0,out.width,out.height);this.productSprites[id]=out;this.productURLs[id]=out.toDataURL();}}
 setPixelRatio(r){this.ratio=Math.min(r,2)}
 setSize(w,h){this.w=w;this.h=h;this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);this.rect=fitScene(w,h,this.view);this.lastScene='';}
 normalized(x,y){const r=this.rect;return {x:(x-r.x)/r.w,y:(y-r.y)/r.h};}
 hit(x,y){const p=this.normalized(x,y);if(p.x<0||p.x>1||p.y<0||p.y>1)return null;if(p.x>.39&&p.x<.61&&p.y>.09&&p.y<.33)return {kind:'fridge'};for(let i=0;i<3;i++)if(inside(p,SHELVES[i]))return {kind:'shelf',index:i};if(p.x<.19&&p.y>.65)return {kind:'cart'};if(p.x>.70&&p.y>.70)return {kind:'checkout'};if(p.y>.33)return {kind:'floor',...unprojectFloor(p.x,p.y)};return null;}
 layout(s){const atShelf=s.mode==='shop'&&s.phase==='shelf',checkout=s.mode==='work'||s.mode==='shop'&&!['walk','shelf'].includes(s.phase);this.view=atShelf?'shelf':checkout?'checkout':'store';const focus=projectFloor(s.player.x,s.player.z).x;this.rect=fitScene(this.w,this.h,this.view,focus);return this.rect;}
 background(name){const c=this.ctx,img=this.images[name],r=this.rect;c.fillStyle='#234536';c.fillRect(0,0,this.w,this.h);c.drawImage(img,r.x,r.y,r.w,r.h);}
 polygon(poly){const c=this.ctx;c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
 label(x,y,text,active=false){const c=this.ctx;c.save();const size=this.w<600?11:14;c.font=`600 ${size}px "Trebuchet MS",sans-serif`;const w=c.measureText(text).width+24;c.shadowColor='#16372435';c.shadowBlur=10;c.fillStyle=active?'#f8d68d':'#fffbefed';c.beginPath();c.roundRect(x-w/2,y-14,w,28,14);c.fill();c.shadowBlur=0;c.fillStyle='#315341';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y);c.restore();}
 sprite(name,col,row,columns,rows,x,y,h,mirror=false){const c=this.ctx,img=this.images[name],sw=img.width/columns,sh=img.height/rows,w=h*(sw/sh)*941/1672;c.save();c.translate(x,y);c.scale(mirror?-1:1,1);c.drawImage(img,col*sw,row*sh,sw,sh,-w/2,-h,w,h);c.restore();return w;}
 product(id,x,y,size,rotation=0){const c=this.ctx,img=this.productSprites[id],aspect=img.width/img.height,w=Math.min(size*aspect,size*1.5),h=w/aspect;c.save();c.translate(x,y);c.scale(this.rect.h/this.rect.w,1);c.rotate(rotation);c.drawImage(img,-w/2,-h/2,w,h);c.restore();}
 hand(x,y,grip=0,mirror=false){const c=this.ctx,ratio=this.rect.w/this.rect.h,side=mirror?-1:1;const wrist={x:x*ratio,y:y+.075},shoulder={x:(mirror?.28:.72)*ratio,y:1.65};const dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y,d=Math.hypot(dx,dy),L=d*.525,h=Math.sqrt(Math.max(0,L*L-d*d/4));const elbow={x:(shoulder.x+wrist.x)/2+side*(-dy/d)*h,y:(shoulder.y+wrist.y)/2+side*(dx/d)*h};c.save();c.scale(1/ratio,1);c.lineCap='round';c.lineJoin='round';
 const bone=(a,b,width,sleeve)=>{const len=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;const gradient=c.createLinearGradient(a.x-nx*width/2,a.y-ny*width/2,a.x+nx*width/2,a.y+ny*width/2);gradient.addColorStop(0,sleeve?'#294b38':'#b97650');gradient.addColorStop(.45,sleeve?'#527759':'#f4bd91');gradient.addColorStop(1,sleeve?'#254630':'#d28c61');c.strokeStyle=gradient;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();};bone(shoulder,elbow,.085,true);bone(elbow,wrist,.048,false);
 const img=this.images.hands,sw=img.width/3,sh=img.height,size=.15;const angle=Math.atan2(wrist.x-elbow.x,elbow.y-wrist.y)*.24;c.translate(wrist.x,wrist.y);c.rotate(angle);c.scale(mirror?-1:1,1);const draw=(col,alpha)=>{c.globalAlpha=alpha;c.drawImage(img,col*sw,0,sw,sh,-size*.59,-size*.98,size,size);};draw(grip>.02?1:2,1);if(grip>0&&grip<1)draw(2,1-grip);c.restore();}
 customer(s){const c=this.ctx,img=this.images[this.rect.portrait?'portraitCheckout':'checkout'],p=this.rect.portrait;const box=p?{x:.13,y:.01,w:.60,h:.412}:{x:.27,y:.005,w:.29,h:.519};const nod=s.phase==='dialogue'&&s.dialogueTime>1.85?Math.sin((s.dialogueTime-1.85)*6)*.008:0;
 for(let i=0;i<40;i++){const a=i/40,b=(i+1)/40;const bend=t=>Math.sin(Math.PI*t)*(.0035*Math.sin(s.t*1.8)+nod);const yy=box.y+a*box.h+bend(a),hh=box.h/40+bend(b)-bend(a);const sway=Math.sin(s.t*.8)*.003*Math.sin(Math.PI*a);c.drawImage(img,box.x*img.width,(box.y+a*box.h)*img.height,box.w*img.width,box.h/40*img.height,box.x+sway,yy,box.w,hh+.0005);}}
 drawActor(s){const c=this.ctx,a=s.player,p=projectFloor(a.x,a.z),depth=(a.z+8)/18,h=.18+depth*.08;let d=direction(a.angle),name=d.key,row=0,n=a.moving?walkFrame(a.distance):0,col=n%4;
 if(!s.hasCart){name='free';row=Math.cos(a.angle)<-.25?1:0;n=a.moving?walkFrame(a.distance,4):0;col=n;}
 else if(name==='straight'){row=d.row;n=a.moving?walkFrame(a.distance,4):0;col=n;if(!row&&n>1){col=n-2;d={...d,mirror:true};}}
 else row=Math.floor(n/4);
 c.fillStyle='#243f3825';c.beginPath();c.ellipse(p.x,p.y-.008,.022,.007,0,0,Math.PI*2);c.fill();this.sprite(name,col,row,4,2,p.x,p.y,h,d.mirror);
 if(s.hasCart&&s.basket.length){let cx=d.key==='straight'?0:(d.mirror?-.032:.032),cy=d.key==='back'||(d.key==='straight'&&d.row)?-.10:-.075;for(let i=0;i<Math.min(s.basket.length,6);i++)this.product(s.basket[i],p.x+cx+(i%3-1)*.008,p.y+cy-Math.floor(i/3)*.013,.026);}
 if(p.y<.676)for(const poly of SHELVES){c.save();this.polygon(poly);c.clip();c.drawImage(this.images.store,0,0,1,1);c.restore();}
 }
 drawStore(s){const c=this.ctx,fr=this.images.fridge;c.drawImage(fr,fr.width*.105,fr.height*.05,fr.width*.79,fr.height*.90,.39,.085,.22,.25);
 const ch=this.images.characters;c.drawImage(ch,ch.width/2,0,ch.width/2,ch.height,.795,.57+Math.sin(s.t*1.5)*.0006,.13,.23);c.save();this.polygon([[.71,.70],[.86,.69],[.89,.63],[.94,.68],[.99,.73],[.99,.95],[.71,.95]]);c.clip();c.drawImage(this.images.store,0,0,1,1);c.restore();
 if(s.destination){const p=projectFloor(s.destination.x,s.destination.z);c.strokeStyle='#fff6c3';c.lineWidth=.002;c.beginPath();c.ellipse(p.x,p.y,.014,.006,0,0,Math.PI*2);c.stroke();}
 if(s.mode==='shop')this.drawActor(s);
 }
 drawShelf(s){const c=this.ctx,p=s.pick;if(!p)return;const slot=shelfSlots(s.selectedShelf,this.rect.portrait)[p.slot],t=p.t/1.25,u=smooth(t),start={x:slot.x+slot.w/2,y:slot.y+slot.h*.43},end={x:.78,y:.98};
 const x=start.x+(end.x-start.x)*u,y=start.y+(end.y-start.y)*u-.08*Math.sin(u*Math.PI);c.save();c.globalAlpha=1-smooth((t-.82)/.18);this.product(p.id,x,y,(this.rect.portrait?.115:.15)*(1-.45*u),u*.13);c.restore();}
 drawCheckout(s){this.customer(s);const c=this.ctx,portrait=this.rect.portrait,g=checkoutGeometry(portrait),active=s.scanBusy?s.belt[s.scanned]:null,pose=active?checkoutPose(active.scan,portrait):null;
 if(s.phase==='scanning'){c.save();this.polygon(g.belt);c.clip();c.strokeStyle='#f7eee326';c.lineWidth=.0012;for(let i=-8;i<30;i++){const x=i*.028+s.beltMotion%.028;c.beginPath();c.moveTo(x,.42);c.lineTo(x-.065,.95);c.stroke();}c.restore();}
 for(const item of s.belt){if(item.done||item.scan||item.x<-.12)continue;const x=item.x/.36*g.pickup.x,y=g.pickup.y+(portrait?0:(x-g.pickup.x)*.08);this.product(item.id,x,y,g.size);}
 for(let i=0;i<s.scanned;i++){this.product(s.receiptItems[i],g.bag.x+((i%3)-1)*(portrait?.042:.022),g.bag.y+.07-Math.floor(i/3)*.018,g.size*.85);}
 // The supporting hand stays on the near side of the parcel; both arms enter from below.
 const restBob=Math.sin(s.t*1.4)*.0015,hand=pose?.hand||{x:g.rest.x,y:g.rest.y+restBob};
 const grip=pose?.grip||0,physical=.060*this.rect.h/this.rect.w;
 const left=pose?{x:hand.x-physical*1.6,y:hand.y+.035}:{x:portrait?.24:.40,y:g.rest.y+.015+restBob};
 if(pose){c.save();c.globalAlpha=pose.alpha;this.product(active.id,pose.product.x,pose.product.y,g.size,pose.rotation);c.restore();}
 // Real occlusion: groceries and fingertips go INSIDE, behind the original bag front.
 c.save();this.polygon(g.lip);c.clip();c.drawImage(this.images[portrait?'portraitCheckout':'checkout'],0,0,1,1);c.restore();
 const t=active?.scan||0,lerp=(a,b,u)=>({x:a.x+(b.x-a.x)*smooth(u),y:a.y+(b.y-a.y)*smooth(u)}),leftRest={x:portrait?.25:.38,y:g.rest.y},rightRest=g.rest;
 const lp=!pose?leftRest:t<.18?lerp(leftRest,g.pickup,t/.18):t<.50?pose.hand:lerp(g.scanner,leftRest,(t-.50)/.20);
 const rp=!pose?rightRest:t<.30?rightRest:t<.43?lerp(rightRest,g.scanner,(t-.30)/.13):pose.hand;
 this.hand(lp.x-physical,lp.y+.025,pose&&t<.55?grip:0,true);
 this.hand(rp.x+physical,rp.y+.025,pose&&t>.40?grip:0,false);
 if(active&&active.scan>=.43&&active.scan<.53){c.fillStyle='#ff49465a';c.beginPath();c.ellipse(g.scanner.x,g.scanner.y+.02,portrait?.095:.032,.009,0,0,Math.PI*2);c.fill();}
 const d=g.display;c.save();c.translate(d.x,d.y);c.scale(1/this.rect.w,1/this.rect.h);c.fillStyle='#2d563b';c.textAlign='center';c.textBaseline='middle';const fs=Math.max(12,Math.min(22,d.h*this.rect.h*.50));c.font=`bold ${fs}px "Trebuchet MS",sans-serif`;c.fillText(total(s.receiptItems.slice(0,s.scanned))+' kr',d.w*this.rect.w/2,d.h*this.rect.h/2);c.restore();
 }
 render(s){const c=this.ctx,r=this.layout(s),atShelf=this.view==='shelf',checkout=this.view==='checkout',scene=atShelf?r.portrait?'portraitShelf':['fruit','cold','pantry'][s.selectedShelf]:checkout?r.portrait?'portraitCheckout':'checkout':'store';c.setTransform(this.ratio,0,0,this.ratio,0,0);this.background(scene);c.save();c.translate(r.x,r.y);c.scale(r.w,r.h);c.beginPath();c.rect(0,0,1,1);c.clip();if(atShelf)this.drawShelf(s);else if(checkout)this.drawCheckout(s);else this.drawStore(s);c.restore();
 if(s.mode==='shop'&&s.phase==='walk'){const names=['Frukt & grönt','Kylt & gott','Skafferi & bröd'];for(let i=0;i<3;i++){const p=projectFloor(SHELF_X[i],2.1);if(r.x+p.x*r.w>35&&r.x+p.x*r.w<this.w-35)this.label(r.x+p.x*r.w,r.y+p.y*r.h,names[i],s.near.kind==='shelf'&&s.near.index===i);}this.label(r.x+.5*r.w,r.y+.337*r.h,'Kylen',s.near.kind==='fridge');if(!s.hasCart)this.label(r.x+.115*r.w,r.y+.925*r.h,'Ta en kundvagn');}
 }
}

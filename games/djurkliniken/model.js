/* Djurkliniken: deterministic care model, shared by the game and input tests. */
(function(root){
'use strict';
const bath=['wet','soap','rinse','towel','dryer','brush'];
const patients=[
 ['bella','Bella','Hund','Modig skogsvandrare','Bella älskar skogspromenader. Idag vill hon inte stödja på sin ena tass. Kan du hitta varför?','En liten tagg i tassen',['heart','temp','lens','thorn','clean','plaster','water']],
 ['milo','Milo','Katt','Nyfiken och lite försiktig','Milo har utforskat rabatten. Pälsen är smutsig och han har fått en liten skråma på tassen.','Smutsig päls och en skråma',['heart','lens','clean',...bath,'plaster']],
 ['luna','Luna','Kanin','Lugn vän med stora öron','Luna skakar på sitt ena öra. Hon vill gärna att du tittar försiktigt på det.','Smuts på ytterörat',['heart','temp','ear','earclean','food','water']],
 ['nuffe','Nuffe','Hamster','Liten vän med stor aptit','Nuffe har lekt länge och verkar trött. Titta till honom och hjälp honom med en skön paus.','Behöver mat, vatten och omsorg',['heart','temp','mouth','food','water','brush']],
 ['molly','Molly','Marsvin','Mjuk som ett litet moln','Molly har rullat i sin lekhage. Nu är pälsen både smutsig och rufsig.','Rufsig och smutsig päls',['heart','temp','lens',...bath,'food']],
 ['kotten','Kotten','Igelkott','Blyg liten trädgårdsvän','Kotten har sovit i en lövhög. Några löv har fastnat mellan taggarna.','Löv och skräp bland taggarna',['heart','lens','leaves','water']],
 ['bosse','Bosse','Valp','Busig, varm och kramgo','Bosse snubblade under leken. Han behöver en ren tass och ett mjukt bandage.','En liten skråma på tassen',['heart','temp','lens','clean','bandage','water']],
 ['maja','Maja','Kattunge','En liten spinnande solstråle','Maja har skuttat i en lerpöl. Nu längtar hon efter ett varmt bad och mjuk päls.','Lerig päls efter lek',['heart','ear',...bath,'food']]
].map(([id,name,kind,personality,story,problem,steps])=>({id,name,kind,personality,story,problem,steps}));
const recipes={
 heart:['Lyssna på hjärtat','Dra stetoskopet till bröstet. Håll stilla i ringen och lyssna på dunk-dunk.','heart','exam','hold','Dunk-dunk! Hjärtat låter fint.',2.5],
 temp:['Mät temperaturen','Håll den kontaktfria termometern nära pannan tills mätaren är full.','temp','exam','hold','Lagom varm! Temperaturen ser bra ut.',2],
 lens:['Vad har hänt?','Dra förstoringsglaset till den glittrande ringen. Där finns något att titta närmare på.','lens','exam','hold','Där hittade du det! Nu hjälps vi åt.',1.5],
 ear:['Titta i örat','Håll öronlampan vid ringen utanför örat. Lys försiktigt.','ear','exam','hold','Vi har tittat på örat. Nu vet vi mer!',2],
 mouth:['Titta i munnen','Lys med lampan vid nosen. Håll den lugnt i ringen.','lamp','exam','hold','Munnen ser fin ut. Lite mat och vatten blir bra!',2],
 thorn:['Ta bort den lilla taggen','Sätt pincetten på taggen. Håll kvar och dra försiktigt uppåt längs pilen.','tweezers','treat','pull','Borta! Nu känns tassen bättre.'],
 clean:['Tvätta försiktigt','Gnugga svampen över smutsfläckarna. Smutsen försvinner precis där du tvättar.','sponge','treat','scrub','Så fint och rent!'],
 earclean:['Gör ytterörat rent','Dra den mjuka duken över prickarna på utsidan av örat.','towel','treat','scrub','Nu känns örat skönt igen!'],
 leaves:['Plocka bort löven','Ta ett löv med pincetten och dra det uppåt. Fortsätt tills alla löven är borta.','tweezers','treat','leaves','Inga löv kvar bland taggarna!'],
 plaster:['Ett fint litet plåster','Välj ett mönster. Dra plåstret till ringen på tassen och släpp.','plaster','treat','drop','Ett plåster fullt av omtanke!'],
 bandage:['Linda en mjuk tass','Dra bandaget i stora cirklar runt tassen. Följ den runda pilen.','bandage','treat','wrap','Ett mjukt bandage – precis lagom!'],
 wet:['Dags för ett bad','Dra duschen över de markerade områdena. Pälsen blir blöt där vattnet landar.','shower','bath','scrub','Nu är pälsen redo för schampo!'],
 soap:['Bubbligt och mjukt','Gnugga schampot över pälsen. Fyll alla de små ringarna med fluffigt skum.','soap','bath','scrub','Vilket härligt bubbelbad!'],
 rinse:['Skölj bort skummet','Dra duschen över varje skumfläck. Bubblorna och smutsen sköljs bort.','shower','bath','scrub','Rent och fint!'],
 towel:['Torka med handduken','Dra den mjuka handduken över de våta områdena tills dropparna försvinner.','towel','bath','scrub','Varmt och skönt!'],
 dryer:['Fluffa med ljummen luft','För hårfönen över pälsen. Markeringarna visar var det fortfarande är fuktigt.','dryer','bath','scrub','Så fluffig och mjuk!'],
 brush:['Borsta till det sista','Dra borsten över alla pälsvirvlar. Varje drag gör pälsen lite finare.','brush','bath','scrub','Underbart mjuk päls!'],
 food:['En liten matpaus','Dra matskålen till nosen och håll den där. Din vän äter i lugn och ro.','food','treat','hold','Mums! Tack för maten.',2],
 water:['Lite friskt vatten','Dra vattenskålen till nosen och håll den där en liten stund.','water','treat','hold','Gott! Nu känns det mycket bättre.',2]
};
const actions=Object.fromEntries(Object.entries(recipes).map(([key,[title,instruction,tool,room,mode,result,seconds]])=>[key,{key,title,instruction,tool,room,mode,result,seconds}]));
const anchors={
 bella:{eyes:[[466,161],[533,157]],ear:[397,195],mouth:[500,220],head:[500,130],fur:'#bb8b51'},
 milo:{eyes:[[470,195],[548,209]],ear:[415,120],mouth:[510,242],head:[500,145],fur:'#999486'},
 luna:{eyes:[[460,284],[540,283]],ear:[428,164],mouth:[500,322],head:[500,245],fur:'#e5d7bd'},
 nuffe:{eyes:[[458,226],[554,234]],ear:[411,147],mouth:[500,282],head:[500,182],fur:'#d1a462'},
 molly:{eyes:[[441,225],[557,228]],ear:[385,174],mouth:[500,290],head:[500,175],fur:'#be8b64'},
 kotten:{eyes:[[459,283],[558,278]],ear:[409,233],mouth:[510,323],head:[500,242],fur:'#d9bc8d'},
 bosse:{eyes:[[455,183],[547,194]],ear:[395,213],mouth:[500,238],head:[500,145],fur:'#815333'},
 maja:{eyes:[[459,233],[547,231]],ear:[405,146],mouth:[500,279],head:[500,185],fur:'#d4ad7d'}
};
const bodyPoints=[[445,355],[500,355],[555,355],[430,410],[485,410],[540,410],[575,440],[445,470],[500,475],[550,480]];
const leafPoints=[[380,310],[430,240],[575,260],[610,330],[395,400]];
const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
class CareGame {
 constructor(){this.start('bella');}
 start(id){this.patient=patients.find(p=>p.id===id)||patients[0];this.index=-1;this.phase='reception';this.progress=0;this.complete=false;this.selected=null;this.pointer={x:500,y:380,down:false};this.grab=null;this.spots=[];this.pattern=1;this.plastered=false;this.wrapped=0;this.thorn=this.patient.steps.includes('thorn');this.leaves=leafPoints.map(([x,y])=>({x,y,value:0}));this.wet=[];this.foam=[];this.brushed=[];this.dirt=bodyPoints.map(([x,y],i)=>({x,y,r:14+i%3*5,opacity:this.patient.steps.includes('wet')?.75:0}));}
 get key(){return this.patient.steps[this.index];}
 get action(){return actions[this.key]||null;}
 get mood(){return this.phase==='reward'?100:Math.round(12+Math.max(0,this.index+this.progress)*83/this.patient.steps.length);}
 get target(){const a=anchors[this.patient.id],k=this.key;let p=k==='heart'?[500,385]:k==='temp'?a.head:k==='ear'?a.ear:['mouth','food','water'].includes(k)?a.mouth:k==='lens'&&this.patient.id==='kotten'?[430,280]:k==='lens'&&this.patient.id==='molly'?[500,400]:[455,505];return {x:p[0],y:p[1]};}
 next(){if(this.phase!=='reception'&&!this.complete)return false;this.cancel();this.index++;this.progress=0;this.complete=false;this.selected=null;if(this.index>=this.patient.steps.length){this.phase='reward';return true;}const a=this.action;this.phase=a.room;let pts=bodyPoints;if(this.key==='clean')pts=[[435,475],[470,478],[442,510],[477,514],[455,495]];if(this.key==='earclean'){const [x,y]=anchors[this.patient.id].ear;pts=[[x-17,y-15],[x+8,y],[x-8,y+22],[x+20,y+30]];}this.spots=a.mode==='scrub'?pts.map(([x,y])=>({x,y,value:0})):a.mode==='leaves'?this.leaves:[];if(this.key==='soap')this.foam=[];if(this.key==='rinse')this.foam=bodyPoints.map(([x,y])=>({x,y,r:24}));return true;}
 choose(tool){if(this.complete)return;this.selected=tool;this.cancel();}
 down(x,y){if(this.pointer.down)return;this.pointer={x,y,down:true};this.grab=null;this.apply(0,0);}
 move(x,y){const length=Math.min(50,distance(this.pointer,{x,y}));this.pointer.x=x;this.pointer.y=y;if(this.pointer.down)this.apply(0,length);}
 tick(seconds){if(this.pointer.down)this.apply(Math.max(0,seconds),0);}
 up(cancelled=false){if(!cancelled&&this.pointer.down&&this.action?.mode==='drop'&&this.selected===this.action.tool&&distance(this.pointer,this.target)<65){this.plastered=true;this.finish();}this.cancel();}
 cancel(){this.pointer.down=false;this.grab=null;}
 finish(){this.complete=true;this.progress=1;this.grab=null;if(this.key==='thorn')this.thorn=false;if(this.key==='rinse'){this.dirt.forEach(d=>d.opacity=0);this.foam=[];}if(['towel','dryer'].includes(this.key))this.wet=[];}
 apply(dt,movement){const a=this.action,p=this.pointer,t=this.target;if(!a||this.complete||!p.down||this.selected!==a.tool||p.x<0||p.x>1000||p.y<0||p.y>700||this.phase==='reward')return;
 if(a.mode==='hold'&&distance(p,t)<70)this.progress+=dt/a.seconds;
 if(a.mode==='pull'){if(!this.grab&&distance(p,t)<55)this.grab={x:p.x,y:p.y};if(this.grab)this.progress=Math.max(this.progress,(this.grab.y-p.y)/90);}
 if(a.mode==='leaves'){if(!this.grab){const s=this.spots.find(s=>s.value<1&&distance(p,s)<45);if(s)this.grab={spot:s,y:p.y};}if(this.grab&&this.grab.y-p.y>60){this.grab.spot.value=1;this.grab=null;}this.progress=this.spots.filter(s=>s.value===1).length/this.spots.length;}
 if(a.mode==='wrap'){const r=distance(p,t);if(r>18&&r<110){const angle=Math.atan2(p.y-t.y,p.x-t.x);if(this.grab){const raw=angle-this.grab.angle,d=Math.atan2(Math.sin(raw),Math.cos(raw));if(Math.abs(d)<.8)this.progress+=Math.abs(d)/(Math.PI*4);}this.grab={angle};this.wrapped=Math.min(1,this.progress);}else this.grab=null;}
 if(a.mode==='scrub'&&movement>0){let hit=false;for(const s of this.spots)if(distance(p,s)<48){s.value=Math.min(1,s.value+movement/90);hit=true;}if(hit){const k=this.key;if(k==='wet')this.wet.push({x:p.x,y:p.y,r:26});if(k==='soap')this.foam.push({x:p.x,y:p.y,r:19});if(k==='rinse'){this.foam=this.foam.filter(f=>distance(p,f)>50);this.dirt.forEach(d=>{if(distance(p,d)<55)d.opacity=Math.max(0,d.opacity-movement/90);});}if(['towel','dryer'].includes(k))this.wet=this.wet.filter(f=>distance(p,f)>50);if(k==='brush')this.brushed.push({x:p.x,y:p.y});}this.wet=this.wet.slice(-180);this.foam=this.foam.slice(-160);this.brushed=this.brushed.slice(-80);this.progress=this.spots.reduce((sum,s)=>sum+s.value,0)/this.spots.length;}
 if(this.progress>=.999)this.finish();
 }
}
const api={CareGame,patients,actions,anchors,bodyPoints,leafPoints};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ClinicData=api;
})(typeof window!=='undefined'?window:globalThis);

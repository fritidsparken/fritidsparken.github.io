// Authored fold coordinates; sources and diagram derivations in accompanying notes.
const R=150/Math.sqrt(2), p=a=>a.map(v=>v*R), line=(a,b)=>[p(a),p(b)];
const paper={width:150,height:150,front:false,outline:[[0,-R],[R,0],[0,R],[-R,0]],label:'Kvadrat · 15 × 15 cm'};
const f=(text,a,b,side,extra={})=>({kind:'fold',text,line:line(a,b),side,...extra});
const u={kind:'unfold',text:'Öppna papperet igen.'};
const turn={kind:'turn',text:'Vänd på papperet.'};
const fin=text=>({kind:'finish',text});
const mid=[f('Vik på mitten från sida till sida.',[0,-1],[0,1],1),u];
const horizontal=[f('Vik nedersta hörnet till det översta.',[-1,0],[1,0],1),u];
const down=f('Vik översta hörnet till det nedersta.',[-1,0],[1,0],-1,{tag:'upper'});
const up=f('Vik nedersta hörnet till det översta.',[-1,0],[1,0],1);
const model=(id,name,color,slug,steps,face,extra={})=>({id,name,category:'Djur',level:'Lätt',minutes:'6–10 min',color,paper,materials:'Ett kvadratiskt papper. Penna till ansiktet. Inget lim och ingen sax.',source:{label:'Origami Club – '+name,url:'https://en.origami-club.com/easy/animal-face/'+slug+'/index.html',designer:slug==='fox'?'Traditionell modell; diagram av Fumiaki Shingu':'Modell och diagram: Fumiaki Shingu'},steps,face,...extra});
export const models=[
 model('ravansikte','Rävansikte','#e68b3c','fox',[
  up,f('Vik den översta spetsen ned till nederkanten.',[-1,-.5],[1,-.5],-1),
  f('Vik vänster sida snett uppåt till ett långt öra.',[0,0],[-.52,-.5],-1),
  f('Vik höger sida snett uppåt på samma sätt.',[0,0],[.52,-.5],1),turn,
  fin('Rita ögon och en svart nos längst ned. Räven är klar!')
 ],{eyes:18,y:-36,type:'fox',noseY:-11}),
 model('kaninansikte','Kaninansikte','#d9c7df','rabbit',[
  up,...mid,f('Vik upp en smal remsa längs nederkanten.',[-1,-.16],[1,-.16],1),
  f('Vik vänstra hörnet upp mot mittlinjen. Det blir ett långt öra.',[0,-.16],[-.6,-.76],-1,{tag:'ear'}),
  f('Vik högra hörnet upp mot mittlinjen.',[0,-.16],[.6,-.76],1,{tag:'ear'}),turn,
  f('Vik den översta mittspetsen bakåt så att öronen syns.',[-1,-.69],[1,-.69],-1,{select:{not:'ear'},direction:-1}),
  f('Vik en liten bit av nedersta spetsen bakåt.',[-1,-.28],[1,-.28],1,{direction:-1}),
  fin('Rita ögon, nos och morrhår. Din kanin är klar!')
 ],{eyes:16,y:-51,type:'rabbit',noseY:-37}),
 model('pandaansikte','Pandaansikte','#354841','panda',[
  ...mid,...horizontal,
  f('Vik vänstra hörnet inåt. Lämna en liten bit till mittlinjen.',[-.60,-1],[-.60,1],1),
  f('Vik högra hörnet lika långt in.',[.60,-1],[.60,1],-1),{...down,direction:-1,text:'Vik den övre halvan bakåt till den nedre.'},
  f('Vik den smala vänstra kanten bakåt.',[-.48,-1],[-.48,1],1,{direction:-1}),
  f('Vik den smala högra kanten bakåt.',[.48,-1],[.48,1],-1,{direction:-1}),
  f('Vik nedersta spetsen uppåt.',[-1,.72],[1,.72],1,{tag:'muzzle'}),
  f('Vik ned den främre vita spetsen bakom nosfliken.',[-1,.58],[1,.58],-1,{select:{all:['muzzle','upper']},direction:-1}),
  fin('Rita stora svarta ögonfläckar med små ljusa ögon. Pandan är klar!')
 ],{eyes:21,y:32,type:'panda',noseY:59},{paper:{...paper,front:false}}),
 model('grisansikte','Grisansikte','#e9a0b2','pig',[
  ...mid,...horizontal,
  f('Vik vänstra hörnet till mitten.',[-.5,-1],[-.5,1],1),
  f('Vik högra hörnet till mitten.',[.5,-1],[.5,1],-1),down,
  f('Vik nedersta spetsen uppåt för att börja trynet.',[-1,.70],[1,.70],1,{tag:'snout'}),
  f('Vik ned den främre spetsen en liten bit.',[-1,.55],[1,.55],-1,{select:{has:'snout',not:'upper'}}),
  f('Vik ned det övre vänstra hörnet till ett litet öra.',[-.5,.23],[-.27,0],-1),
  f('Vik ned det övre högra hörnet likadant.',[.27,0],[.5,.23],-1),
  fin('Rita två ögon och två näsborrar på trynet. Din gris är klar!')
 ],{eyes:20,y:34,type:'pig',noseY:62})
];
// Decorations are pen marks placed on the finished folded paper, never new panels.
const ink='#293b34',white='#fff7e8';
const ellipse=(x,y,rx,ry,fill=ink)=>({kind:'ellipse',x,y,rx,ry,fill});
const polygon=(points,fill=ink)=>({kind:'polygon',points,fill});
const marks={
 ravansikte:[ellipse(-18,-36,3,3),ellipse(18,-36,3,3),polygon([[-5,-16],[5,-16],[0,-7]])],
 kaninansikte:[ellipse(-16,-51,3,4),ellipse(16,-51,3,4),ellipse(0,-37,4,2.8,'#d96578')],
 pandaansikte:[ellipse(-21,32,10,12),ellipse(21,32,10,12),ellipse(-19,29,3,3,white),ellipse(19,29,3,3,white),polygon([[-6,55],[6,55],[0,62]])],
 grisansikte:[ellipse(-20,34,2.8,3.8),ellipse(20,34,2.8,3.8),ellipse(-4,62,1.7,3),ellipse(4,62,1.7,3)]
};
for(const m of models)m.face.marks=marks[m.id];
const inwardEars=[
 f('Vik vänstra hörnet ned till den nedersta spetsen.',[0,0],[-.5,.5],1,{tag:'flap-left'}),
 f('Vik högra hörnet ned till samma spets.',[0,0],[.5,.5],-1,{tag:'flap-right'})
];
const earless={none:['ear-left','ear-right']};
const muzzle=(at=.75)=>[
 f('Lyft bara den främre nedersta spetsen uppåt till en ljus nosfläck.',[-1,at],[1,at],1,{select:{not:'upper'},tag:'muzzle'}),
 f('Vik den kvarvarande nedersta spetsen bakåt längs samma kant.',[-1,at],[1,at],1,{select:{has:'upper'},direction:-1})
];
models.push(
 model('bjornansikte','Björnansikte','#b98b65','bear',[
  down,...mid,
  f('Vik vänstra hörnet inåt längs den sneda linjen.',[-.30,0],[-.46,.60],1,{tag:'ear-left'}),
  f('Vik högra hörnet inåt på samma sätt.',[.30,0],[.46,.60],-1,{tag:'ear-right'}),
  f('Vik ut vänster flik igen och lämna ett smalt veck vid örats bas.',[-.176,0],[-.301,.70],-1,{select:{has:'ear-left'}}),
  f('Vik ut höger flik lika långt.',[.176,0],[.301,.70],1,{select:{has:'ear-right'}}),
  f('Vik in vänstra öronspetsen en liten bit.',[-.54,-1],[-.54,1],1,{select:{has:'ear-left'}}),
  f('Vik in högra öronspetsen lika mycket.',[.54,-1],[.54,1],-1,{select:{has:'ear-right'}}),
  f('Vik ned de små hörnen ovanpå vänster öra.',[-1,.04],[1,.04],-1,{select:{has:'ear-left'}}),
  f('Vik ned de små hörnen ovanpå höger öra.',[-1,.04],[1,.04],-1,{select:{has:'ear-right'}}),turn,
  f('Lyft den främre nedersta spetsen för att göra en ljus nosfläck.',[-1,.72],[1,.72],1,{select:{not:'upper'},tag:'muzzle'}),
  f('Vik tillbaka den lilla toppen på nosfläcken.',[-1,.54],[1,.54],-1,{select:{has:'muzzle'},direction:-1}),
  f('Vik den nedersta spetsen bakåt så att hakan blir platt.',[-1,.86],[1,.86],1,{select:{has:'upper'},direction:-1}),
  fin('Rita ögon och en rund nos på nosfläcken. Björnen är klar!')
 ],{eyes:20,y:42,type:'bear',noseY:64}),
 model('koalaansikte','Koalaansikte','#9ca9ad','koalaface',[
  ...mid,down,...inwardEars,
  f('Vik vänstra fliken utåt och uppåt till ett brett öra.',[0,.25],[-.5,.5],-1,{select:{has:'flap-left'},tag:'ear-left'}),
  f('Vik högra fliken utåt och uppåt.',[0,.25],[.5,.5],1,{select:{has:'flap-right'},tag:'ear-right'}),
  f('Vik den lilla mittspetsen nedåt.',[-1,.10],[1,.10],-1,{select:earless}),
  f('Vik ned toppen på vänster öra en liten bit.',[-.75,.02],[-.4,-.16],-1,{select:{has:'ear-left'}}),
  f('Vik ned toppen på höger öra lika mycket.',[.4,-.16],[.75,.02],-1,{select:{has:'ear-right'}}),turn,
  ...muzzle(.75),fin('Rita ögon och en stor oval nos. Din koala är klar!')
 ],{eyes:20,y:41,type:'koala',noseY:66}),
 model('tigeransikte','Tigeransikte','#eabd44','tiger-face',[
  ...mid,down,...inwardEars,
  f('Vik vänstra fliken uppåt och utåt till ett kort spetsigt öra.',[0,.50],[-.5,.70],-1,{select:{has:'flap-left'},tag:'ear-left'}),
  f('Vik högra fliken uppåt och utåt.',[0,.50],[.5,.70],1,{select:{has:'flap-right'},tag:'ear-right'}),
  f('Vik in den yttersta vänstra spetsen.',[-.40,-1],[-.40,1],1),
  f('Vik in den yttersta högra spetsen.',[.40,-1],[.40,1],-1),
  f('Vik den översta mittspetsen nedåt till en rak panna.',[-1,.23],[1,.23],-1,{select:earless}),turn,
  ...muzzle(.76),
  f('Vik ned den lilla nosspetsen på den ljusa fläcken.',[-1,.59],[1,.59],-1,{select:{has:'muzzle'}}),
  fin('Rita ögon, nos och svarta tigerränder på panna och kinder. Tigern är klar!')
 ],{eyes:18,y:45,type:'tiger',noseY:66}),
 model('musansikte','Musansikte','#86b4c1','mouse',[
  ...mid,down,
  f('Vik högra halvan över den vänstra.',[0,-1],[0,1],-1,{tag:'ear'}),
  f('Vik det översta lagret tillbaka längs den sneda linjen. Låt örat sticka upp.',[-.35,0],[-.14,.7],1,{select:{has:'ear'}}),
  f('Vik den nedersta spetsen bakåt så att musens kind får en rak kant.',[-1,.64],[1,.64],1,{direction:-1}),
  fin('Rita ett öga, svart nos längst till vänster och några morrhår. Musen är klar!')
 ],{eyes:0,y:26,type:'mouse',noseY:3})
);
marks.bjornansikte=[ellipse(-20,42,3.4,4),ellipse(20,42,3.4,4),ellipse(0,64,6,4.2)];
marks.koalaansikte=[ellipse(-20,41,3.5,4.7),ellipse(20,41,3.5,4.7),ellipse(0,66,7,10)];
marks.tigeransikte=[ellipse(-18,45,6.5,7.2,white),ellipse(18,45,6.5,7.2,white),ellipse(-18,45,3.2,3.8),ellipse(18,45,3.2,3.8),polygon([[-5,63],[5,63],[0,69]]),polygon([[-20,26],[-10,26],[-15,34]]),polygon([[-5,26],[5,26],[0,34]]),polygon([[10,26],[20,26],[15,34]]),polygon([[-40,44],[-28,46],[-40,48]]),polygon([[-40,55],[-28,57],[-40,59]]),polygon([[40,44],[28,46],[40,48]]),polygon([[40,55],[28,57],[40,59]])];
marks.musansikte=[ellipse(-34,23,3,6),polygon([[-104,1],[-80,1],[-92,13]]),polygon([[-75,14],[-55,20],[-56,22]]),polygon([[-76,21],[-56,26],[-57,28]])];
for(const m of models)m.face.marks=marks[m.id];

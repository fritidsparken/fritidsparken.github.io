/* Fritidsparken: 100 original child-friendly, five-step SVG drawing lessons.
   Shared model for cards, preview sheets and the existing paced lesson player. */
(()=>{
'use strict';
const categories=[
["Söta djur","animal",[
["Hamster","🐹"],["Igelkott","🦔"],["Marsvin","🐹"],["Ekorre","🐿️"],["Mus","🐭"],["Lamm","🐑"],["Gris","🐷"],["Kyckling","🐥"],["Groda","🐸"],["Björnung","🐻"]]],
["Trendiga djur","animal",[
["Axolotl","🦎"],["Kapybara","🦫"],["Quokka","🐻"],["Röd panda","🦊"],["Fennekräv","🦊"],["Utter","🦦"],["Wombat","🐻"],["Lemur","🐒"],["Alpacka","🦙"],["Sockerglidare","🐿️"]]],
["Kawaii-mat","food",[
["Donut","🍩"],["Glass","🍦"],["Bubble tea","🧋"],["Cupcake","🧁"],["Våffla","🧇"],["Pizza","🍕"],["Taco","🌮"],["Sushi","🍣"],["Jordgubbe","🍓"],["Avokado","🥑"]]],
["Roliga snacks","food",[
["Popcorn","🍿"],["Pommes frites","🍟"],["Hamburgare","🍔"],["Tårta","🎂"],["Marshmallow","🍡"],["Kaka","🍪"],["Chokladkaka","🍫"],["Munk med strössel","🍩"],["Citron","🍋"],["Vattenmelon","🍉"]]],
["Magiska motiv","magic",[
["Enhörning","🦄"],["Drakunge","🐲"],["Sjöjungfru","🧜"],["Trollstav","🪄"],["Sagocastle","🏰"],["Regnbågsmoln","🌈"],["Magisk svamp","🍄"],["Älva","🧚"],["Robotmonster","🤖"],["Slime","🟢"]]],
["Havets djur","sea",[
["Bläckfisk","🐙"],["Manet","🪼"],["Sjöstjärna","⭐"],["Krabba","🦀"],["Haj","🦈"],["Sjöhäst","🐠"],["Val","🐳"],["Tropisk fisk","🐠"],["Säl","🦭"],["Korall","🪸"]]],
["Fordon och fart","vehicle",[
["Skateboard","🛹"],["Sparkcykel","🛴"],["Mountainbike","🚵"],["Brandbil","🚒"],["Polisbil","🚓"],["Monstertruck","🛻"],["Traktor","🚜"],["Helikopter","🚁"],["Flygplan","✈️"],["Ubåt","🚢"]]],
["Rymdäventyr","space",[
["Astronaut","👩‍🚀"],["UFO","🛸"],["Saturnus","🪐"],["Måne","🌙"],["Sol med ansikte","☀️"],["Rymdraket","🚀"],["Komet","☄️"],["Rymdrobot","🤖"],["Stjärnbild","✨"],["Främmande planet","🪐"]]],
["Sport och spel","sport",[
["Fotboll","⚽"],["Basketboll","🏀"],["Tennisracket","🎾"],["Fotbollssko","👟"],["Skateboardhjälm","🪖"],["Pokal","🏆"],["Målvaktshandske","🧤"],["Medalj","🥇"],["Bowlingkägla","🎳"],["Badmintonracket","🏸"]]],
["Årstider och fest","season",[
["Kaktus","🌵"],["Solros","🌻"],["Snögubbe","☃️"],["Julgran","🎄"],["Pepparkaksgubbe","🍪"],["Present","🎁"],["Tomteluva","🎅"],["Påskägg","🥚"],["Hjärta","❤️"],["Fyrverkeri","🎆"]]]
];
const circle=(x,y,rx,ry=rx)=>'M'+(x-rx)+' '+y+'a'+rx+' '+ry+' 0 1 0 '+(rx*2)+' 0a'+rx+' '+ry+' 0 1 0 -'+(rx*2)+' 0Z';
const line=(a,b,c,d)=>'M'+a+' '+b+'L'+c+' '+d;
const P=(d,c=null)=>[d,c];
const palette=['#ef956b','#f2c45c','#a4c987','#b2a0e2','#8ed5de','#f5a6b8','#dba66e','#f0c783','#7cc2a0','#f6aa65'];
const lessons={},subjects=[];
function makeLesson(name,type,v){
 const color=palette[v],light='#fff0ce',pink='#e78ca2',dark='#283d36';
 const g=[[],[],[],[]];
 const add=(i,d,c)=>g[i].push(P(d,c));
 // Step 1 is construction; subsequent stages add recognizable, reusable vector shapes.
 add(0,circle(140,138,66,62));add(0,line(140,78,140,200));
 if(type==='animal'){
   add(0,circle(140,240,58,76));
   const big=v%3===0;
   const ears=v%5;
   const earA=ears===0?'M91 109Q49 52 65 38Q101 38 117 92Z':ears===1?'M94 107Q65 6 95 8Q122 22 119 94Z':ears===2?circle(85,83,27):ears===3?'M94 111Q43 92 50 61Q83 53 111 99Z':'M90 103Q64 34 97 31L121 94Z';
   const earB=ears===0?'M189 109Q231 52 215 38Q179 38 163 92Z':ears===1?'M186 107Q215 6 185 8Q158 22 161 94Z':ears===2?circle(195,83,27):ears===3?'M186 111Q237 92 230 61Q197 53 169 99Z':'M190 103Q216 34 183 31L159 94Z';
   add(1,circle(140,235,57,75),color);add(1,earA,color);add(1,earB,color);add(1,circle(140,138,big?76:69,63),color);
   if(v===0||v===2)add(1,circle(140,174,43,28),light);
   if(v===1)add(1,'M195 185Q247 142 219 101Q249 158 234 205Z',color);
   if(v===3||v===9)add(1,'M191 264Q248 266 220 210Q265 238 251 278Q238 308 192 296Z',color);
   if(v===7)add(1,'M130 77L140 56L151 77Z','#f5a83f');
   add(2,circle(116,140,9,13),dark);add(2,circle(164,140,9,13),dark);
   add(2,circle(119,136,3), '#fff');add(2,circle(167,136,3),'#fff');
   add(2,'M132 166Q140 159 148 166L140 174Z',pink);add(2,'M140 174Q130 186 120 175M140 174Q150 186 160 175');
   if(v===8)add(2,'M113 110Q140 90 167 110');
   if(v===4||v===6)add(2,'M100 179L78 172M100 188L77 192M180 179L202 172M180 188L203 192');
   if(v===0||v===2)add(2,circle(140,168,19,13),light);
   add(3,circle(112,173,12,8),pink);add(3,circle(168,173,12,8),pink);
   add(3,'M105 279L104 318M175 279L176 318');
   if(v===3||v===6)add(3,'M105 210Q140 227 175 210');
   if(v===1||v===5)add(3,'M86 105L73 95M194 105L207 95');
 }else if(type==='food'){
   const variety=v%5;
   if(variety===0){ // round pastry / fruit
     add(1,circle(140,199,88,88),color);
     add(1,circle(140,194,33,33),light);
     add(3,'M75 153L87 140M200 154L214 144M180 242L193 253M101 253L86 260',pink);
   }else if(variety===1){ // ice cream / corn / cone
     add(1,'M87 188L140 320L193 188Z','#d9b074');
     add(1,circle(140,165,72,64),color);
     add(3,'M108 215L167 289M166 220L114 288');
   }else if(variety===2){ // cup or carton
     add(1,'M76 124L204 124L188 304L92 304Z',color);
     add(1,'M76 129Q140 109 204 129L200 151Q140 171 80 151Z',light);
     add(3,'M159 74L174 127M152 73L164 67',pink);
   }else if(variety===3){ // cake
     add(1,'M79 173L201 173L187 303L93 303Z',color);
     add(1,'M69 174Q86 128 105 152Q140 117 167 154Q195 124 211 173Z',light);
     add(3,circle(142,137,14),pink);
   }else { // slice/triangle
     add(1,'M140 89L238 291L42 291Z',color);
     add(1,'M49 281Q140 310 231 281L239 302Q140 331 41 302Z',light);
     add(3,circle(137,226,12),pink);add(3,circle(104,270,8),light);add(3,circle(170,268,8),light);
   }
   add(2,circle(115,203,8,12),dark);add(2,circle(165,203,8,12),dark);
   add(2,'M126 230Q140 242 154 230');add(2,circle(96,226,11,6),pink);add(2,circle(185,226,11,6),pink);
 }else if(type==='magic'){
   const fanc=v%5;
   if(fanc===0){add(1,circle(140,181,77,75),light);add(1,'M127 116L140 36L153 116Z','#f3d16b');add(1,'M85 134Q70 65 101 75L120 116Z',color);add(1,'M195 134Q210 65 179 75L160 116Z',color)}
   if(fanc===1){add(1,'M74 243L88 119Q135 53 190 119L206 243Q140 299 74 243Z',color);add(1,'M93 121L70 84L117 99Z',light);add(1,'M187 121L210 84L163 99Z',light)}
   if(fanc===2){add(1,'M107 106Q140 46 173 106L181 214L140 309L99 214Z',color);add(1,circle(140,126,52,48),light)}
   if(fanc===3){add(1,'M105 305L180 109L191 114L116 311Z','#e6b778');add(1,'M178 71L192 45L206 71L235 81L205 94L192 119L178 94L149 81Z','#fee2a3')}
   if(fanc===4){add(1,'M70 300V151L109 110V86L140 116L171 86V110L210 151V300Z',color);add(1,'M119 300V239Q140 217 161 239V300Z',dark)}
   if(fanc!==3){add(2,circle(118,185,8,12),dark);add(2,circle(162,185,8,12),dark);add(2,'M127 209Q140 223 153 209')}
   add(3,'M44 115L49 98L54 115L70 121L54 126L49 144L44 126L28 121Z','#ffdc79');
   add(3,'M219 198L224 181L229 198L245 203L229 208L224 225L219 208L203 203Z','#ffdc79');
 }else if(type==='sea'){
   const variety=v%5;
   if(variety===0){add(1,circle(140,147,75,63),color);for(let k=0;k<5;k++){const x=76+k*31;add(1,'M'+x+' 188Q'+(x-23)+' 273 '+(x+4)+' 311Q'+(x+27)+' 314 '+(x+21)+' 273',color)}}
   if(variety===1){add(1,'M59 172Q74 67 140 79Q207 68 221 172Q204 193 194 196L86 196Q73 195 59 172Z',color);for(let k=0;k<4;k++)add(1,'M'+(90+k*31)+' 191Q'+(74+k*31)+' 263 '+(89+k*31)+' 315',light)}
   if(variety===2){add(1,'M140 62L160 143L234 120L186 188L228 258L147 230L78 286L88 204L42 154L121 157Z',color)}
   if(variety===3){add(1,circle(140,210,73,53),color);add(1,'M75 204L39 145L51 232Z',color);add(1,'M205 204L241 145L229 232Z',color);add(3,'M96 260L77 285M184 260L203 285')}
   if(variety===4){add(1,'M45 195Q101 103 200 162L244 129L231 194L244 254L199 226Q97 282 45 195Z',color);add(1,'M126 147L162 91L182 161Z',color)}
   add(2,circle(119,173,8,12),'#253c37');add(2,circle(162,173,8,12),'#253c37');add(2,'M128 203Q140 214 153 203');
   add(3,circle(97,205,10,7),pink);add(3,circle(185,205,10,7),pink);add(3,circle(217,85,14),null);add(3,circle(236,67,7),null);
 }else if(type==='vehicle'){
   const variety=v%5;
   if(variety===0){add(1,'M34 202Q140 172 245 202L236 234Q140 259 43 234Z',color);add(1,circle(79,251,20),dark);add(1,circle(201,251,20),dark)}
   if(variety===1){add(1,'M74 257L210 257L193 285L85 285Z',color);add(1,'M172 257L178 109L189 109L189 257Z',light);add(1,'M153 110L217 110',null)}
   if(variety===2){add(1,circle(83,258,37),dark);add(1,circle(202,258,37),dark);add(1,circle(83,258,21),light);add(1,circle(202,258,21),light);add(1,'M83 258L121 173L173 173L202 258L140 258Z',color)}
   if(variety===3){add(1,'M48 192L65 137L183 137L230 185V259H48Z',color);add(1,'M86 150H172L195 190H65Z',light);add(1,circle(87,265,26),dark);add(1,circle(193,265,26),dark)}
   if(variety===4){add(1,'M53 190Q92 143 188 161L231 193L183 220H58Z',color);add(1,'M110 157L133 101L162 165Z',light);add(1,'M82 215L70 254M182 217L192 251',null)}
   add(2,circle(120,201,7,10),dark);add(2,circle(160,201,7,10),dark);add(2,'M129 222Q140 231 151 222');
   add(3,'M83 147L118 147M160 147L189 147');add(3,circle(140,205,7),pink);
 }else if(type==='space'){
   const variety=v%5;
   if(variety===0){add(1,circle(140,163,70,75),color);add(1,circle(140,155,51,52),'#c8e7e8');add(1,'M103 234L93 317H187L177 234Z',light)}
   if(variety===1){add(1,'M63 200Q84 106 196 145Q228 153 226 200Z',color);add(1,'M32 201Q140 169 248 201Q140 254 32 201Z',light)}
   if(variety===2){add(1,circle(140,200,73,71),color);add(1,'M33 228Q134 124 245 177Q215 245 39 244Z',light)}
   if(variety===3){add(1,'M171 83Q104 110 100 190Q104 258 173 290Q79 290 57 191Q55 93 171 83Z',color)}
   if(variety===4){add(1,circle(140,194,70),color);for(let k=0;k<10;k++){const a=k*Math.PI/5,rad=103;add(1,line(Math.round(140+Math.cos(a)*83),Math.round(194+Math.sin(a)*83),Math.round(140+Math.cos(a)*rad),Math.round(194+Math.sin(a)*rad)))}}
   add(2,circle(120,191,7,10),dark);add(2,circle(160,191,7,10),dark);add(2,'M128 211Q140 225 153 211');
   add(3,'M46 91L51 75L56 91L72 96L56 101L51 117L46 101L30 96Z','#ffe3a2');
   add(3,'M222 288L227 272L232 288L248 293L232 298L227 314L222 298L206 293Z','#ffe3a2');
 }else if(type==='sport'){
   const variety=v%5;
   if(variety===0){add(1,circle(140,200,83),light);add(1,'M140 153L179 179L164 225H116L101 179Z',dark);add(3,'M101 179L66 157M179 179L215 157M116 225L102 271M164 225L178 271')}
   if(variety===1){add(1,circle(140,200,83),color);add(3,'M62 179Q140 209 220 179M140 116V283M84 140Q172 206 84 261M196 140Q108 206 196 261')}
   if(variety===2){add(1,circle(140,158,67),color);add(1,'M134 222L142 317L157 317L146 222Z',light);add(3,'M90 109L186 205M86 133L181 229M97 93L194 190M184 109L88 205M190 133L93 229')}
   if(variety===3){add(1,'M48 245Q88 225 105 166L155 195L236 246L223 281L69 281Z',color);add(3,'M70 277H223M112 198L129 210M100 216L118 228')}
   if(variety===4){add(1,'M67 203Q70 99 140 99Q210 99 213 203L191 233H90Z',color);add(1,'M82 218L198 218L181 239L98 239Z',light)}
   add(2,circle(115,182,7,9),dark);add(2,circle(165,182,7,9),dark);add(2,'M128 205Q140 217 153 205');
 }else if(type==='season'){
   const variety=v%5;
   if(variety===0){add(1,'M130 291L130 218Q98 196 115 128Q140 92 166 128Q182 195 149 218L149 291Z','#76b77b');add(1,'M102 292H177L168 324H112Z',color);add(3,'M118 155L101 143M161 174L179 166')}
   if(variety===1){add(1,circle(140,158,74),color);for(let k=0;k<8;k++){const a=k*Math.PI/4;add(1,circle(Math.round(140+Math.cos(a)*61),Math.round(158+Math.sin(a)*61),26),color)}add(1,circle(140,158,44),'#7b533d');add(1,'M134 209L134 321H145L145 209Z','#76b77b')}
   if(variety===2){add(1,circle(140,250,64),light);add(1,circle(140,155,50),light);add(1,'M109 109L117 79H163L170 109Z',dark);add(3,'M83 230L45 201M195 230L235 201')}
   if(variety===3){add(1,'M140 58L61 205H100L48 268H232L180 205H219Z','#67b186');add(1,'M128 266V323H152V266Z','#9c755a');add(3,circle(115,195,13),pink);add(3,circle(167,245,12),'#f8d276')}
   if(variety===4){add(1,'M140 80Q203 61 218 134Q234 221 140 298Q46 221 62 134Q77 61 140 80Z',color);add(1,'M139 113L158 132L139 150L121 132Z',light);add(3,circle(112,244,11),pink);add(3,circle(170,244,11),pink)}
   add(2,circle(117,170,8,10),dark);add(2,circle(163,170,8,10),dark);add(2,'M128 193Q140 208 152 193');
 }
 // Each has four incremental geometry groups; the fifth step uses the shared color-fill animation.
 const texts=['Rita den stora grundformen med mjuka hjälplinjer.',
 'Rita konturen och de viktigaste delarna av '+name.toLocaleLowerCase('sv')+'.',
 'Lägg till ögon, ansikte och de små detaljerna.',
 'Förstärk de färdiga linjerna och sudda hjälplinjerna.',
 'Färglägg motivet och gör det till ditt eget!'];
 return {name,groups:g,texts};
}
let count=0;
for(const [category,type,items] of categories){
 items.forEach(([name,emoji],i)=>{
  const id='nyrit'+String(++count).padStart(3,'0');
  const difficulty=i<4?'Lätt':i<8?'Medel':'Svårt';
  const kind=(type==='animal'||type==='sea')?'Djur':'Saker';
  subjects.push({id,name,article:'en',difficulty,emoji,kind:type,subjectKind:kind});
  lessons[id]=makeLesson(name,type,i);
 });
}
window.newDrawingSubjects=subjects;
window.newDrawingLessons=lessons;
// The same five-stage chalkboard preview is used on both gallery cards and the open dialog.
window.paintNewDrawingSprite=(canvas)=>{
 const lesson=lessons[canvas.dataset.drawingGuide];if(!lesson||canvas.dataset.rendered)return false;
 const W=1993,H=530;canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d');
 for(let i=0;i<5;i++){
  const x=34+i*388+2,y=16,tw=370,th=498;
  c.fillStyle='#082c1d';c.beginPath();c.roundRect(x,y,tw,th,17);c.fill();
  c.save();c.translate(x+29,y+14);c.scale(1.12,1.18);
  // The five successive panels add geometry, ending with the completed colored motif.
  for(let k=(i===0?0:1);k<=Math.min(i,3);k++){
   for(const [d,color] of lesson.groups[k]){
    try{const p=new Path2D(d);c.lineWidth=k===0?1.5:2.4;c.lineJoin='round';c.lineCap='round';
     c.strokeStyle=k===0?'#829d87':'#f4ead3';
     if(i===4&&color){c.fillStyle=color;c.fill(p)}else if(color){c.fillStyle='#082c1d';c.fill(p)}
     c.stroke(p);
    }catch(_){}
   }
  }
  c.restore();
  c.fillStyle='#ff791e';c.beginPath();c.arc(x+32,y+34,25,0,Math.PI*2);c.fill();
  c.fillStyle='#fff';c.font='bold 30px system-ui';c.textAlign='center';c.fillText(String(i+1),x+32,y+44);
 }
 canvas.dataset.rendered='1';return true;
};
})();
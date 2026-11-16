// Recovered final independently authored geometry. All original paper is retained.
const F=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra});
const U={kind:'unfold',text:'Öppna papperet igen.'};
const T={kind:'turn',text:'Vänd på papperet.'};
const E=text=>({kind:'finish',text});
const S=(label,url,designer='Formgivare inte angiven i källan')=>({label,url,designer});
const Q={width:150,height:150,front:false,label:'Kvadrat · 15 × 15 cm'};
const R=150/Math.sqrt(2);
const D={...Q,outline:[[0,-R],[R,0],[0,R],[-R,0]]};
const V=x=>[[x,-250],[x,250]],H=y=>[[-250,y],[250,y]];
const point=(a,b)=>{const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[0]-a[0],dy=b[1]-a[1];return [[m[0]+dy,m[1]-dx],[m[0]-dy,m[1]+dx]]};
const base=(id,name,color,paper,source,steps,materials='Ett papper. Inget lim och ingen sax.')=>({id,name,color,paper,source,steps,materials,category:'Saker & leksaker',level:'Lätt',minutes:'5–10 min'});
const rocket=base('rymdraket','Rymdraket','#db9789',Q,S('Origami Way – Rocket','https://www.origamiway.com/origami-rocket/'),[
 F('Vik på mitten från vänster till höger.',V(0),1),U,F('Vik överkanten till nederkanten.',H(0),-1),U,
 F('Vik överkanten till mitten.',H(-37.5),-1),T,
 F('Vik vänstra övre hörnet in till mittlinjen.',[[0,-37.5],[-75,37.5]],1),
 F('Vik högra övre hörnet likadant.',[[0,-37.5],[75,37.5]],-1),
 F('Vik höger rak kant till mitten.',V(37.5),-1,{tag:'right'}),
 F('Vik vänster rak kant till mitten.',V(-37.5),1,{tag:'left'}),
 F('Vik ut två tredjedelar av vänstra fliken.',V(-25),-1,{select:{has:'left'}}),
 F('Vik ut lika mycket av högra fliken.',V(25),1,{select:{has:'right'}}),T,
 E('Rymdraketen är klar! Rita gärna en rund lucka. Det här är en platt dekoration.')],
 'Ett kvadratiskt papper. Penna till den runda luckan. Inget lim och ingen sax.');
const kite=base('pappersdrake','Pappersdrake','#e7b657',D,S('Origami Guide – Kite Fold','https://origami.guide/beginner-origami/origami-folding-techniques/origami-kite-fold/','Traditionell drakbas'),[
 F('Vik höger hörn till vänster hörn.',V(0),-1),U,
 F('Vik den nedre vänstra kanten till mittlinjen.',[[0,R],[-R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],-1),
 F('Vik den nedre högra kanten till mittlinjen.',[[0,R],[R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],1),T,
 E('Din pappersdrake är klar. Rita ett mönster på framsidan. Det är en dekoration, inte en flygande drake.')],'Ett kvadratiskt papper. Penna om du vill dekorera draken.');
const collarL=point([-37.5,-90],[0,-75]),collarR=point([37.5,-90],[0,-75]);
const shirt=base('skjorta','Skjorta','#94b8bc',{width:150,height:210,front:false,label:'Rektangel · 15 × 21 cm'},S('Origami Resource Center – Shirt','https://origami-resource-center.com/origami-shirt/'),[
 F('Vik på mitten på längden.',V(0),1),U,
 F('Vik vänstra långsidan till mittlinjen.',V(-37.5),1,{tag:'left'}),
 F('Vik högra långsidan till mittlinjen.',V(37.5),-1,{tag:'right'}),
 F('Vik ut vänstra nedre fliken snett, till en ärm.',[[0,40],[-37.5,105]],-1,{select:{has:'left'},tag:'sleeve'}),
 F('Vik ut högra nedre fliken lika mycket.',[[0,40],[37.5,105]],1,{select:{has:'right'},tag:'sleeve'}),
 F('Vik översta 15 mm bakåt.',H(-90),-1,{direction:-1}),
 F('Vik vänstra överhörnet in till mittlinjen, lite nedåt.',collarL,1,{select:{not:'sleeve'},tag:'collar-left'}),
 F('Vik högra överhörnet till samma punkt.',collarR,1,{select:{not:'sleeve'},tag:'collar-right'}),
 F('Vik nederdelen uppåt så att kanten når under kragen.',H(11.25),1,{tag:'body'}),
 {kind:'tuck',text:'Lyft vänstra kragsnibben och stoppa skjortans överkant under den.',cap:{select:{has:'collar-left'},axis:collarL,angle:35},flap:{select:{has:'body'},axis:H(11.25),angle:-8}},
 {kind:'tuck',text:'Lägg också högra kragsnibben ovanpå överkanten.',cap:{select:{has:'collar-right'},axis:collarR,angle:35},flap:{select:{has:'body'},axis:H(11.25),angle:-8}},
 E('Skjortan är klar! Rita knappar eller skriv en hälsning inuti.')]);
const helmet=base('samurajhjalm','Platt samurajhjälm','#a4a0ca',D,S('Origami-Fun – Samurai Hat','https://www.origami-fun.com/origami-samurai-hat.html','Traditionell modell; platt dekorationsvariant med bakåtvikt slutflik'),[
 F('Vik översta hörnet till det nedersta.',H(0),-1,{tag:'front'}),
 F('Vik vänstra hörnet till den nedersta spetsen.',[[0,0],[-R/2,R/2]],1,{tag:'corner-left'}),
 F('Vik högra hörnet till samma spets.',[[0,0],[R/2,R/2]],-1,{tag:'corner-right'}),
 F('Vik vänstra främre spetsen upp till översta hörnet.',H(R/2),1,{select:{has:'corner-left'}}),
 F('Vik högra främre spetsen upp likadant.',H(R/2),1,{select:{has:'corner-right'}}),
 F('Vik vänstra översta fliken snett utåt.',[[0,R/2],[-R*.15,0]],1,{select:{has:'corner-left'},tag:'horn'}),
 F('Vik högra översta fliken snett utåt.',[[0,R/2],[R*.15,0]],-1,{select:{has:'corner-right'},tag:'horn'}),
 F('Vik främre nedre spetsen uppåt. Lämna en smal kant.',H(R*.625),1,{select:{has:'front'},tag:'brim'}),
 F('Vik upp den smala kanten över den första vikningen.',H(R*.5),1,{select:{has:'front'}}),
 F('Vik den återstående nedersta spetsen bakåt längs nederkanten.',H(R*.5),1,{select:{not:'front'},direction:-1}),
 E('Din platta hjälmdekoration är klar! Lägg den på ett kort eller i en pappersbild.')],'Ett kvadratiskt papper. Guiden gör en platt dekoration, inte en hatt att bära.');
const penTip=[-9.375,-65.625],penRise=9.375*(1+Math.SQRT2);
const pencil=base('papperspenna','Papperspenna','#e9b659',{width:37.5,height:150,front:false,label:'Pappersremsa · 3,75 × 15 cm'},S('Origami Instructions – Pencil','https://www.origami-instructions.com/origami-pencil.html'),[
 F('Vik remsan på mitten på längden.',V(0),1),U,
 F('Vik övre vänstra hörnet till mittlinjen.',[[0,-75],[-18.75,-56.25]],1),T,
 F('Vik övre vänstra hörnet till högra kanten.',[[18.75,-75],[-18.75,-37.5]],1),T,
 F('Vik remsans högra halva över den vänstra.',V(0),-1),
 F('Vik vänstra sneda kanten in till spetsens mittlinje.',[penTip,[-18.75,penTip[1]+penRise]],1),
 F('Vik högra sneda kanten in likadant.',[penTip,[0,penTip[1]+penRise]],-1),T,
 E('Papperspennan är klar! Den är en dekoration och går inte att skriva med.')],'En färdig pappersremsa, 3,75 × 15 cm, med olika färg på sidorna. Klipp till remsan före vikningen om du börjar med ett helt ark.');
const house=base('enkelt-hus','Litet pappershus','#d58c78',Q,S('PlayOwl – Flat Folded House','https://www.playowl.com/paper-crafts/origami-house','Enkel husvariant publicerad av PlayOwl'),[
 F('Vik vänstra kanten till den högra.',V(0),1),U,
 F('Vik vänstra överhörnet ned så att överkanten följer mittlinjen.',[[0,-75],[-75,0]],1),
 F('Vik högra överhörnet ned på samma sätt.',[[0,-75],[75,0]],-1),
 E('Huset är klart! Rita dörr och fönster på den vita väggen.')],'Ett kvadratiskt papper med färg på ena sidan. Penna till dörr och fönster.');
const tie=base('slips','Slips','#8d9eca',D,S('Harada Eigo Origami – Necktie','https://www.haradaeigo.com/origami/en/m/necktie/','Harada Eigo, enkel originalvariant'),[
 F('Vik hörnen mot varandra längs den lodräta mittlinjen.',V(0),1),U,
 F('Vik den övre vänstra kanten in till mitten.',[[0,-R],[-R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],1),
 F('Vik den övre högra kanten in till mitten.',[[0,-R],[R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],-1),
 F('Vik vänstra sneda kanten till mitten en gång till.',[[0,-R],[-R*Math.tan(Math.PI/16),0]],1),
 F('Vik högra sneda kanten till mitten en gång till.',[[0,-R],[R*Math.tan(Math.PI/16),0]],-1),T,
 F('Vik den smala översta spetsen nedåt till en liten knut.',H(-R*.57),-1),
 E('Slipsen är klar! Rita ränder eller prickar om du vill.')]);
const shorts=base('shorts','Shorts','#7c9dbe',Q,S('Harada Eigo Origami – Pants','https://www.haradaeigo.com/origami/en/m/pants/','Harada Eigo, enkel originalvariant'),[
 F('Vik papperet på mitten uppifrån och ned.',H(0),-1),U,
 F('Vik överkanten till mittlinjen.',H(-37.5),-1),
 F('Vik nederkanten till mittlinjen.',H(37.5),1,{tag:'front-band'}),
 F('Vik övre halvan bakåt längs mitten.',H(0),-1,{direction:-1}),
 F('Vik ned 5 mm av det främsta lagrets överkant till ett bälte.',H(5),-1,{select:{has:'front-band'}}),
 F('Vik vänstra änden snett ned bakom mitten till ett ben.',[[-8,0],[-41,37.5]],1,{direction:-1}),
 F('Vik högra änden likadant. Lämna en liten springa mellan benen.',[[8,0],[41,37.5]],-1,{direction:-1}),
 E('Dina shorts är klara! Rita en knapp och fickor.')]);
rocket.face={marks:[{kind:'ellipse',x:0,y:31,rx:16,ry:16,fill:'#324c61'},{kind:'ellipse',x:0,y:31,rx:13.5,ry:13.5,fill:'#f4ead8'},{kind:'ellipse',x:0,y:31,rx:10.5,ry:10.5,fill:'#67b9d6'}]};
export const models=[rocket,kite,shirt,helmet,pencil,house,tie,shorts];

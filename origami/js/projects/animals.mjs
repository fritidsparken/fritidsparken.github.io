const R=150/Math.sqrt(2);
const square={width:150,height:150,front:false,outline:[[0,-R],[R,0],[0,R],[-R,0]],label:'Kvadrat · 15 × 15 cm'};
const f=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra});
const u={kind:'unfold',text:'Öppna den senaste vikningen igen.'};
const t={kind:'turn',text:'Vänd på hela papperet.'};
const end=text=>({kind:'finish',text});
const h=y=>[[-R,y],[R,y]],v=x=>[[x,-R],[x,R]];
const src=(label,url,designer='Traditionell modell')=>({label,url,designer});
const make=(id,name,color,source,steps,extra={})=>({id,name,category:'Djur',level:'Lätt',minutes:'5–10 min',color,paper:square,materials:'Ett kvadratiskt papper, gärna med olika färg på sidorna. Penna om du vill dekorera.',source,steps,...extra});
const turn180={kind:'turn',text:'Vrid hela modellen ett halvt varv.',axis:[[0,0,0],[0,0,1]],angle:180};
export const models=[
make('val','Val','#75aecb',src('Origami Instructions – Easy Whale','https://www.origami-instructions.com/easy-origami-whale.html','Formgivare inte angiven i källan'),[
 f('Vik höger hörn till vänster för ett mittveck.',v(0),-1),u,
 f('Vik vänstra nederkanten till mittvecket.',[[0,R],[-R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],-1),
 f('Vik högra nederkanten till mittvecket.',[[0,R],[R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],1),
 f('Vik översta spetsen till mitten.',h(-R/2),-1),
 f('Vik vänstra halvan över den högra.',v(0),1),
 f('Vik upp den smala stjärten snett åt sidan.',[[0,R*.58],[R*.4,R*.34]],1),
 {kind:'turn',text:'Vrid valen ett kvarts varv så att stjärten pekar åt vänster.',axis:[[0,0,0],[0,0,1]],angle:90},end('Valen är klar! Rita ett öga om du vill.')]),
make('cikada','Cikada','#a6b87c',src('Origami Guide – Cicada Bug','https://origami.guide/origami-animals/origami-insects/origami-cicada-bug/'),[
 f('Vik översta hörnet till det nedersta.',h(0),-1,{tag:'front'}),
 f('Vik höger hörn till nedersta spetsen.',[[0,0],[R,R]],-1,{tag:'wing'}),
 f('Vik vänster hörn till nedersta spetsen.',[[0,0],[-R,R]],1,{tag:'wing'}),
 f('Vik de två översta flikarnas spetsar upp till överkanten.',h(R/2),1,{select:{has:'wing'}}),
 f('Vik upp bara den främre nedersta spetsen. Lämna en liten glipa.',h(R*.625),1,{select:{has:'front',not:'wing'}}),
 f('Vik upp den sista nedersta spetsen, lite mindre än den förra.',h(R*.71),1,{select:{not:'front'}}),
 t,
 f('Vik vänstra sidan in till mitten.',[[-R*.5,R*.5],[-R*.15,R*.75]],1),
 f('Vik högra sidan in till mitten.',[[R*.5,R*.5],[R*.15,R*.75]],-1),t,turn180,
 end('Cikadan är färdig. Rita gärna ögon på den breda änden.')]),
make('nyckelpiga','Nyckelpiga','#de6d68',src('Origami Guide – Ladybug','https://origami.guide/origami-animals/origami-insects/origami-ladybug/'),[
 f('Vik översta hörnet till det nedersta.',h(0),-1),
 f('Vik höger hörn till vänster.',v(0),-1),u,
 f('Vik höger spets nedåt, lite utanför mittlinjen.',[[0,0],[R*.7,R*.58]],-1),
 f('Vik vänster spets likadant på andra sidan.',[[0,0],[-R*.7,R*.58]],1),t,
 f('Vik översta spetsen en liten bit nedåt.',h(R*.20),-1,{tag:'head'}),
 f('Vik spetsen tillbaka upp. Lämna ett smalt veck.',h(R*.25),1,{select:{has:'head'}}),t,
 f('Vik den lilla vänstra ytterspetsen bakåt.',v(-R*.43),1,{direction:-1}),
 f('Vik den lilla högra ytterspetsen bakåt.',v(R*.43),-1,{direction:-1}),
 end('Rita svart huvud, prickar och en linje mellan vingarna. Nyckelpigan är klar!')]),
make('fluga','Fluga','#91a4b3',src('Origami Guide – Fly','https://origami.guide/origami-animals/origami-insects/origami-fly/'),[
 f('Vik nedersta hörnet till det översta.',h(0),1,{tag:'front'}),
 f('Vik höger hörn till den översta spetsen.',[[0,0],[R,-R]],1,{tag:'right-wing'}),
 f('Vik vänster hörn till den översta spetsen.',[[0,0],[-R,-R]],-1,{tag:'left-wing'}),
 f('Vik högra flikens spets nedåt och lite utåt.',[[0,-R*.30],[R*.5,-R*.45]],-1,{select:{has:'right-wing'},tag:'wing'}),
 f('Vik vänstra flikens spets nedåt och lite utåt.',[[0,-R*.30],[-R*.5,-R*.45]],1,{select:{has:'left-wing'},tag:'wing'}),
 f('Vik ned den främre mittspetsen till vingarnas fäste.',h(-R*.625),-1,{select:{has:'front',not:'wing'}}),
 f('Vik den sista översta spetsen till flikens kant.',h(-R*.8125),-1,{select:{not:'front'}}),u,
 f('Vik ned den sista spetsen så att vecket når fliken bakom.',h(-R*.71875),-1,{select:{not:'front'}}),t,
 f('Vik vänstra kroppssidan inåt bakom vingen.',[[-R*.5,-R*.5],[-R*.15,-R*.75]],-1),
 f('Vik högra kroppssidan likadant.',[[R*.5,-R*.5],[R*.15,-R*.75]],1),t,
 f('Vik den lilla vänstra huvudspetsen inåt.',[[-R*.23,-R*.72],[-R*.34,-R*.61]],1),
 f('Vik den lilla högra huvudspetsen inåt.',[[R*.23,-R*.72],[R*.34,-R*.61]],-1),
 end('Flugan är klar. Rita gärna två stora ögon!')]),
];
models.push(
make('pingvin','Pingvin','#687f92',src('Origami Club – Easy Penguin','https://en.origami-club.com/easy/sea/penguin/zu.html','Diagram av Fumiaki Shingu, Origami Club'),[
 f('Vik på mitten från höger till vänster.',v(0),-1),u,
 f('Vik nedersta hörnet till det översta.',h(0),1),u,
 f('Vik nedersta spetsen uppåt. Lämna en färgad kant runt den.',h(R*.2),1,{tag:'belly'}),
 f('Vik ned magflikens lilla spets till mitten. Det blir näbben.',h(-R*.3),-1,{select:{has:'belly'}}),t,
 f('Vik vänstra sidan inåt, förbi mittlinjen.',v(-R*.375),1,{tag:'left-side'}),
 f('Vik högra sidan inåt lika långt.',v(R*.375),-1,{tag:'right-side'}),
 f('Vik den vänstra sidfliken tillbaka utåt till en vinge.',v(-R*.1875),-1,{select:{has:'left-side'}}),
 f('Vik den högra sidfliken tillbaka utåt likadant.',v(R*.1875),1,{select:{has:'right-side'}}),
 f('Vik ned den lilla översta spetsen så huvudet blir platt.',h(-R*.85),-1),t,
 end('Din platta pingvin är klar! Rita två ögon över näbben.')],{paper:{...square,front:true}}),
make('fisk','Fisk','#e3a55f',src('Origami.me – Very Easy Fish','https://origami.me/fish/'),[
 f('Vik översta hörnet till det nedersta.',h(0),-1,{tag:'front'}),
 f('Lyft bara den främre nedersta spetsen. Låt den nå lite ovanför överkanten.',h(R*.4),1,{select:{has:'front'}}),
 f('Vik den bakre spetsens vänstra snedkant upp till det vågräta vecket.',[[-R*.6,R*.4],[R*.3,R*(.4+.9*Math.tan(Math.PI/8))]],1,{select:{not:'front'},tag:'fin'}),
 f('Vik fenfliken nedåt igen. Lämna en smal remsa i vikningen.',[[-R*.6,R*.33],[R*.3,R*(.33+.9*Math.tan(Math.PI/8))]],-1,{select:{has:'fin'}}),
 f('Vik vänstra hörnet snett åt höger för stjärten.',[[-R*.73,0],[-R*.58,R*.47]],1,{tag:'tail'}),
 f('Vik den lilla stjärtspetsen tillbaka åt vänster.',[[-R*.73,0],[-R*.4,R*.22]],-1,{select:{has:'tail'}}),t,
 f('Vik vänstra huvudspetsen ned till den nedre hörnpunkten.',[[-R*.25,0],[-R*.75,R*.5]],1),
 end('Fisken är klar! Rita gärna ett öga på huvudet.')]),
make('risfisk','Risfisk','#d5b567',src('Origami Club – Rice Fish','https://en.origami-club.com/easy/sea/rice-fish/zu.html','Diagram av Fumiaki Shingu, Origami Club'),[
 f('Vik långsidorna mot varandra för ett mittveck.',[[-75,0],[75,0]],1),u,
 f('Vik in vänstra fjärdedelen av papperet.',[[-37.5,-37.5],[-37.5,37.5]],1),t,
 f('Vik högra överhörnet in till mittveckets högra spets.',[[0,-37.5],[37.5,0]],-1),
 f('Vik högra nederhörnet till samma spets.',[[0,37.5],[37.5,0]],1),
 f('Vik vänstra nedre långsidan snett uppåt.',[[-75,0],[0,37.5]],1,{tag:'lower-tail'}),
 f('Vik tillbaka den nedre fliken. Lämna en smal remsa.',[[-75,-7.5],[0,30]],-1,{select:{has:'lower-tail'}}),
 f('Vik vänstra övre långsidan snett nedåt.',[[-75,0],[0,-37.5]],-1,{tag:'upper-tail'}),
 f('Vik tillbaka den övre fliken lika mycket.',[[-75,7.5],[0,-30]],1,{select:{has:'upper-tail'}}),
 f('Vik ihop fisken längs det långa mittvecket.',[[-75,0],[75,0]],-1),
 end('Risfisken är klar! Rita öga och fjäll om du vill.')],{paper:{width:150,height:75,front:true,label:'Rektangel · 15 × 7,5 cm'},materials:'Ett färdigt rektangulärt papper, 15 × 7,5 cm. Det motsvarar en halv kvadrat. Penna till öga och fjäll.'})
);
models.push(make('fjaril','Enkel fjäril','#c695d4',src('Enchanted Learning – Origami Butterfly','https://www.enchantedlearning.com/crafts/butterfly/origami/','Formgivare inte angiven i källan'),[
 f('Vik översta hörnet till det nedersta.',h(0),-1),
 f('Vik högra hörnet över till vänster.',v(0),-1,{tag:'right-half'}),
 f('Vik främre nedersta hörnet snett uppåt till en vinge.',[[0,R*.3],[-R*.5,R*.5]],-1,{select:{has:'right-half'}}),t,
 f('Vik det andra nedersta hörnet likadant på baksidan.',[[0,R*.3],[R*.5,R*.5]],1,{select:{not:'right-half'}}),
 {kind:'open',text:'Öppna mitten så att de två vingarna breder ut sig.',motions:[{select:{has:'right-half'},axis:v(0),angle:145}]},
 end('Fjärilen är klar! Måla gärna mönster på vingarna.')],{materials:'Ett kvadratiskt papper. Pennor till valfria vingmönster. Denna guide visar pappersformen utan påklistrade antenner.'}));
// Optional pen details appear only in the finish frame; no paper panels are added.
const dot=(x,y,rx=3.2,ry=rx,fill='#263b39')=>({x,y,rx,ry,fill});
const pen={
 val:[dot(35,18,3.4)],
 cikada:[dot(-12,-65),dot(12,-65)],
 fluga:[dot(-12,-65,4),dot(12,-65,4)],
 pingvin:[dot(-17,-52,3.8),dot(17,-52,3.8)],
 fisk:[dot(-40,37,3.8)],
 risfisk:[dot(12,10,3.2)],
 nyckelpiga:[{points:[[-26,21],[-12,21],[0,11],[12,21],[26,21],[30,31],[-30,31]],fill:'#263b39'},{points:[[-1,31],[1,31],[1,97],[-1,97]],fill:'#263b39'},dot(-22,48,5),dot(22,48,5),dot(-18,73,5),dot(18,73,5),dot(-11,26,2,2,'#fff9ea'),dot(11,26,2,2,'#fff9ea')]
};
for(const m of models)if(pen[m.id])m.face={marks:pen[m.id]};

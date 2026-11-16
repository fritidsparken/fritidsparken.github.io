// Independently authored rigid-paper geometry; practical activities.
const R=150/Math.sqrt(2),D={width:150,height:150,front:false,outline:[[0,-R],[R,0],[0,R],[-R,0]],label:'Kvadrat · 15 × 15 cm'};
const S={width:150,height:150,front:false,label:'Kvadrat · 15 × 15 cm'};
const f=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra});
const u={kind:'unfold',text:'Öppna den senaste vikningen igen.'};
const turn={kind:'turn',text:'Vänd på hela papperet.'};
const end=text=>({kind:'finish',text});
const info=text=>({kind:'instruction',text});
const h=y=>[[-200,y],[200,y]],v=x=>[[x,-200],[x,200]];
const bisect=(a,b)=>{const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];return [[m[0]+b[1]-a[1],m[1]-b[0]+a[0]],[m[0]-b[1]+a[1],m[1]+b[0]-a[0]]];};
const base=(id,name,color,paper,materials,url,label,steps)=>({id,name,category:'Saker & leksaker',level:'Lätt',minutes:'5–10 min',color,paper,materials,source:{label,url,designer:'Traditionell vikmetod; formgivare inte angiven'},steps});
const tuck=(text,cap,capAxis,flap,flapAxis)=>({kind:'tuck',text,cap:{select:cap,axis:capAxis,angle:-28},flap:{select:flap,axis:flapAxis,angle:25}});
export const models=[];
models.push(base('triangel-segelbat','Segelbåt av en triangel','#72b3d0',{width:150,height:150,area:11250,front:false,outline:[[-R,0],[0,-R],[R,0]],label:'En halv kvadrat · förberedd triangel'},'En rätvinklig likbent papperstriangel: klipp en 15 × 15 cm kvadrat diagonalt i två delar. Sax används bara vid förberedelsen. Spara den andra triangeln.','https://www.origami-fun.com/origami-sail-boats.html','Origami-Fun – Sail Boats',[
info('Börja med en färdigklippt halv kvadrat. Lägg den långa kanten nedåt och den räta vinkeln uppåt.'),f('Vik triangeln på mitten.',v(0),1),u,
f('Vik översta spetsen ned till mitten av den långa kanten.',h(-R/2),-1),
f('Vik vänstra hörnet upp längs mittlinjen så att en segelspets bildas.',[[0,0],[-R/2,-R/2]],-1),
f('Vik högra hörnet upp till samma spets.',[[0,0],[R/2,-R/2]],1),
f('Vik upp den nedersta spetsen till mitten av båten.',h(-R/4),1),turn,end('En platt segelbåt att sätta på ett kort. Den här modellen flyter inte som en öppen båt.')
]));
// The pocket is the traditional cup's flat folded stage, honestly named as such.
const rim=-(2-Math.SQRT2)*R;
models.push(base('platt-pappersficka','Platt pappersficka','#eab65a',D,'En kvadrat. Fickan är platt och passar en liten lapp; den är inte en öppnad drickkopp.','https://www.origami-fun.com/origami-drinking-cup.html','Origami-Fun – Drinking Cup, de platta vikningarna',[
f('Vik nedersta hörnet till det översta.',h(0),1,{tag:'front-half'}),
f('Vik vänstra hörnet till högra snedkanten. Flikens överkant ska bli vågrät.',bisect([-R,0],[R+rim,rim]),1,{tag:'left-lock'}),
f('Vik högra hörnet till vänstra kanten på samma höjd.',bisect([R,0],[-R-rim,rim]),1,{tag:'right-lock'}),
f('Vik den främsta översta spetsen ned över sidoflikarna.',h(rim),-1,{select:{has:'front-half'},tag:'front-rim'}),
f('Vik den andra översta spetsen bakåt på samma höjd.',h(rim),-1,{select:{not:'front-half'},direction:-1}),end('Fickan är färdig och platt. En liten lapp kan glida ned mellan de två överkanterna.')
]));
models.push(base('hornbokmarke','Hörnbokmärke','#8bb8a7',D,'En kvadrat. Inget lim och ingen sax.','https://www.origamiway.com/origami-corner-bookmark/','Origami Way – Corner Bookmark',[
f('Vik nedersta hörnet till översta hörnet.',h(0),1,{tag:'front'}),
f('Vik höger hörn upp till översta spetsen.',[[0,0],[R/2,-R/2]],1),u,
f('Vik vänster hörn upp till översta spetsen.',[[0,0],[-R/2,-R/2]],-1),u,
f('Vik bara den främsta övre spetsen ned till nederkantens mitt.',h(-R/2),-1,{select:{has:'front'},tag:'pocket-cap'}),
f('Vik höger hörn upp igen.',[[0,0],[R/2,-R/2]],1,{tag:'right'}),
f('Vik ned högra spetsen längs fickans kant.',h(-R/2),-1,{select:{has:'right'},tag:'right-tip'}),
tuck('Lyft fickans kant lite och stoppa den högra spetsen innanför.',{has:'pocket-cap'},h(-R/2),{has:'right-tip'},h(-R/2)),
f('Vik vänster hörn upp igen.',[[0,0],[-R/2,-R/2]],-1,{tag:'left'}),
f('Vik ned vänstra spetsen längs fickans kant.',h(-R/2),-1,{select:{has:'left'},tag:'left-tip'}),
tuck('Stoppa även vänstra spetsen under fickans kant.',{has:'pocket-cap'},h(-R/2),{has:'left-tip'},h(-R/2)),
end('Skjut bokmärket över hörnet på en boksida. Fickan håller det på plats.')
]));
models.push(base('klisterkuvert','Vikt kuvert med klistermärke','#c29acb',D,'En kvadrat, en liten lapp och ett klistermärke eller en bit tejp. Klistermärket behövs för att hålla de fyra flikarna stängda.','https://www.ourupcycledlife.com/diy-tutorials/diy-envelopes','Our Upcycled Life – DIY Envelopes, enkel fyrhörnsvariant',[
f('Vik på mitten och öppna för att hitta mitten.',v(0),1),u,f('Vik åt andra hållet.',h(0),1),u,
info('Lägg en liten hälsning mitt på papperet. Lappen måste få plats innanför viklinjerna.'),
f('Vik vänstra hörnet till mitten.',v(-R/2),1),f('Vik högra hörnet till mitten.',v(R/2),-1),
f('Vik nedersta hörnet till mitten.',h(R/2),1),f('Vik översta hörnet till mitten.',h(-R/2),-1),
end('Sätt ett klistermärke över mitten så att alla fyra flikarna hålls ihop. Ditt lilla kuvert är färdigt!')
]));
// Equal-width accordion: tags form a nested hinge chain. Opening from the
// newest crease to the oldest makes each subsequent axis remain in its flat
// location while already opened downstream panels move as one rigid group.
const accordionSteps=[];
for(let i=1;i<=7;i++){
 const x=i%2?-56.25:-75,side=i%2?-1:1;
 accordionSteps.push(f(i===1?'Vik in 18,75 mm från vänster kant. Resten av papperet följer med.':`Vik tillbaka den långa delen åt andra hållet, lika brett. Veck ${i} av 7.`,v(x),side,{...(i>1?{select:{has:`pleat-${i-1}`}}:{}),tag:`pleat-${i}`}));
}
for(let i=7;i>=1;i--){const x=i%2?-56.25:-75,side=i%2?-1:1;accordionSteps.push({kind:'open',text:i===7?'Dra försiktigt isär det yttersta vecket.':'Öppna nästa veck lite. Behåll zigzagformen.',motions:[{select:{has:`pleat-${i}`},axis:v(x),angle:-side*150}]});}
accordionSteps.push(end('Ditt pappersdragspel är klart. Tryck ihop och dra isär det längs de sju vecken.'));
models.push(base('pappersdragspel','Pappersdragspel','#e7a575',S,'En kvadrat och gärna en linjal. Åtta lika breda remsor skapar sju växelvisa veck.','https://www.origami-instructions.com/origami-fan.html','Origami Instructions – Fan, dragspelsvikningen',accordionSteps));
models.push(base('pennfodral','Vikt pennfodral','#8bb0ce',S,'En kvadrat och lite lim eller dubbelhäftande tejp till botten. En större kvadrat passar längre pennor eller ätpinnar.','https://www.origami-instructions.com/origami-chopstick-wrapper.html','Origami Instructions – Chopstick Wrapper',[
f('Vik överkanten till nederkanten.',h(0),-1),u,
f('Vik överkanten till mitten.',h(-37.5),-1),u,
f('Vik nederkanten till mitten.',h(37.5),1),u,
f('Vik nedre högra hörnet till mittenlinjen.',[[0,75],[75,0]],1),
f('Vik övre högra hörnet till det närmaste vecket.',[[37.5,-75],[75,-37.5]],-1),
f('Vik ned den översta fjärdedelen.',h(-37.5),-1),
f('Vik ned samma del en gång till.',h(0),-1),
f('Vik nederkanten upp till överkanten på remsan.',h(37.5),1),
info('Sätt lite lim eller dubbelhäftande tejp på de vänstra 12 mm av remsan.'),
f('Vik in vänsteränden cirka 12 mm för att stänga botten.',v(-63),1),turn,
end('Låt limmet torka. Stoppa in en penna eller ätpinnar genom den sneda öppningen.')
]));
models.push(base('namnskylt','Stående namnskylt','#c5c88e',{width:210,height:148,front:false,label:'A5 liggande · 21 × 14,8 cm'},'Ett A5-papper, en penna, linjal och en liten tejpbit. Använd gärna något kraftigare papper.','https://www.physport.org/recommendations/files/Table%20Tents.pdf','PhysPort – Table Name Tents',[
info('Lägg papperet med långsidorna upptill och nedtill. Markera tre lika breda band, ungefär 49 mm vardera.'),
f('Vik överkanten vid den första tredjedelen och öppna.',h(-74/3),-1),u,
f('Vik nederkanten vid den andra tredjedelen och öppna.',h(74/3),1),u,
info('Skriv ditt namn på det översta och nedersta bandet. Vänd texten så att den blir rätt när skylten står.'),
f('Res den översta sidan tills kanten når ovanför mitten.',h(-74/3),-1,{angle:120,tag:'top-wall'}),
f('Res den nedersta sidan så att de två långa kanterna möts.',h(74/3),1,{angle:120,select:{not:'top-wall'},tag:'bottom-wall'}),
end('Tejpa ihop de två kanterna som möts överst. Den mittersta delen är botten. Ställ skylten på bordet!')
]));
models.push(base('planbok','Plånbok med tejp','#cc929d',S,'En kvadrat och två små bitar dubbelhäftande tejp. En 15 cm kvadrat ger en liten plånbok för lappar. Detta är en förenklad variant med tejpad skarv.','https://origami.me/wallet/','Origami.me – Traditional Wallet; egen förenkling med tejp',[
f('Vik på mitten från vänster till höger.',v(0),1),u,
f('Vik på mitten nerifrån och upp.',h(0),1),u,
info('Markera ett veck 25 mm från överkanten och ett 25 mm från nederkanten. På större papper är avståndet en sjättedel av sidan.'),
f('Vik längs det övre märket.',h(-50),-1),u,f('Vik längs det nedre märket.',h(50),1),u,
f('Vik övre vänstra hörnet in till det närmaste vågräta vecket.',[[-75,-50],[-50,-75]],-1),
f('Vik övre högra hörnet in på samma sätt.',[[50,-75],[75,-50]],-1),
f('Vik nedre vänstra hörnet in till det närmaste vecket.',[[-75,50],[-50,75]],1),
f('Vik nedre högra hörnet in på samma sätt.',[[50,75],[75,50]],1),
f('Vik överkanten in längs vecket.',h(-50),-1,{tag:'upper-band'}),
f('Vik nederkanten in längs vecket.',h(50),1,{tag:'lower-band'}),turn,
f('Vik vänster kortsida lite förbi mittenlinjen.',v(-36),1,{tag:'left-end'}),
info('Sätt två små bitar dubbelhäftande tejp på den vikta vänsterändens övre och nedre hörn, precis där nästa ände ska överlappa.'),
f('Vik höger kortsida in så att den överlappar den första lite. Tryck fast mot tejpen.',v(36),-1,{tag:'right-end'}),
f('Vik ihop plånboken på mitten, som en liten bok.',h(0),1),
end('Plånboken är klar. Öppna mittvecket när du vill lägga små lappar i fickorna.')
]));
// Distinguish authored practical adaptations from source model attribution.
for (const m of models) if (['klisterkuvert','pappersdragspel','namnskylt','planbok'].includes(m.id)) m.source.designer='Egen praktisk variant av grundläggande pappersvikning; konstruktionskälla länkad';

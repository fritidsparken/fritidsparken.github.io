// Independently authored metric crease geometry; sources describe the selected methods.
// Recovered final module. Exact bisectors retain root's precision corrections.
const R=150/Math.sqrt(2),S={width:150,height:150,front:false,label:'Kvadrat · 15 × 15 cm'},D={...S,outline:[[0,-R],[R,0],[0,R],[-R,0]]};
const f=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra}),u={kind:'unfold',text:'Öppna vikningen igen.'},t={kind:'turn',text:'Vänd på papperet.'},end=text=>({kind:'finish',text});
const V=[[0,-R],[0,R]],H=[[-R,0],[R,0]],mid=[f('Vik hörn mot hörn längs mittlinjen.',V,1),u];
const src=(label,url,designer='Formgivare inte angiven i källan')=>({label,url,designer});
const base=(id,name,category,color,paper,source,steps,materials='Ett kvadratiskt papper, gärna med olika färg på sidorna.')=>({id,name,category,color,paper,source,steps,materials,level:'Lätt',minutes:'5–10 min'});
// Three successive blintzes, followed by the actual nested paper tips.
const roseSteps=[f('Vik papperet på mitten.',[[0,-75],[0,75]],1),u,f('Vik på mitten åt andra hållet.',[[-75,0],[75,0]],1),u];
const rings=[
 [[[-75,0],[0,-75],[-75,-75]],[[0,-75],[75,0],[75,-75]],[[75,0],[0,75],[75,75]],[[0,75],[-75,0],[-75,75]]],
 [[[-37.5,-37.5],[37.5,-37.5],[0,-75]],[[37.5,-37.5],[37.5,37.5],[75,0]],[[37.5,37.5],[-37.5,37.5],[0,75]],[[-37.5,37.5],[-37.5,-37.5],[-75,0]]],
 [[[-37.5,0],[0,-37.5],[-37.5,-37.5]],[[0,-37.5],[37.5,0],[37.5,-37.5]],[[37.5,0],[0,37.5],[37.5,37.5]],[[0,37.5],[-37.5,0],[-37.5,37.5]]]
];
const sign=(p,l)=>Math.sign((l[1][0]-l[0][0])*(p[1]-l[0][1])-(l[1][1]-l[0][1])*(p[0]-l[0][0]));
for(let r=0;r<3;r++)for(let i=0;i<4;i++){const [a,b,p]=rings[r][i];roseSteps.push(f(`Vik hörn ${i+1} till mitten${r?' en gång till':''}.`,[a,b],sign(p,[a,b]),{tag:`rose-${r}-${i}`}));}
for(let r=2;r>=0;r--)for(let i=0;i<4;i++){
 const [a,b]=rings[r][i],line=[a.map(x=>x*.60),b.map(x=>x*.60)];
 const none=[];for(let j=r+1;j<3;j++)for(let k=0;k<4;k++)none.push(`rose-${j}-${k}`);
 roseSteps.push(f(`Vik ut spets ${i+1} i ${r===2?'innersta':r===1?'mellersta':'yttersta'} lagret. Håll de andra lagren på plats.`,line,sign([0,0],line),{select:{has:`rose-${r}-${i}`,none}}));
}
roseSteps.push(end('Din platta ros är klar. Den behåller tydliga, vikta kronblad.'));
const rose=base('platt-ros','Platt ros','Blommor','#e68da3',S,src('Origami.me – Traditional Fractal Rose; platt variant','https://origami.me/rose/','Traditionell modell; platt geometrisk bearbetning'),roseSteps);rose.level='Medel';rose.minutes='12–18 min';
const egg=base('paskagg','Påskägg','Högtider','#d9ba75',D,src('Origami.me – Easter Egg','https://origami.me/easter-egg/'),[...mid,
 f('Vik den vänstra överkanten till mittlinjen.',[[0,-R],[-R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],1),f('Vik den högra överkanten till mittlinjen.',[[0,-R],[R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],-1),
 f('Vik nedersta spetsen uppåt, strax ovanför flikarnas möte.',[[-R,R*.65],[R,R*.65]],1),
 f('Vik översta spetsen ned till den uppvikta spetsen.',[[-R,-R*.35],[R,-R*.35]],-1),
 f('Vik in vänstra sidospetsen en liten bit.',[[-R*.40,-R],[-R*.40,R]],1),f('Vik in högra sidospetsen lika mycket.',[[R*.40,-R],[R*.40,R]],-1),
 f('Runda den övre vänstra axeln med ett litet vik.',[[-R*.40,-R*.05],[-R*.18,-R*.35]],-1),f('Runda den övre högra axeln likadant.',[[R*.40,-R*.05],[R*.18,-R*.35]],1),
 f('Runda nedre vänstra hörnet med ett litet bakre vik.',[[-R*.35,R*.52],[-R*.22,R*.65]],1),f('Runda nedre högra hörnet lika mycket.',[[R*.35,R*.52],[R*.22,R*.65]],-1),t,end('Ditt platta påskägg är klart. Rita gärna ett mönster.')]);
// Simple rectangular-paper ice cream, complete cone and scoop, no added paper.
const ice=base('glass','Glasstrut','Dekorationer','#d3a66d',{width:75,height:150,front:true,label:'Rektangel · 7,5 × 15 cm'},src('Pink Stripey Socks – Origami Ice Cream Cones','https://www.pinkstripeysocks.com/2016/03/how-to-fold-origami-ice-cream-cones.html'),[
 f('Vik den långa rektangeln på längden.',[[0,-75],[0,75]],1),u,f('Vik på mitten tvärs över.',[[-37.5,0],[37.5,0]],1),u,
 f('Vik överkanten ned till mittvecket.',[[-37.5,-37.5],[37.5,-37.5]],-1),t,
 f('Vik nedersta vänstra hörnet in till mitten.',[[0,75],[-37.5,37.5]],-1),f('Vik nedersta högra hörnet in till mitten.',[[0,75],[37.5,37.5]],1),
 f('Vik vänstra snedkanten till mitten en gång till.',[[0,75],[-37.5,-15.53300859]],-1),f('Vik högra snedkanten till mitten en gång till.',[[0,75],[37.5,-15.53300859]],1),
 f('Vik in det övre vänstra hörnet lite.',[[-37.5,-22.5],[-22.5,-37.5]],-1),f('Vik in det övre högra hörnet lite.',[[37.5,-22.5],[22.5,-37.5]],1),t,end('Din glasstrut är klar. Rita strössel på den ljusa glassen.')],'Ett papper 7,5 × 15 cm. Penna till valfritt strössel.');
const stem=base('blomstjalk','Platt blomstjälk','Blommor','#7ba474',D,src('Origami-Fun – Flower Stem; platt variant','https://www.origami-fun.com/origami-flower-stem.html','Traditionell modell; platt bladvikning'),[...mid,
 f('Vik vänstra överkanten till mitten.',[[0,-R],[-R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],1),f('Vik högra överkanten till mitten.',[[0,-R],[R*(2-Math.SQRT2),R*(Math.SQRT2-1)]],-1),
 f('Vik vänstra nederkanten till mitten.',[[0,R],[-R*(Math.SQRT2-1),0]],-1),f('Vik högra nederkanten till mitten.',[[0,R],[R*(Math.SQRT2-1),0]],1),
 f('Vik vänstra nedersidan till mitten igen.',[[0,R],[-R*Math.tan(Math.PI/16),0]],-1),f('Vik högra nedersidan till mitten igen.',[[0,R],[R*Math.tan(Math.PI/16),0]],1),t,
 f('Vik den smala nedersta spetsen upp till den översta.',H,1,{tag:'stalk'}),
 f('Vik ihop på längden.',V,-1),
 f('Vik bara det breda bladet åt vänster. Låt den smala stjälken vara kvar.',[[-30,-29],[0,-13]],-1,{select:{not:'stalk'}}),
 end('Din platta stjälk med blad är klar att använda på ett kort.')]);
export const models=[rose,egg,ice,stem];
// Leaf: a narrow stem hem, reversible accordion creases, independent corner folds.
const LD={...S,front:true};
const leafSteps=[f('Vik övre vänstra hörnet till det nedre högra.',[[-75,75],[75,-75]],-1,{tag:'leaf-front'}),
 f('Vik en smal kant längs den långa snedkanten.',[[-57,75],[75,-57]],-1)];
// Accordion crease axes follow the currently folded tip; return folds retain divisions.
for(let i=0;i<10;i++){const y=55+(i%2)*12,side=i%2===0?-1:1;leafSteps.push(f(i%2?'Vik spetsen tillbaka uppåt, med 12 mm mellan vecken.':'Vik spetsen nedåt och gör ett nytt dragspelsveck.',[[-100,y],[100,y]],side,{tag:`leaf-pleat-${i}`}));}
for(let i=9;i>=0;i--){const y=55+(i%2)*12,side=i%2===0?1:-1;leafSteps.push(f('Öppna försiktigt det senaste dragspelsvecket.',[[-100,y],[100,y]],side,{select:{has:`leaf-pleat-${i}`},direction:-1}));}
leafSteps.push(f('Vik in det nedre högra hörnet på det översta lagret.',[[45,75],[75,45]],1,{select:{has:'leaf-front'}}),
 f('Vik in samma hörn på det undre lagret.',[[45,75],[75,45]],1,{select:{not:'leaf-front'},direction:-1}),
 {kind:'open',text:'Öppna bladets översta halva längs mittnerven.',motions:[{select:{has:'leaf-front'},axis:[[-39,75],[75,-39]],angle:180}]},end('Ditt blad är klart. Dragspelsvecken bildar bladnerver.'));
const leaf=base('blad','Blad','Blommor','#9eb76b',LD,src('Origami.me – Traditional Leaf','https://origami.me/leaf/','Traditionell modell; platt öppning'),leafSteps);models.push(leaf);
const candle=base('ljus','Pappersljus','Högtider','#edbd64',{...D,front:true},src('Origami Club – Candle 2','https://en.origami-club.com/xmas/candle2/zu.html','Fumiaki Shingu'),[...mid,f('Markera den vågräta diagonalen.',H,1),u,
 f('Vik vänstra hörnet till mitten.',[[-R/2,-R],[-R/2,R]],1),f('Vik högra hörnet till mitten.',[[R/2,-R],[R/2,R]],-1),
 f('Vik nedersta hörnet till mitten.',[[-R,R/2],[R,R/2]],1),
 f('Vik nederkanten uppåt. Lämna en liten färgad låga ovanför kanten.',[[-R,-R*.18],[R,-R*.18]],1),
 f('Vik vänstra långsidan bakåt så att ljuset blir smalare.',[[-R*.25,-R],[-R*.25,R]],1,{direction:-1}),
 f('Vik högra långsidan bakåt lika mycket.',[[R*.25,-R],[R*.25,R]],-1,{direction:-1}),end('Ditt pappersljus är klart! Lågan består också av vikt papper.')]);models.push(candle);
// Carrot: double kite, back-folded top and short pleated stalk.
const carrot=base('morot','Morot','Dekorationer','#e9a05c',D,src('Origami Club – Carrot','https://en.origami-club.com/fruit/carrot/zu.html','Fumiaki Shingu; egen proportionering av stjälken'),[...mid,
 f('Vik vänstra nederkanten in till mitten.',[[0,R],[-R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],-1),f('Vik högra nederkanten in till mitten.',[[0,R],[R*(2-Math.SQRT2),-R*(Math.SQRT2-1)]],1),
 f('Vik vänstra snedkanten till mitten igen.',[[0,R],[-R*Math.SQRT2*Math.tan(Math.PI/16),-R*(Math.SQRT2-1)]],-1),f('Vik högra snedkanten till mitten igen.',[[0,R],[R*Math.SQRT2*Math.tan(Math.PI/16),-R*(Math.SQRT2-1)]],1),
 f('Vik den ljusa översta spetsen bakåt.',[[-R,-R*.49],[R,-R*.49]],-1,{direction:-1}),
 f('Vik morotens överdel nedåt.',[[-R,-R*.05],[R,-R*.05]],-1,{tag:'carrot-top'}),
 f('Vik samma flik tillbaka upp, med ett litet veck kvar.',[[-R,R*.08],[R,R*.08]],1,{select:{has:'carrot-top'}}),
 f('Vik in vänstra kanten på den uppvikta fliken så att en smal stjälk bildas.',[[-R*.10,-R],[-R*.10,R]],1,{select:{has:'carrot-top'}}),
 f('Vik in den högra kanten på samma flik.',[[R*.10,-R],[R*.10,R]],-1,{select:{has:'carrot-top'}}),
 f('Vik in vänstra axelns lilla spets.',[[-R*.22,R*.02],[-R*.15,-R*.05]],-1),f('Vik in högra axelns lilla spets.',[[R*.22,R*.02],[R*.15,-R*.05]],1),t,end('Moroten är klar. Färglägg gärna den ljusa stjälken grön.')]);models.push(carrot);
const mountain=base('snoberg','Snöberg','Dekorationer','#a2b7c8',D,src('Origami Club – Fuji Mountain','https://en.origami-club.com/easy/other/fuji/zu.html','Fumiaki Shingu'),[...mid,
 f('Vik nedersta hörnet till det översta.',H,1,{tag:'snow-front'}),
 f('Vik ned spetsen på enbart det översta lagret.',[[-R,-R*.75],[R,-R*.75]],-1,{select:{has:'snow-front'},tag:'snow-cap'}),
 f('Vik den lilla nedvända spetsen tillbaka upp till snökantens mitt.',[[-R,-R*.625],[R,-R*.625]],1,{select:{has:'snow-cap'}}),
 f('Vik den översta spetsen på baksidan bakåt.',[[-R,-R*.75],[R,-R*.75]],-1,{select:{not:'snow-front'},direction:-1}),
 end('Ditt platta snötäckta berg är klart.')]);models.push(mountain);

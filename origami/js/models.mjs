import {foldableModels} from './foldable-models.mjs?v=1';
// Authored millimetre geometry. Sources document the folding method, not artwork.
const R=150/Math.sqrt(2);
const square={width:150,height:150,front:false,outline:[[0,-R],[R,0],[0,R],[-R,0]],label:'Kvadrat · 15 × 15 cm'};
const fold=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra});
const unfold={kind:'unfold',text:'Öppna papperet igen.'};
const turn={kind:'turn',text:'Vänd på papperet.'};
const vertical=[ [0,-R],[0,R] ];
const horizontal=[[-R,0],[R,0]];
const center=[fold('Vik på mitten.',vertical,1),unfold];
const triangleUp=fold('Vik nedersta hörnet till det översta.',horizontal,1);
const finish=text=>({kind:'finish',text});
const source=(label,url,designer='Formgivare inte angiven i källan')=>({label,url,designer});
export const models=[
  {id:'katt',name:'Kattansikte',category:'Djur',level:'Lätt',minutes:'5–8 min',color:'#edb852',paper:square,face:{eyes:22,y:-28},materials:'Ett kvadratiskt papper. Penna till ansiktet.',
    source:source('Origami Instructions – Cat Face','https://www.origami-instructions.com/origami-cat-face.html'),
    steps:[triangleUp,...center,fold('Vik upp vänster öra.',[[0,0],[-69,-37]],-1,{tag:'ear'}),fold('Vik upp höger öra.',[[0,0],[69,-37]],1,{tag:'ear'}),fold('Vik ned den översta spetsen.',[[-70,-58],[70,-58]],-1,{select:{not:'ear'}}),turn,finish('Rita ögon och nos. Din katt är klar!')]},
  {id:'hund',name:'Hundansikte',category:'Djur',level:'Lätt',minutes:'5–8 min',color:'#ca9477',paper:square,face:{eyes:20,y:35},materials:'Ett kvadratiskt papper. Penna till ansiktet.',
    source:source('Origami Instructions – Dog Face','https://www.origami-instructions.com/origami-dog-face.html'),
    steps:[fold('Vik översta hörnet till det nedersta.',horizontal,-1),...center,fold('Vik ned vänster öra.',[[-35,0],[-95,31]],1),fold('Vik ned höger öra.',[[35,0],[95,31]],-1),fold('Vik en liten kant bakåt överst.',[[-55,6],[55,6]],-1,{direction:-1}),fold('Vik den nedersta spetsen bakåt.',[[-40,70],[40,70]],1,{direction:-1}),finish('Rita ögon och nos. Din hund är klar!')]},
  {id:'tulpan',name:'Tulpanblomma',category:'Blommor',level:'Lätt',minutes:'5–8 min',color:'#e58f9f',paper:square,materials:'Ett kvadratiskt papper. Denna guide visar den platta blomman utan stjälk.',
    source:source('OrigamiOK – Flat Tulip, blomdelen steg 1–7','https://origamiok.com/how-to-make-origami-flat-flower/','Guide av Bella, OrigamiOK; formgivare inte angiven'),
    steps:[triangleUp,...center,fold('Vik höger spets uppåt, lite utåt.',[[0,0],[72,-46]],1),fold('Vik vänster spets uppåt, lite utåt.',[[0,0],[-72,-46]],-1),turn,fold('Vik in den lilla högra kanten.',[[60,-85],[60,5]],-1),fold('Vik in den lilla vänstra kanten.',[[-60,-85],[-60,5]],1),turn,finish('Din tulpanblomma är klar!')]},
  {id:'hjarta',name:'Hjärta',category:'Dekorationer',level:'Lätt',minutes:'6–10 min',color:'#df7f93',paper:square,materials:'Ett kvadratiskt papper.',
    source:source('Origami Instructions – Easy Heart','https://www.origami-instructions.com/easy-origami-heart.html','Formgivare inte angiven i källan'),
    steps:[...center,fold('Vik nedersta hörnet uppåt.',horizontal,1),unfold,fold('Vik översta hörnet till mitten.',[[-R/2,-R/2],[R/2,-R/2]],-1),fold('Vik nedersta hörnet till överkanten.',[[-R,R/4],[R,R/4]],1),fold('Vik högra halvan upp till mittlinjen.',[[0,R/4],[R/2,-R/4]],1),fold('Vik vänstra halvan upp till mittlinjen.',[[0,R/4],[-R/2,-R/4]],-1),turn,fold('Vik in den högra lilla spetsen.',[[R*.43,-R],[R*.43,R]],-1),fold('Vik in den vänstra lilla spetsen.',[[-R*.43,-R],[-R*.43,R]],1),fold('Vik ned de två översta spetsarna.',[[-R,-R*.64],[R,-R*.64]],-1),turn,finish('Ditt hjärta är klart!')]},
  {id:'julgran',name:'Julgran',category:'Högtider',level:'Medel',minutes:'8–12 min',color:'#83b28b',paper:square,materials:'Ett kvadratiskt papper med färg på ena sidan.',
    source:source('Origami.me – Christmas Tree','https://origami.me/christmas-tree/','Traditionell modell'),
    steps:[...center,fold('Vik vänstra överkanten till mitten.',[[0,-R],[-R*.585786,R*.414214]],1),fold('Vik högra överkanten till mitten.',[[0,-R],[R*.585786,R*.414214]],-1),fold('Vik nedersta spetsen till den översta.',horizontal,1,{tag:'lower'}),fold('Vik vänstra överkanten till mitten igen.',[[0,-R],[-R*.414214,0]],1),fold('Vik högra överkanten till mitten igen.',[[0,-R],[R*.414214,0]],-1),fold('Vik ned den översta fliken.',[[-R*.4,-R*.24],[R*.4,-R*.24]],-1,{select:{has:'lower'}}),fold('Vik den vita spetsen upp till granens nederkant.',[[-R*.4,R*.26],[R*.4,R*.26]],1),turn,finish('Din julgran är klar!')]},
];

// Airplanes retain every folded panel. Each wing is selected by its paper lineage.
function plane(narrow) {
  const H=148.5,W=105;
  const steps=[fold('Vik på längden.',[[0,-H],[0,H]],-1),unfold,
    fold('Vik vänstra övre hörnet till mitten.',[[0,-H],[-W,-H+W]],1),
    fold('Vik högra övre hörnet till mitten.',[[0,-H],[W,-H+W]],-1)];
  if(narrow)steps.push(fold('Vik vänstra sneda kanten till mitten.',[[0,-H],[-W,-H+W*(1+Math.SQRT2)]],1),fold('Vik högra sneda kanten till mitten.',[[0,-H],[W,-H+W*(1+Math.SQRT2)]],-1));
  steps.push(fold('Vik ihop planet längs mitten.',[[0,-H],[0,H]],-1,{tag:'right'}));
  // Half-angle crease brings each wing's outer edge to the lower body edge.
  const slope=narrow?Math.tan(Math.PI/16):Math.tan(Math.PI/8),tail=-2*H*slope;
  const axis=narrow?[[0,-H],[tail,H]]:[[-W/2,-H],[-W/2,H]];
  steps.push(fold('Vik ned den översta vingen.',axis,1,{select:{has:'right'},tag:'wing-right'}),turn);
  const mirrored=axis.map(([x,y])=>[-x,y]);
  steps.push(fold('Vik ned den andra vingen likadant.',mirrored,-1,{select:{not:'right'},tag:'wing-left'}));
  steps.push({kind:'open',text:'Lyft vingarna halvvägs så att planet kan glida.',motions:[{select:{has:'wing-right'},axis:mirrored,angle:90},{select:{has:'wing-left'},axis:mirrored,angle:-90}]});
  steps.push({kind:'turn',text:'Vrid planet så att vingarna ligger vågrätt.',axis:mirrored,angle:90});
  steps.push(finish('Ditt plan är klart! Prova ett mjukt kast.'));
  return {id:narrow?'klassisk-pil':'breda-vingar',name:narrow?'Klassisk pil':'Breda vingar',category:'Pappersflygplan',level:'Lätt',minutes:'6–10 min',color:narrow?'#78b5d3':'#a7a1d4',paper:{width:210,height:297,front:false,label:'A4 · 21 × 29,7 cm'},materials:'Ett A4-papper. Inget lim och ingen sax.',source:source(narrow?"Fold’N Fly – Basic Dart":"Fold’N Fly – The Basic",`https://www.foldnfly.com/${narrow?1:0}.html`,'Klassisk pappersflygplansmodell'),steps};
}
// Corner folds use the perpendicular bisector of the corner and its target.
// This keeps the actual A4 sheet intact, including the small locking flap.
const A4={width:210,height:297,front:false,label:'A4 · 21 × 29,7 cm'};
const H=148.5,W=105;
function toPoint(a,b){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[0]-a[0],dy=b[1]-a[1];return [[m[0]+dy,m[1]-dx],[m[0]-dy,m[1]+dx]];}
function starter(w=W,h=H){return [fold('Vik papperet på mitten längs mittlinjen.',[[0,-h],[0,h]],-1),unfold,fold('Vik vänstra övre hörnet till mittlinjen.',[[0,-h],[-w,-h+w]],1),fold('Vik högra övre hörnet till mittlinjen.',[[0,-h],[w,-h+w]],-1)];}
function wings(body=13,away=false){
  const axis=[[-body,-H],[-body,H]],mirror=axis.map(([x,y])=>[-x,y]);
  return [fold(away?'Vik ihop planet bakåt längs mittlinjen.':'Vik ihop planet längs mittlinjen.',[[0,-H],[0,H]],-1,{tag:'right',direction:away?-1:1}),
    fold(`Vik ned första vingen. Lämna en ${body} mm hög kropp.`,axis,1,{select:{has:'right'},tag:'wing-right'}),turn,
    fold('Vik andra vingen lika stor som den första.',mirror,-1,{select:{not:'right'},tag:'wing-left'}),
    {kind:'open',text:'Öppna vingarna halvvägs, lika mycket på båda sidor.',motions:[{select:{has:'wing-right'},axis:mirror,angle:90},{select:{has:'wing-left'},axis:mirror,angle:-90}]},
    {kind:'turn',text:'Vrid planet så att vingarna ligger vågrätt.',axis:mirror,angle:90}];
}
const glider={id:'glidaren',name:'Glidaren',category:'Pappersflygplan',level:'Lätt',minutes:'8–12 min',color:'#70b6c5',paper:A4,materials:'Ett A4-papper. Den lilla fliken låser nosen. Inget lim eller sax.',
  source:source("Fold’N Fly – The Stable",'https://www.foldnfly.com/2.html','Klassisk modell med låsflik'),
  steps:[...starter(),fold('Vik nosen nedåt vid hörnvikningarnas nederkant.',[[-W,-43.5],[W,-43.5]],-1,{tag:'nose'}),
    fold('Vik vänstra hörnet till mittlinjen, 25 mm ovanför spetsen.',toPoint([-W,-43.5],[0,36.5]),1,{tag:'lock-shoulder'}),
    fold('Vik högra hörnet till samma punkt.',toPoint([W,-43.5],[0,36.5]),1,{tag:'lock-shoulder'}),
    fold('Vik den lilla spetsen uppåt över flikarna för att låsa dem.',[[-W,41.8967328],[W,41.8967328]],1,{select:{has:'nose',not:'lock-shoulder'}}),
    ...wings(13,true),finish('Glidaren är klar! Håll under nosen och kasta mjukt.')]
};
const buzz={id:'humlan',name:'Humlan',category:'Pappersflygplan',level:'Medel',minutes:'8–12 min',color:'#e9b34e',paper:{width:297,height:210,front:false,label:'A4 liggande · 29,7 × 21 cm'},materials:'Ett A4-papper, liggande. Vik den korta noskanten bakåt. Inget lim eller sax.',
  source:source("Fold’N Fly – The Buzz",'https://www.foldnfly.com/3.html'),
  steps:[...starter(148.5,105),fold('Vik nosspetsen till hörnvikningarnas nederkant.',[[-148.5,-30.75],[148.5,-30.75]],-1),
    fold('Vik vänstra sneda kanten in till mittlinjen.',[[0,-105],[-148.5,-105+148.5*(1+Math.SQRT2)]],1),
    fold('Vik högra sneda kanten in till mittlinjen.',[[0,-105],[148.5,-105+148.5*(1+Math.SQRT2)]],-1),
    fold('Vik nosens översta 13 mm bakåt.',[[-148.5,-17.75],[148.5,-17.75]],-1,{direction:-1}),
    ...wings(13),finish('Humlan är klar! Prova ett lugnt kast och se hur den glider.')]
};
const raven={id:'korpen',name:'Korpen',category:'Pappersflygplan',level:'Medel',minutes:'10–15 min',color:'#a2a5d3',paper:A4,materials:'Ett A4-papper. Pressa de tjocka nosvecken noggrant. Inget lim eller sax.',
  source:source("Fold’N Fly – Raven",'https://www.foldnfly.com/50.html'),
  steps:[...starter(),fold('Vik vänstra sneda kanten till mitten en gång till.',[[0,-H],[-W,-H+W*(1+Math.SQRT2)]],1),
    fold('Vik högra sneda kanten till mitten en gång till.',[[0,-H],[W,-H+W*(1+Math.SQRT2)]],-1),
    fold('Vik nosen nedåt, nästan till nederkanten.',[[-W,-10],[W,-10]],-1,{tag:'nose'}),
    fold('Vik det nya vänstra hörnet till mitten.',[[0,-10],[-W,95]],1),
    fold('Vik det nya högra hörnet till mitten.',[[0,-10],[W,95]],-1),
    fold('Vik den centrala spetsen upp till planets framkant.',[[-W,59.25],[W,59.25]],1,{select:{has:'nose'}}),
    ...wings(13),finish('Korpen är klar! Sikta rakt fram och kasta lugnt.')]
};
models.unshift(...foldableModels,glider,buzz,raven,plane(true),plane(false));
// Both renderers share these models and their complete step sequences.
for(const model of models)model.blender={base:`./assets/${model.id}/`,frames:48,fps:24};
for(const model of models)if(['glidaren','vapor','arrowhead'].includes(model.id))model.flight={video:`./assets/${model.id}/flight.mp4?v=2`,poster:`./assets/${model.id}/flight.webp?v=2`,duration:12};
export const categories=['Alla','Pappersflygplan','Djur','Blommor','Dekorationer','Högtider'];

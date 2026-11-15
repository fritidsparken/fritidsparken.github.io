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
models.unshift(plane(true),plane(false));
export const categories=['Alla','Pappersflygplan','Djur','Blommor','Dekorationer','Högtider'];

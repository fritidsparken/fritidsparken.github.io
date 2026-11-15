// Our own millimetre geometry and Swedish explanations of credited folding methods.
// Source freehand placements are standardized for A4; see docs/origami-flight-sources.md.
const W=105,H=148.5;
const A4={width:210,height:297,front:false,label:'A4 · 21 × 29,7 cm'};
const fold=(text,line,side,extra={})=>({kind:'fold',text,line,side,...extra});
const unfold={kind:'unfold',text:'Öppna vikningen igen.'};
const turn={kind:'turn',text:'Vänd på planet.'};
const finish=text=>({kind:'finish',text});
const starter=[fold('Vik papperet på längden.',[[0,-H],[0,H]],-1),unfold,
 fold('Vik vänstra övre hörnet till mittlinjen.',[[0,-H],[-W,-H+W]],1),
 fold('Vik högra övre hörnet till mittlinjen.',[[0,-H],[W,-H+W]],-1)];
function flightWings(axis,away=true,wingText='Vik ned första vingen. Lämna 4 mm vid nosen och 51 mm vid bakänden.') {
 const mirror=axis.map(([x,y])=>[-x,y]);
 return [fold(away?'Vik ihop planet bakåt längs mittlinjen.':'Vik ihop planet längs mittlinjen.',[[0,-H],[0,H]],-1,{tag:'right',direction:away?-1:1}),
  fold(wingText,axis,1,{select:{has:'right'},tag:'wing-right'}),turn,
  fold('Vik den andra vingen till samma kant.',mirror,-1,{select:{not:'right'},tag:'wing-left'}),
  {kind:'open',text:'Öppna vingarna lika mycket på båda sidor.',motions:[{select:{has:'wing-right'},axis:mirror,angle:90},{select:{has:'wing-left'},axis:mirror,angle:-90}]},
  {kind:'turn',text:'Håll planet med vingarna vågrätt.',axis:mirror,angle:90}];
}
const N=-68.9,lockY=N+79.6/Math.sqrt(2);
const left=[[0,N],[-W,N+W]],right=[[0,N],[W,N+W]];
const halfLeft=[[0,N],[-W,N+W*Math.tan(Math.PI/8)]],halfRight=[[0,N],[W,N+W*Math.tan(Math.PI/8)]];
const C=-18.1,bandY=-123.1,tipY=34.4,smallX=W-W*Math.tan(Math.PI/8);
const arrowLeft=[[0,C],[-W,C+W]],arrowRight=[[0,C],[W,C+W]];
export const foldableModels=[{
 id:'arrowhead',name:'Arrowhead',category:'Pappersflygplan',level:'Medel',minutes:'12–18 min',color:'#dea65d',paper:A4,
 materials:'Ett A4-papper. Modellen visas med mått anpassade till A4. Nosen låses med en pappersficka.',
 source:{label:'Foldable Flight – Arrowhead',url:'https://www.foldableflight.com/planes/arrowhead',designer:'Kyle Boyer · Foldable Flight'},
 steps:[fold('Vik papperet på längden för att markera mittlinjen.',[[0,-H],[0,H]],-1),unfold,fold('Vik en 25 mm bred remsa bakåt längs överkanten.',[[-W,bandY],[W,bandY]],-1,{tag:'band',direction:-1}),
 fold('Vik vänstra övre hörnet till mittlinjen.',[[0,bandY],[-W,C]],1,{tag:'corner'}),
 fold('Vik högra övre hörnet till mittlinjen.',[[0,bandY],[W,C]],-1,{tag:'corner'}),
 fold('Vik ned nosen längs hörnflikarnas nederkant.',[[-W,C],[W,C]],-1,{tag:'nose'}),
 fold('Vik upp spetsen till överkanten igen.',[[-W,tipY],[W,tipY]],1,{select:{has:'nose'},tag:'back-tip'}),turn,
 fold('Vik högra överkanten till mittlinjen för att markera ett veck.',arrowRight,-1),unfold,
 fold('Vik in högra ytterkanten till det sneda vecket.',[[smallX,C],[W,C+W]],-1,{tag:'small-r'}),
 fold('Vik höger sida längs det första sneda vecket.',arrowRight,-1,{tag:'outer-r'}),
 fold('Markera samma sneda veck på vänster sida.',arrowLeft,1),unfold,
 fold('Vik in vänstra ytterkanten till det sneda vecket.',[[-smallX,C],[-W,C+W]],1,{tag:'small-l'}),
 fold('Vik vänster sida längs det första sneda vecket.',arrowLeft,1,{tag:'outer-l'}),
 {kind:'tuck',text:'Öppna den lilla fickan vid nosen. För in spetsarna och stäng fickan över dem.',
 cap:{select:{all:['band','nose','back-tip'],not:'corner'},axis:[[-W,7.3],[W,7.3]],angle:-75},
 flap:{select:{has:'back-tip'},axis:[[-W,tipY],[W,tipY]],angle:-32}},
 ...flightWings([[0,C],[-(H-C)*Math.tan(Math.PI/8),H]],false,'Vik ned första vingen så att den sneda framkanten möter kroppens underkant.'),
 finish('Arrowhead är klar! Kontrollera att nosens ficka håller ihop flikarna.') ]
},{
 id:'vapor',name:'Vapor',category:'Pappersflygplan',level:'Medel',minutes:'10–15 min',color:'#86bda7',paper:A4,
 materials:'Ett A4-papper. Modellen visas med mått anpassade till A4. Inget lim eller sax.',
 source:{label:'Foldable Flight – Vapor',url:'https://www.foldableflight.com/planes/vapor',designer:'Kyle Boyer · Foldable Flight'},
 steps:[...starter,fold('Vik ned nosen. Lägg vecket 25 mm ovanför hörnflikarnas nederkant.',[[-W,N],[W,N]],-1,{tag:'nose'}),
  fold('Vik vänstra överkanten till mittlinjen för att markera ett veck.',left,1),unfold,
  fold('Vik vänstra överkanten nästan till det nya sneda vecket.',halfLeft,1,{tag:'shoulder'}),
  fold('Vik en gång till längs det första sneda vecket.',left,1,{tag:'shoulder'}),
  fold('Markera samma sneda veck på höger sida.',right,-1),unfold,
  fold('Vik högra överkanten nästan till det sneda vecket.',halfRight,-1,{tag:'shoulder'}),
  fold('Vik höger sida längs det första sneda vecket.',right,-1,{tag:'shoulder'}),
  fold('Vik upp den lilla spetsen över flikarna för att hålla ihop nosen.',[[-W,lockY],[W,lockY]],1,{select:{has:'nose',not:'shoulder'}}),
  ...flightWings([[-4,N],[-50.8,H]]),finish('Vapor är klar! Prova ett mjukt kast och justera vingarna lika.')]
}];

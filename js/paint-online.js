(()=>{"use strict";
const TARGET="Nidoking", IMAGE="./assets/coloring-originals-2026/pokemon-20261021/60-nidoking.jpeg";
const colors=[["Röd","#ef4444"],["Orange","#fb923c"],["Gul","#facc15"],["Ljusgrön","#a3e635"],["Grön","#22c55e"],["Mörkgrön","#15803d"],["Turkos","#2dd4bf"],["Ljusblå","#7dd3fc"],["Blå","#3b82f6"],["Mörkblå","#1e3a8a"],["Lila","#8b5cf6"],["Rosa","#ec4899"],["Ljusrosa","#f9a8d4"],["Brun","#92400e"],["Beige","#e7d3a8"],["Grå","#9ca3af"],["Svart","#171717"],["Vit","#ffffff"],["Mint","#6ee7b7"],["Korall","#fb7185"]];
const pokemonPalettes={"magikarp":["#d65b57","#e3b83e","#e8b5c3","#d889a5"],"lapras":["#79b5d7","#578db7","#eee2c8","#a391b6"],"charizard":["#e48c43","#55aaa6","#eee2c8","#e5c64a"],"venusaur":["#578db7","#579d91","#65945c","#d889a5"],"tentacool":["#578db7","#ce5555","#d3bb94"],"snorlax":["#478d89","#eee2c8","#d3bb94"],"scorbunny":["#f0e8d6","#e48c43","#e3b83e","#85898c"],"rayquaza":["#65945c","#ce5555","#e5c64a","#eee2c8"],"pikachu":["#e5c64a","#94674c","#353638","#ce5555"],"mr. mime":["#e8b5c3","#d889a5","#356b9e","#578db7"],"mimikyu":["#eee2c8","#36383b","#5c6167","#85898c"],"lucario":["#36383b","#5c6167","#85898c","#578db7"],"koffing":["#82659f","#f3f1eb","#eee2c8","#e9dc9e"],"jigglypuff":["#e8b5c3","#d889a5","#578db7","#579d91"],"gyarados":["#4e8fba","#ead58d","#eee2c8","#e5c64a"],"gengar":["#82659f","#d35e69"],"gardevoir":["#65945c","#d889a5","#ce5555","#f3f1eb"],"garchomp":["#578db7","#ce5555","#e5c64a","#f3f1eb"],"flareon":["#e99a58","#e8d49e","#eee2c8","#5c6167"],"eevee":["#94674c","#f0e8d6","#d3bb94"],"dragonite":["#dd963f","#94674c","#55aaa6","#eee2c8"],"bulbasaur":["#55aaa6","#65945c"],"arbok":["#82659f","#4b4d50","#ce5555","#e5c64a"],"charmander":["#e48c43","#eee2c8","#e5c64a","#ce5555"],"spoink":["#d889a5","#85898c","#c9ccce"],"seadra":["#4e8fba","#d8bc82"],"masquerain":["#df8a70","#e48c43","#f3f1eb","#82659f"],"metagross":["#578db7","#c9ccce","#85898c","#ce5555"],"torterra":["#65945c"],"cacturne":["#65954c","#477953","#e3b83e"],"mudkip":["#578db7","#e48c43","#e6eef0"],"pelipper":["#f3f1eb","#79b5d7","#578db7","#ead58d"],"seviper":["#344a68","#578db7","#e3b83e","#82659f"],"loudred":["#82659f","#a47c91","#d889a5","#ead58d"],"spiritomb":["#65945c","#82659f","#94674c"],"snorunt":["#e5c64a","#e48c43","#414348","#85898c"],"ledian":["#ce5555","#85898c","#578db7","#f3f1eb"],"xatu":["#65945c","#e5c64a","#f3f1eb","#85898c"],"wigglytuff":["#d889a5","#f0e8d6","#55aaa6"],"weedle":["#d8bc82","#d57398"],"voltorb":["#d65b57"],"wailord":["#578db7","#f3f1eb"],"venonat":["#a47c91","#d889a5","#d3bb94"],"tyranitar":["#65945c","#578db7","#737d87","#d889a5"],"dugtrio":["#d3bb94","#d889a5","#85898c"],"togepi":["#eee2c8","#f3f1eb","#e48c43","#578db7"],"diglett":["#94674c","#d889a5","#85898c"],"grimer":["#82659f","#5c6167","#85898c","#d889a5"],"poliwrath":["#578db7","#f3f1eb"],"stunfisk":["#94674c","#e5c64a","#f3f1eb"],"staryu":["#94674c","#e3b83e","#d889a5"],"starmie":["#a391b6","#82659f","#e3b83e","#d889a5"],"squirtle":["#578db7","#94674c","#eee2c8"],"drowzee":["#e5c64a","#94674c","#f3f1eb","#d889a5"],"sudowoodo":["#94674c","#65945c","#e5c64a","#d889a5"],"shuckle":["#e5c64a","#ce5555","#eee2c8","#36383b"],"sharpedo":["#4e8fba","#e3b83e","#c4c8c9","#85898c"],"lunatone":["#eee2c8","#e3b83e","#36383b","#5c6167"],"gligar":["#82659f","#578db7","#d889a5"],"scyther":["#609957","#f0e8d6","#ead58d","#e5c64a"],"tangela":["#8fc5df","#578db7","#414348","#85898c"],"sableye":["#82659f","#8fc5df","#578db7","#f0e8d6"],"sandshrew":["#eee2c8","#578db7"],"pidgey":["#eee2c8","#94674c","#4b4d50","#e8d49e"],"rhydon":["#737d87","#eee2c8","#d889a5"],"regirock":["#eee2c8","#e48c43","#94674c","#85898c"],"regice":["#8fc5df","#578db7","#e5c64a","#f0e8d6"],"raticate":["#94674c","#eee2c8","#d889a5","#85898c"],"slowpoke":["#d889a5","#d3bb94","#f3f1eb"],"raichu":["#dd963f","#eee2c8","#e5c64a","#94674c"],"vileplume":["#d35e69","#f0e8d6","#578db7","#775b77"],"geodude":["#85898c"],"porygon2":["#ce5555","#578db7"],"nidoking":["#82659f","#eee2c8","#55aaa6","#d889a5"],"nidorina":["#8fc5df","#578db7","#344a68","#ce5555"],"nidorino":["#82659f","#55aaa6"],"exeggutor":["#609957","#e3b83e","#94674c","#d889a5"],"noctowl":["#94674c","#eee2c8","#4b4d50","#ce5555"],"golbat":["#79b5d7","#578db7","#a47c91","#775b77"],"octillery":["#ce5555","#eee2c8"],"onix":["#85898c"],"marowak":["#f3f1eb","#94674c","#eee2c8"],"seel":["#e6eef0","#eee2c8","#d889a5"],"butterfree":["#82649e","#d65b57","#344a68","#578db7"],"parasect":["#ce5555","#ead58d","#eee2c8","#e5c64a"],"persian":["#eee2c8","#94674c","#f3f1eb","#ce5555"],"phanpy":["#8fc5df","#578db7","#e48c43","#f0e8d6"],"pineco":["#788b70","#578db7","#ce5555"],"pinsir":["#94674c","#c4c8c9","#85898c","#414348"],"plusle":["#ead58d","#eee2c8","#e5c64a","#d65b57"],"seaking":["#df785e","#414348","#85898c","#f0e8d6"]};
const pokemonGuides={"magikarp":"coral red, golden yellow, pale pink, peach","lapras":"sky blue, cream, lavender grey, slate blue","charizard":"orange body; turquoise-blue wing interiors; cream-yellow belly; orange tail and flame; pale claws and eyes","venusaur":"blue-green, foliage green, bright pink, hazelnut brown","tentacool":"blue, red, beige","snorlax":"deep teal or navy body; warm cream belly and muzzle; beige shading; ivory claws; dark eyes","scorbunny":"ivory, orange, golden yellow, grey, pink, brown, dark brown","rayquaza":"green, red, yellow, cream, pink","pikachu":"yellow body; brown stripes and tail base; black ear tips; red cheeks; orange shading; dark eyes and nose","mr. mime":"pale pink, deep blue, pink, pearl grey","mimikyu":"cream, very dark grey, orange, brown","lucario":"very dark grey, blue, cream, white, red","koffing":"purple, white, cream, pale yellow green","jigglypuff":"pale pink body; warmer pink inside ears; blue-green eyes; white highlights","gyarados":"ocean blue, cream yellow, plum, pink","greninja":"","gengar":"purple, rosy red","gardevoir":"green, pink, red, white","garchomp":"navy blue, red, yellow, white","flareon":"soft orange, golden cream, dark grey","eevee":"chestnut-brown body; deeper brown legs and tail base; ivory ruff and tail tip; beige shading","dragonite":"golden orange, golden brown, turquoise, cream","bulbasaur":"turquoise body; darker green plant; pale spots","arbok":"serpent purple, charcoal hood mark, marking red, marking yellow","charmander":"orange body; pale-cream belly; yellow-to-red tail flame","spoink":"pearl pink, grey, light grey, soft pink, slate grey","meowstic":"","seadra":"ocean blue, golden beige","masquerain":"salmon orange, white, raspberry purple, very pale blue, coral orange","metagross":"steel blue, light grey, red, dark blue","torterra":"Green (only a general clue; no detailed palette)","cacturne":"cactus green, forest green, golden yellow","mudkip":"lagoon blue, orange, very pale blue, bluish white","pelipper":"white, sky blue, cream yellow","seviper":"midnight blue, golden yellow, greyish purple, coral red, venom pink","audino":"","loudred":"bluish purple, purple, mauve pink, cream yellow, plum, white","spiritomb":"green, purple, brown, light green","chespin":"","snorunt":"straw yellow, orange, charcoal grey, light blue, ivory","ledian":"red, dark gray, blue, white, cream, pink","salamence":"","xatu":"green, yellow, white, dark gray, red, pink, white, yellow, green, yellow","wigglytuff":"soft pink, ivory, turquoise blue, raspberry pink","weedle":"golden beige, raspberry pink","voltorb":"coral red","wailord":"blue, white","venonat":"mauve, ruby pink, greyish beige, dark mauve","tyranitar":"green, navy blue, steel grey, pink, deep pink, ivory","dugtrio":"beige, pink, gray, light gray","foongus":"","togepi":"cream, white, orange, white, blue, pink","diglett":"sandy brown, pink, stone grey","grimer":"purple, dark grey, pink","poliwrath":"blue, white, white","stunfisk":"brown, yellow, dark brown, white","staryu":"golden brown, warm brown, golden yellow, ruby pink","starmie":"lavender, greyish purple, golden yellow, ruby pink, ruby red","squirtle":"light-blue skin; brown shell; cream belly and shell edge","drowzee":"yellow, brown, white, pink, gray","sudowoodo":"brown, green, yellow, pink","shuckle":"yellow, red, cream, very dark grey","sharpedo":"ocean blue, golden yellow, pearl grey, deep pink","lunatone":"cream, golden yellow, very dark grey, pink","gligar":"purple, blue, pink","scyther":"leaf green, dark green, ivory, cream yellow","tangela":"light blue, charcoal grey, terracotta","sableye":"purple, light blue, ivory, blue, red","sandshrew":"sandy gold, soft cream, slate blue","pidgey":"vanilla cream, wing brown, charcoal brown, rufous brown, golden cream, beak pink","rhyperior":"","rhydon":"steel grey, cream, soft pink","regirock":"cream, orange, brown, grey, golden yellow","regice":"light blue, yellow, blue, ivory","raticate":"golden brown, belly cream, mouth pink, grey brown, tail cream, band brown, paw beige","slowpoke":"pink, beige, white, pink","raichu":"golden orange, belly cream, lightning yellow, ear yellow, ear-tip brown, cheek yellow, tail charcoal","vileplume":"rosy red, ivory, slate blue, plum","geodude":"gray","porygon2":"red, blue","nidoking":"orchid purple, belly cream, ear turquoise, mouth pink","nidorina":"light blue, blue, dark blue, midnight blue, red","nidorino":"orchid purple, ear turquoise, deep violet spots","exeggutor":"leaf green, golden yellow, sandy brown, warm brown, soft pink","noctowl":"brown body, cream crest, cream facial rings, charcoal facial contours, red irises, pink beak, dark brown wings, brown chest markings, golden talons","golbat":"sky blue, mauve, plum, pink","octillery":"red, cream","onix":"rock grey, shaded grey","marowak":"white, brown, cream","seel":"bluish white, cream, pink","butterfree":"slate violet, coral red, midnight blue, pale blue","paras":"","parasect":"brick red, cream yellow, soft orange","persian":"cream, brown, white, red, gray, dark gray","phanpy":"light blue, orange, ivory, very dark grey, deep pink","pineco":"grey green, navy blue, red","pinsir":"greyish brown, dark brown, pearl grey, charcoal grey","plusle":"cream yellow, coral red, red pink, mauve pink","seaking":"coral orange, charcoal grey, ivory, soft pink, dark grey","nidoran (fritidsparken image; sex unclear)":{"female":"medium blue body; lighter blue belly and muzzle; dark teal/navy spots; pale-pink inner ears; cream or light-gray horn","male":"violet/lavender body; deeper-purple spots; pale-cream belly; pink or turquoise ear details"}};
function normalizedPokemonName(title){
 return String(title||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function pokemonKey(title){
 const key=normalizedPokemonName(title);
 return Object.keys(pokemonGuides).find(name=>{const normalized=normalizedPokemonName(name);return key===normalized||key.startsWith(normalized+" ")})||"";
}
function pokemonGuide(title){const name=pokemonKey(title),guide=name?pokemonGuides[name]:"";return typeof guide==="string"?guide:""}
function autoPalette(title){
 const key=normalizedPokemonName(title);
 const species=Object.keys(pokemonPalettes).find(name=>{const normalized=normalizedPokemonName(name);return key===normalized||key.startsWith(normalized+" ")});
 if(species)return pokemonPalettes[species].slice(0,6);
 const defaults=[["#6f9fc1","#6f9b70","#e4c46f"],["#719b91","#d59876","#e9ce89"],["#718cbd","#d9a2b3","#82a576"],["#76a6a0","#d0a06c","#b58ca9"]];
 let hash=0;for(const c of key)hash=(hash*31+c.charCodeAt(0))|0;
 return defaults[Math.abs(hash)%defaults.length];
}
const namedColorRules=[
 [/very dark (?:grey|gray)|charcoal|black|dark (?:grey|gray)/i,"#353638"],
 [/navy|midnight blue|deep blue|dark blue/i,"#344a68"],
 [/blue[ -]?green|turquoise|teal|lagoon/i,"#55aaa6"],
 [/sky blue|ocean blue|light blue|blue/i,"#578db7"],
 [/purple|violet|plum|mauve|lilac/i,"#82659f"],
 [/pink|rose|coral|salmon|raspberry/i,"#d889a5"],
 [/red|scarlet|ruby/i,"#ce5555"],
 [/orange|amber/i,"#e48c43"],
 [/yellow|golden|gold/i,"#e5c64a"],
 [/green|mint|foliage/i,"#65945c"],
 [/brown|chestnut|hazelnut|tan/i,"#94674c"],
 [/cream|ivory|beige|vanilla/i,"#eee2c8"],
 [/white/i,"#f3f1eb"],
 [/grey|gray|silver/i,"#85898c"]
];
function namedGuideColor(text){for(const [pattern,color] of namedColorRules)if(pattern.test(text))return color;return null}
function roleGuideColor(guide,role){
 if(!guide)return null;
 const clauses=guide.toLowerCase().split(/[;,.]/).map(v=>v.trim()).filter(Boolean);
 const clause=clauses.find(v=>new RegExp("\\b"+role+"\\b","i").test(v));
 return clause?namedGuideColor(clause):null;
}
function autoRegionColor(region,regions,palette,guide){
 const total=regions.reduce((sum,r)=>sum+r.area,0)||1;
 const ratio=region.area/total,cx=(region.cx||0)/W,cy=(region.cy||0)/H;
 const body=roleGuideColor(guide,"body")||palette[0];
 const cheek=roleGuideColor(guide,"cheeks")||roleGuideColor(guide,"cheek");
 if(cheek&&/cheek/i.test(guide)&&cy>.18&&cy<.48&&cx>.24&&cx<.76&&Math.abs(cx-.5)>.09&&ratio<.12)return cheek;
 const ear=roleGuideColor(guide,"ears")||roleGuideColor(guide,"ear");
 if(ear&&/ear/i.test(guide)&&cy<.23&&cx>.18&&cx<.82&&ratio<.1)return ear;
 const belly=roleGuideColor(guide,"belly")||roleGuideColor(guide,"underside")||roleGuideColor(guide,"muzzle");
 if(belly&&cx>.28&&cx<.72&&cy>.42&&ratio<.32)return belly;
 const wing=roleGuideColor(guide,"wings")||roleGuideColor(guide,"wing");
 if(wing&&(cx<.22||cx>.78)&&cy>.18&&cy<.76&&ratio<.36)return wing;
 const tail=roleGuideColor(guide,"tail");
 if(tail&&cy>.48&&(cx<.32||cx>.68)&&ratio<.18)return tail;
 if(/eyes|nose|claws|spots|stripes|markings|tips/i.test(guide)&&ratio<.012){
   const detail=namedGuideColor(guide.match(/(?:dark|black|charcoal|navy)[^;,]*/i)?.[0]||"");
   if(detail)return detail;
 }
 if(ratio>.045)return body;
 const colorCount=Math.min(palette.length,3);
 if(cy>.76&&(cx<.24||cx>.76)&&colorCount>1)return palette[1];
 if(cy<.19&&ratio<.035&&colorCount>2)return palette[2];
 if(ratio<.006&&colorCount>2)return palette[Math.min(2,colorCount-1)];
 return body;
}
const style=document.createElement("style");style.textContent=
".fp-online-actions{display:flex;flex-direction:column;gap:5px;margin:8px 0}.fp-online-actions button,.fp-online-actions a{box-sizing:border-box;display:flex;width:100%;min-width:0;align-items:center;justify-content:center;white-space:nowrap;border:1px solid #d7e2d7;border-radius:12px;padding:6px 7px;background:#edf3ed;color:#365443;font-family:inherit;font-size:12px;font-weight:600;line-height:1.15;text-decoration:none;cursor:pointer}.fp-online-actions button:hover,.fp-online-actions a:hover{background:#e2ece2;border-color:#c8d8c8}@media(max-width:700px){.fp-online-actions{gap:4px;margin:7px 0}.fp-online-actions button,.fp-online-actions a{padding:5px 5px;font-size:10px;border-radius:10px}}";

style.textContent+=`
.fp-paint-back{position:fixed;inset:0;z-index:99999;box-sizing:border-box;display:grid;place-items:center;padding:16px;background:rgba(24,34,27,.68)}
.fp-paint-dialog{box-sizing:border-box;width:min(1240px,100%);height:min(920px,calc(100dvh - 32px));max-height:calc(100dvh - 32px);display:flex;flex-direction:column;gap:10px;overflow:hidden;padding:16px;border:1px solid #dce6dc;border-radius:22px;background:#f8faf7;color:#26392d;box-shadow:0 20px 70px rgba(0,0,0,.28);font-family:inherit}
.fp-paint-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:0 0 auto}
.fp-paint-head h2{margin:0;color:#274632;font-size:22px;line-height:1.2}
.fp-paint-head p{margin:4px 0 0;color:#65766a;font-size:13px}
.fp-paint-close{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:#eaf0e9;color:#31523c;font-size:28px;line-height:1;cursor:pointer}
.fp-paint-tools{display:flex;align-items:center;gap:7px;flex:0 0 auto;flex-wrap:wrap}
.fp-paint-tools button,.fp-paint-tools select{box-sizing:border-box;min-height:38px;padding:7px 10px;border:1px solid #d7e2d7;border-radius:11px;background:#fff;color:#365443;font:600 13px/1.2 inherit;cursor:pointer}
.fp-paint-tools button[aria-pressed=true]{background:#e5f0e5;border-color:#a8c6ab}
.fp-paint-tools button:disabled{opacity:.55;cursor:default}
.fp-paint-tools [data-action=auto]{background:#f3bd43!important;color:#26392b!important;font-weight:700!important;border-color:#e7b331!important}
.fp-paint-palette{display:flex;align-items:center;gap:7px;flex:0 0 auto;flex-wrap:wrap}
.fp-paint-swatch{box-sizing:border-box;width:30px;height:30px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #d4ded4;cursor:pointer}
.fp-paint-swatch[aria-pressed=true]{outline:3px solid #315b3d;outline-offset:2px}
.fp-paint-custom{display:flex;align-items:center;gap:6px;color:#54675a;font-size:12px}
.fp-paint-custom input{width:34px;height:34px;padding:2px;border:1px solid #d7e2d7;border-radius:50%;background:#fff;cursor:pointer}
.fp-paint-stage{position:relative;flex:1 1 auto;min-height:120px;overflow:hidden;border:1px solid #e2e9e1;border-radius:16px;background:#fff;touch-action:none}
.fp-paint-sheet{position:absolute;top:50%;left:50%;overflow:hidden;transform-origin:center center;background:#fff;touch-action:none}
.fp-paint-layer,.fp-line-layer{position:absolute;inset:0;display:block;width:100%;height:100%}
.fp-line-layer{pointer-events:none}
.fp-paint-status{flex:0 0 auto;min-height:18px;color:#64766a;font-size:12px;line-height:1.35}
.fp-auto-progress{flex:0 0 auto;width:100%;height:10px;margin:0 0 2px;accent-color:#5da96e}
.fp-auto-progress[hidden]{display:none}
@media(max-width:700px){
 .fp-paint-back{padding:0}
 .fp-paint-dialog{width:100%;height:100dvh;max-height:100dvh;gap:7px;padding:10px;border:0;border-radius:0}
 .fp-paint-head h2{font-size:19px}
 .fp-paint-head p{font-size:12px}
 .fp-paint-close{width:38px;height:38px}
 .fp-paint-tools{gap:5px}
 .fp-paint-tools button,.fp-paint-tools select{min-height:36px;padding:6px 8px;font-size:12px}
 .fp-paint-palette{gap:6px}
 .fp-paint-swatch{width:27px;height:27px}
 .fp-paint-stage{min-height:100px;border-radius:12px}
 .fp-paint-status{font-size:11px}
}
`;
style.textContent+=".fp-paint-tools [data-action=auto]{background:#f3bd43!important;color:#26392b!important;font-weight:700!important;border-color:#e7b331!important}.fp-auto-progress{display:block;width:100%;height:10px;margin:0 0 8px;accent-color:#5da96e}.fp-auto-progress[hidden]{display:none}";
document.head.append(style);
function addButton(){
 document.querySelectorAll(".mandala-card").forEach(card=>{
  if(card.querySelector(".fp-online-actions"))return;
  const links=card.querySelector(".mandala-links");if(!links)return;
  const heading=card.querySelector("h3");const title=heading?.textContent.trim()||"Färgläggningsbild";
  const thumb=card.querySelector("img");if(!thumb)return;
  const imageUrl=title.trim().toLocaleLowerCase("sv")==="nidoking"?new URL(IMAGE,location.href).href:(thumb.currentSrc||thumb.src);
  const printLink=links.querySelector("a");
  const actions=document.createElement("div");actions.className="fp-online-actions";
  const paint=document.createElement("button");paint.type="button";paint.textContent="🎨 Måla online";paint.addEventListener("click",()=>openPainter(imageUrl,title));
  if(printLink){printLink.textContent="🖨️ Skriv ut";actions.append(paint,printLink)}
  else {const print=document.createElement("a");print.href=imageUrl;print.target="_blank";print.rel="noopener";print.textContent="🖨️ Skriv ut";actions.append(paint,print)}
  links.replaceWith(actions);
 });
}
const observer=new MutationObserver(addButton);observer.observe(document.body,{childList:true,subtree:true});addButton();
function openPainter(IMAGE,TARGET){
 const back=document.createElement("div");back.className="fp-paint-back";back.innerHTML='<section class="fp-paint-dialog" role="dialog" aria-modal="true" aria-label="Måla online"><header class="fp-paint-head"><div><h2>🎨 Måla online</h2><p></p></div><button class="fp-paint-close" aria-label="Stäng">×</button></header><div class="fp-paint-tools"><button data-tool="fill" aria-pressed="true">🪣 Fyll</button><button data-tool="pen" aria-pressed="false">✏️ Penna</button><button data-tool="erase" aria-pressed="false">🧽 Sudd</button><select aria-label="Penselstorlek"><option value="5">● Liten</option><option value="14" selected>● Medium</option><option value="30">● Stor</option></select><button data-action="undo" disabled>↶ Ångra</button><button data-action="redo" disabled>↷ Gör om</button><button data-action="minus" aria-label="Zooma ut">−</button><button data-action="one">100%</button><button data-action="plus" aria-label="Zooma in">+</button><button data-action="reset">🗑️ Börja om</button>'+'<button data-action="auto">✨ Färglägg automatiskt</button>'+'<button data-action="save">💾 Spara bild</button></div><div class="fp-paint-palette" role="group" aria-label="Färgpalett"></div><div class="fp-paint-stage"><div class="fp-paint-sheet"><canvas class="fp-paint-layer"></canvas><canvas class="fp-line-layer"></canvas></div></div><div class="fp-paint-status">Välj färg och tryck på ett område. Två fingrar flyttar och zoomar. Dator: håll mellanslag och dra.</div></section>';
 back.querySelector(".fp-paint-head p").textContent=TARGET+" · Måla med färghink eller penna!";
 document.body.append(back);document.body.style.overflow="hidden";
 const $=s=>back.querySelector(s),dialog=$(".fp-paint-dialog"),stage=$(".fp-paint-stage"),sheet=$(".fp-paint-sheet"),paint=$(".fp-paint-layer"),lines=$(".fp-line-layer"),ctx=paint.getContext("2d",{willReadFrequently:true}),lctx=lines.getContext("2d"),undo=$('[data-action="undo"]'),redo=$('[data-action="redo"]');
 let tool="fill",color="#ef4444",brush=14,acts=[],future=[],W=0,H=0,luma=null,zoom=1,tx=0,ty=0,space=false,active=null,pending=null,gesture=false,pinch=null;
 const autoSteps=[
  [.182,.278,"#e58aa5"],[.163,.323,"#e58aa5"],[.191,.310,"#e58aa5"],[.500,.311,"#e58aa5"],[.450,.320,"#e58aa5"],
  [.344,.363,"#a654a0"],[.526,.357,"#f2d8ae"],[.673,.341,"#f2d8ae"],[.736,.409,"#a654a0"],[.330,.383,"#d83242"],
  [.500,.427,"#a654a0"],[.921,.404,"#a654a0"],[.554,.411,"#a654a0"],[.442,.395,"#f2d8ae"],[.885,.428,"#f2d8ae"],
  [.355,.427,"#f2d8ae"],[.409,.437,"#f2d8ae"],[.305,.446,"#a654a0"],[.623,.446,"#f2d8ae"],[.624,.478,"#a654a0"],
  [.918,.476,"#a654a0"],[.436,.495,"#f2d8ae"],[.229,.475,"#a654a0"],[.694,.486,"#a654a0"],[.880,.472,"#a654a0"],
  [.141,.531,"#a654a0"],[.199,.486,"#a654a0"],[.567,.496,"#a654a0"],[.804,.487,"#a654a0"],[.298,.509,"#a654a0"],
  [.867,.520,"#a654a0"],[.765,.561,"#a654a0"],[.426,.556,"#f2d8ae"],[.596,.553,"#a654a0"],[.616,.606,"#a654a0"],
  [.412,.626,"#f2d8ae"],[.287,.675,"#a654a0"],[.226,.633,"#a654a0"],[.111,.593,"#f2d8ae"],[.650,.685,"#a654a0"],
  [.147,.603,"#f2d8ae"],[.494,.687,"#f2d8ae"],[.193,.714,"#a654a0"],[.671,.746,"#a654a0"]
 ];
 const autoButton=$('[data-action="auto"]'),autoProgress=document.createElement("progress"),status=$(".fp-paint-status");
 let autoRunning=false;
 autoProgress.className="fp-auto-progress";autoProgress.max=1;autoProgress.value=0;autoProgress.hidden=true;
 status.setAttribute("aria-live","polite");if(autoButton)dialog.insertBefore(autoProgress,stage);

 const img=new Image();if(new URL(IMAGE,location.href).origin!==location.origin)img.crossOrigin="anonymous";img.onload=()=>{
   const scale=Math.min(1,2200/Math.max(img.naturalWidth,img.naturalHeight),Math.sqrt(2.5e6/(img.naturalWidth*img.naturalHeight)));
   W=Math.max(1,Math.round(img.naturalWidth*scale));H=Math.max(1,Math.round(img.naturalHeight*scale));
   [paint,lines].forEach(c=>{c.width=W;c.height=H});
   const src=document.createElement("canvas");src.width=W;src.height=H;const sctx=src.getContext("2d",{willReadFrequently:true});sctx.drawImage(img,0,0,W,H);
   const dat=sctx.getImageData(0,0,W,H),d=dat.data;luma=new Uint8Array(W*H);for(let i=0,j=0;i<d.length;i+=4,j++){const g=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000;luma[j]=g;const a=Math.max(0,Math.min(255,Math.round((245-g)*1.7)));d[i]=d[i+1]=d[i+2]=0;d[i+3]=a}
   lctx.putImageData(dat,0,0);fit();window.addEventListener("resize",fit);
 };img.onerror=()=>{$(".fp-paint-status").textContent="Bilden kunde inte öppnas. Stäng och försök igen.";};img.src=IMAGE;
 function fit(){if(!W)return;let r=W/H,aw=stage.clientWidth-24,ah=stage.clientHeight-24,w=Math.min(aw,ah*r);sheet.style.width=w+"px";sheet.style.height=w/r+"px";applyTransform()}
 function applyTransform(){sheet.style.transform="translate(calc(-50% + "+tx+"px),calc(-50% + "+ty+"px)) scale("+zoom+")"}
 function setZoom(z){zoom=Math.max(1,Math.min(4,z));if(zoom===1)tx=ty=0;applyTransform()}
 function toolSet(t){tool=t;back.querySelectorAll("[data-tool]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.tool===t))}
 back.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>toolSet(b.dataset.tool));
 const palette=$(".fp-paint-palette");colors.forEach(([name,c])=>{const b=document.createElement("button");b.className="fp-paint-swatch";b.style.background=c;b.title=name;b.setAttribute("aria-label",name);b.setAttribute("aria-pressed",c===color);b.onclick=()=>choose(c,b);palette.append(b)});
 const custom=document.createElement("label");custom.className="fp-paint-custom";custom.textContent="Egen färg";const picker=document.createElement("input");picker.type="color";picker.value=color;picker.setAttribute("aria-label","Välj egen färg");picker.oninput=()=>choose(picker.value);custom.append(picker);palette.append(custom);
 function choose(c,b){color=c;picker.value=c;palette.querySelectorAll(".fp-paint-swatch").forEach(s=>s.setAttribute("aria-pressed",String(s===b)))}
 back.querySelector("select").onchange=e=>brush=+e.target.value;
 function historyUI(){undo.disabled=!acts.length;redo.disabled=!future.length}
 function drawStroke(c,a){if(a.points.length<1)return;c.save();c.lineCap=c.lineJoin="round";c.lineWidth=a.size;c.globalCompositeOperation=a.erase?"destination-out":"source-over";c.strokeStyle=a.color;c.fillStyle=a.color;if(a.points.length===1){c.beginPath();c.arc(a.points[0][0],a.points[0][1],a.size/2,0,Math.PI*2);c.fill()}else{c.beginPath();c.moveTo(...a.points[0]);for(let i=1;i<a.points.length-1;i++){const p=a.points[i],n=a.points[i+1];c.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2)}const q=a.points[a.points.length-1];c.lineTo(q[0],q[1]);c.stroke()}c.restore()}
 function fillRegion(c,sx,sy){
   sx=Math.floor(sx);sy=Math.floor(sy);if(sx<0||sy<0||sx>=W||sy>=H)return;
   const start=sy*W+sx;if(luma[start]<220)return;
   const out=c.getImageData(0,0,W,H),d=out.data,seen=new Uint8Array(W*H),stack=[start],rgb=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16)];
   while(stack.length){let seed=stack.pop(),y=Math.floor(seed/W),x=seed-y*W;if(seen[seed]||luma[seed]<220)continue;while(x>0&&!seen[y*W+x-1]&&luma[y*W+x-1]>=220)x--;let up=false,dn=false;
    for(;x<W;x++){let i=y*W+x;if(seen[i]||luma[i]<220)break;seen[i]=1;let k=i*4;d[k]=rgb[0];d[k+1]=rgb[1];d[k+2]=rgb[2];d[k+3]=255;
      if(y>0){let n=i-W,ok=!seen[n]&&luma[n]>=220;if(ok&&!up)stack.push(n);up=ok}else up=false;
      if(y<H-1){let n=i+W,ok=!seen[n]&&luma[n]>=220;if(ok&&!dn)stack.push(n);dn=ok}else dn=false
    }
   }
c.putImageData(out,0,0)
 }
 function findAutoRegions(){
   const total=W*H,seen=new Uint8Array(total),queue=new Uint32Array(total),regions=[];
   for(let start=0;start<total;start++){
     if(seen[start]||luma[start]<220)continue;
     let head=0,tail=0,minX=W,minY=H,maxX=0,maxY=0,sumX=0,sumY=0,touchesEdge=false;
     seen[start]=1;queue[tail++]=start;
     while(head<tail){
       const i=queue[head++],y=(i/W)|0,x=i-y*W;
       sumX+=x;sumY+=y;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
       if(x===0||y===0||x===W-1||y===H-1)touchesEdge=true;
       let n;
       if(x>0&&(n=i-1,!seen[n]&&luma[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(x<W-1&&(n=i+1,!seen[n]&&luma[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(y>0&&(n=i-W,!seen[n]&&luma[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(y<H-1&&(n=i+W,!seen[n]&&luma[n]>=220)){seen[n]=1;queue[tail++]=n}
     }
     if(!touchesEdge&&tail>=36&&tail<total*.45)regions.push({pixels:queue.slice(0,tail),minX,minY,maxX,maxY,area:tail,cx:sumX/tail,cy:sumY/tail});
   }
   regions.sort((a,b)=>b.area-a.area);regions.length=Math.min(regions.length,160);
   regions.sort((a,b)=>a.minY-b.minY||a.minX-b.minX);
   return regions;
 }
 function paintAutoRegion(region,fillColor){
   const width=region.maxX-region.minX+1,height=region.maxY-region.minY+1;
   const image=ctx.createImageData(width,height),data=image.data;
   const red=parseInt(fillColor.slice(1,3),16),green=parseInt(fillColor.slice(3,5),16),blue=parseInt(fillColor.slice(5,7),16);
   for(const index of region.pixels){const x=index%W-region.minX,y=((index/W)|0)-region.minY,k=(y*width+x)*4;data[k]=red;data[k+1]=green;data[k+2]=blue;data[k+3]=255}
   ctx.putImageData(image,region.minX,region.minY);
 }
 async function runAutoColor(){
   if(!autoButton||autoRunning||!W)return;
   if(acts.length&&!confirm("Automatisk färgläggning börjar från en tom bild. Vill du rensa din målning och fortsätta?"))return;
   acts=[];future=[];ctx.clearRect(0,0,W,H);historyUI();autoRunning=true;autoButton.disabled=true;
   autoProgress.hidden=false;autoProgress.value=0;sheet.style.pointerEvents="none";toolSet("fill");
   const isNidoking=TARGET.toLocaleLowerCase("sv")==="nidoking";
   let plan;
   if(isNidoking)plan=autoSteps.map(step=>({type:"seed",x:Math.min(W-1,Math.max(0,Math.round(step[0]*W))),y:Math.min(H-1,Math.max(0,Math.round(step[1]*H))),color:step[2]}));
   else{
     status.textContent="Hittar slutna färgområden…";
     await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
     const regions=findAutoRegions(),paletteColors=autoPalette(TARGET),guide=pokemonGuide(TARGET);
     plan=regions.map(region=>({type:"region",region,color:autoRegionColor(region,regions,paletteColors,guide)}));
   }
   if(!plan.length){
     autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;sheet.style.pointerEvents="";
     status.textContent="Jag hittade inga tydligt slutna områden i bilden. Du kan färglägga den med hink eller penna.";
     return;
   }
   autoProgress.max=plan.length;
   for(let i=0;i<plan.length;i++){
     if(!back.isConnected){autoRunning=false;return}
     const step=plan[i];
     if(step.type==="seed"){
       if(luma[step.y*W+step.x]>=220){acts.push({type:"fill",x:step.x,y:step.y,color:step.color});const previous=color;color=step.color;fillRegion(ctx,step.x,step.y);color=previous}
     }else{
       paintAutoRegion(step.region,step.color);
       acts.push({type:"region",region:step.region,color:step.color});
     }
     future=[];autoProgress.value=i+1;
     status.textContent="Timelapse: färglägger "+TARGET+", steg "+(i+1)+" av "+plan.length+"…";historyUI();
     await new Promise(resolve=>setTimeout(resolve,115));
   }
   autoRunning=false;sheet.style.pointerEvents="";
   status.textContent="Klart! "+TARGET+" är färglagd. Du kan fortsätta måla eller spara bilden.";
 }
 if(autoButton)autoButton.addEventListener("click",runAutoColor);
 function redraw(){ctx.clearRect(0,0,W,H);for(const a of acts){if(a.type==="fill"){const old=color;color=a.color;fillRegion(ctx,a.x,a.y);color=old}else if(a.type==="region"){paintAutoRegion(a.region,a.color)}else drawStroke(ctx,a)}historyUI()}
 function pos(e){const r=sheet.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]}
 const pointers=new Map();
 sheet.addEventListener("pointerdown",e=>{if(!W)return;e.preventDefault();sheet.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
   if(pointers.size>1){gesture=true;pending=null;if(active){acts.pop();redraw();active=null}const ps=[...pointers.values()];pinch={distance:Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]),zoom,tx,ty,mid:[(ps[0][0]+ps[1][0])/2,(ps[0][1]+ps[1][1])/2]};return}
   const p=pos(e);if(space||e.button===1){active={pan:true,x:e.clientX,y:e.clientY,tx,ty};return}
   if(tool==="fill"){pending={p,start:[e.clientX,e.clientY],pointer:e.pointerId};return}
   active={pan:false,pointer:e.pointerId,action:{type:"stroke",color,size:tool==="erase"?brush*2:brush,erase:tool==="erase",points:[p]}};acts.push(active.action);future=[];drawStroke(ctx,active.action);historyUI()
 });
 sheet.addEventListener("pointermove",e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(gesture&&pointers.size>1&&pinch){const ps=[...pointers.values()],dist=Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]),mid=[(ps[0][0]+ps[1][0])/2,(ps[0][1]+ps[1][1])/2],z=Math.max(1,Math.min(4,pinch.zoom*dist/Math.max(1,pinch.distance))),rect=stage.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,k=z/pinch.zoom;zoom=z;tx=mid[0]-cx-(pinch.mid[0]-cx-pinch.tx)*k;ty=mid[1]-cy-(pinch.mid[1]-cy-pinch.ty)*k;applyTransform();return}if(pending&&pending.pointer===e.pointerId&&Math.hypot(e.clientX-pending.start[0],e.clientY-pending.start[1])>8)pending=null;if(!active)return;if(active.pan){tx=active.tx+e.clientX-active.x;ty=active.ty+e.clientY-active.y;applyTransform();return}if(active.pointer===e.pointerId){const p=pos(e),pts=active.action.points,last=pts[pts.length-1];if(Math.hypot(p[0]-last[0],p[1]-last[1])>1){pts.push(p);drawStroke(ctx,active.action)}}});
 sheet.addEventListener("pointerup",e=>{pointers.delete(e.pointerId);if(gesture){if(!pointers.size){gesture=false;pinch=null}active=null;return}if(pending&&pending.pointer===e.pointerId){if(pending){const p=pending.p;const a={type:"fill",x:p[0],y:p[1],color};acts.push(a);future=[];fillRegion(ctx,a.x,a.y);historyUI()}pending=null}if(active&&!active.pan){active=null;historyUI()}else if(active?.pan)active=null});
 sheet.addEventListener("pointercancel",e=>{pointers.delete(e.pointerId);pending=null;gesture=true;active=null;if(!pointers.size){gesture=false;pinch=null}});
 sheet.addEventListener("contextmenu",e=>e.preventDefault());
 const undoOne=()=>{if(acts.length)future.push(acts.pop());redraw()},redoOne=()=>{if(future.length)acts.push(future.pop());redraw()};
 undo.onclick=undoOne;redo.onclick=redoOne;
 back.querySelector('[data-action="minus"]').onclick=()=>setZoom(zoom-.25);back.querySelector('[data-action="plus"]').onclick=()=>setZoom(zoom+.25);back.querySelector('[data-action="one"]').onclick=()=>setZoom(1);
 stage.addEventListener("wheel",e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();setZoom(zoom+(e.deltaY<0?.15:-.15))},{passive:false});
 back.querySelector('[data-action="reset"]').onclick=()=>{if(autoRunning)return;if(confirm("Vill du radera hela målningen och börja om?")){acts=[];future=[];autoProgress.hidden=true;autoProgress.value=0;if(autoButton)autoButton.disabled=false;status.textContent="Välj färg och tryck på ett område. Två fingrar flyttar och zoomar. Dator: håll mellanslag och dra.";redraw()}};
 back.querySelector('[data-action="save"]').onclick=()=>{if(!W)return;const out=document.createElement("canvas");out.width=img.naturalWidth;out.height=img.naturalHeight;const c=out.getContext("2d");c.drawImage(paint,0,0,out.width,out.height);c.drawImage(lines,0,0,out.width,out.height);out.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="min-farglagda-"+TARGET.toLocaleLowerCase("sv").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},"image/png")};
 function close(){window.removeEventListener("resize",fit);window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);back.remove();document.body.style.overflow="";addButton()}
 back.querySelector(".fp-paint-close").onclick=close;back.addEventListener("click",e=>{if(e.target===back)close()});const keydown=e=>{if(e.code==="Space"){space=true;if(e.target===document.body||e.target===back)e.preventDefault()}if(e.key==="Escape")close();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redoOne():undoOne()}};const keyup=e=>{if(e.code==="Space")space=false};window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);back.addEventListener("keydown",e=>{if(e.code==="Space")e.preventDefault()});back.tabIndex=-1;back.focus();
}
})();
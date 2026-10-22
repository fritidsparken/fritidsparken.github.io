(()=>{"use strict";
const GHOST_REFERENCE="./assets/coloring-originals-2026/cheerful-ghost-20261020/ghost-reference-v2.js";
const colors=[["Röd","#ef4444"],["Orange","#fb923c"],["Gul","#facc15"],["Ljusgrön","#a3e635"],["Grön","#22c55e"],["Mörkgrön","#15803d"],["Turkos","#2dd4bf"],["Ljusblå","#7dd3fc"],["Blå","#3b82f6"],["Mörkblå","#1e3a8a"],["Lila","#8b5cf6"],["Rosa","#ec4899"],["Ljusrosa","#f9a8d4"],["Brun","#92400e"],["Beige","#e7d3a8"],["Grå","#9ca3af"],["Svart","#171717"],["Vit","#ffffff"],["Mint","#6ee7b7"],["Korall","#fb7185"]];
const pokemonPalettes={"magikarp":["#d65b57","#e3b83e","#e8b5c3","#d889a5"],"lapras":["#79b5d7","#578db7","#eee2c8","#a391b6"],"charizard":["#e48c43","#55aaa6","#eee2c8","#e5c64a"],"venusaur":["#578db7","#579d91","#65945c","#d889a5"],"tentacool":["#578db7","#ce5555","#d3bb94"],"snorlax":["#478d89","#eee2c8","#d3bb94"],"scorbunny":["#f0e8d6","#e48c43","#e3b83e","#85898c"],"rayquaza":["#65945c","#ce5555","#e5c64a","#eee2c8"],"pikachu":["#e5c64a","#94674c","#353638","#ce5555"],"mr. mime":["#e8b5c3","#d889a5","#356b9e","#578db7"],"mimikyu":["#eee2c8","#36383b","#5c6167","#85898c"],"lucario":["#36383b","#5c6167","#85898c","#578db7"],"koffing":["#82659f","#f3f1eb","#eee2c8","#e9dc9e"],"jigglypuff":["#e8b5c3","#d889a5","#578db7","#579d91"],"gyarados":["#4e8fba","#ead58d","#eee2c8","#e5c64a"],"gengar":["#82659f","#d35e69"],"gardevoir":["#65945c","#d889a5","#ce5555","#f3f1eb"],"garchomp":["#578db7","#ce5555","#e5c64a","#f3f1eb"],"flareon":["#e99a58","#e8d49e","#eee2c8","#5c6167"],"eevee":["#94674c","#f0e8d6","#d3bb94"],"dragonite":["#dd963f","#94674c","#55aaa6","#eee2c8"],"bulbasaur":["#55aaa6","#65945c"],"arbok":["#82659f","#4b4d50","#ce5555","#e5c64a"],"charmander":["#e48c43","#eee2c8","#e5c64a","#ce5555"],"spoink":["#d889a5","#85898c","#c9ccce"],"seadra":["#4e8fba","#d8bc82"],"masquerain":["#df8a70","#e48c43","#f3f1eb","#82659f"],"metagross":["#578db7","#c9ccce","#85898c","#ce5555"],"torterra":["#65945c"],"cacturne":["#65954c","#477953","#e3b83e"],"mudkip":["#578db7","#e48c43","#e6eef0"],"pelipper":["#f3f1eb","#79b5d7","#578db7","#ead58d"],"seviper":["#344a68","#578db7","#e3b83e","#82659f"],"loudred":["#82659f","#a47c91","#d889a5","#ead58d"],"spiritomb":["#65945c","#82659f","#94674c"],"snorunt":["#e5c64a","#e48c43","#414348","#85898c"],"ledian":["#ce5555","#85898c","#578db7","#f3f1eb"],"xatu":["#65945c","#e5c64a","#f3f1eb","#85898c"],"wigglytuff":["#d889a5","#f0e8d6","#55aaa6"],"weedle":["#d8bc82","#d57398"],"voltorb":["#d65b57"],"wailord":["#578db7","#f3f1eb"],"venonat":["#a47c91","#d889a5","#d3bb94"],"tyranitar":["#65945c","#578db7","#737d87","#d889a5"],"dugtrio":["#d3bb94","#d889a5","#85898c"],"togepi":["#eee2c8","#f3f1eb","#e48c43","#578db7"],"diglett":["#94674c","#d889a5","#85898c"],"grimer":["#82659f","#5c6167","#85898c","#d889a5"],"poliwrath":["#578db7","#f3f1eb"],"stunfisk":["#94674c","#e5c64a","#f3f1eb"],"staryu":["#94674c","#e3b83e","#d889a5"],"starmie":["#a391b6","#82659f","#e3b83e","#d889a5"],"squirtle":["#578db7","#94674c","#eee2c8"],"drowzee":["#e5c64a","#94674c","#f3f1eb","#d889a5"],"sudowoodo":["#94674c","#65945c","#e5c64a","#d889a5"],"shuckle":["#e5c64a","#ce5555","#eee2c8","#36383b"],"sharpedo":["#4e8fba","#e3b83e","#c4c8c9","#85898c"],"lunatone":["#eee2c8","#e3b83e","#36383b","#5c6167"],"gligar":["#82659f","#578db7","#d889a5"],"scyther":["#609957","#f0e8d6","#ead58d","#e5c64a"],"tangela":["#8fc5df","#578db7","#414348","#85898c"],"sableye":["#82659f","#8fc5df","#578db7","#f0e8d6"],"sandshrew":["#eee2c8","#578db7"],"pidgey":["#eee2c8","#94674c","#4b4d50","#e8d49e"],"rhydon":["#737d87","#eee2c8","#d889a5"],"regirock":["#eee2c8","#e48c43","#94674c","#85898c"],"regice":["#8fc5df","#578db7","#e5c64a","#f0e8d6"],"raticate":["#94674c","#eee2c8","#d889a5","#85898c"],"slowpoke":["#d889a5","#d3bb94","#f3f1eb"],"raichu":["#dd963f","#eee2c8","#e5c64a","#94674c"],"vileplume":["#d35e69","#f0e8d6","#578db7","#775b77"],"geodude":["#85898c"],"porygon2":["#ce5555","#578db7"],"nidorina":["#8fc5df","#578db7","#344a68","#ce5555"],"nidorino":["#82659f","#55aaa6"],"exeggutor":["#609957","#e3b83e","#94674c","#d889a5"],"noctowl":["#94674c","#eee2c8","#4b4d50","#ce5555"],"golbat":["#79b5d7","#578db7","#a47c91","#775b77"],"octillery":["#ce5555","#eee2c8"],"onix":["#85898c"],"marowak":["#f3f1eb","#94674c","#eee2c8"],"seel":["#e6eef0","#eee2c8","#d889a5"],"butterfree":["#82649e","#d65b57","#344a68","#578db7"],"parasect":["#ce5555","#ead58d","#eee2c8","#e5c64a"],"persian":["#eee2c8","#94674c","#f3f1eb","#ce5555"],"phanpy":["#8fc5df","#578db7","#e48c43","#f0e8d6"],"pineco":["#788b70","#578db7","#ce5555"],"pinsir":["#94674c","#c4c8c9","#85898c","#414348"],"plusle":["#ead58d","#eee2c8","#e5c64a","#d65b57"],"seaking":["#df785e","#414348","#85898c","#f0e8d6"]};
const pokemonGuides={"magikarp":"coral red, golden yellow, pale pink, peach","lapras":"sky blue, cream, lavender grey, slate blue","charizard":"orange body; turquoise-blue wing interiors; cream-yellow belly; orange tail and flame; pale claws and eyes","venusaur":"blue-green, foliage green, bright pink, hazelnut brown","tentacool":"blue, red, beige","snorlax":"deep teal or navy body; warm cream belly and muzzle; beige shading; ivory claws; dark eyes","scorbunny":"ivory, orange, golden yellow, grey, pink, brown, dark brown","rayquaza":"green, red, yellow, cream, pink","pikachu":"yellow body; brown stripes and tail base; black ear tips; red cheeks; orange shading; dark eyes and nose","mr. mime":"pale pink, deep blue, pink, pearl grey","mimikyu":"cream, very dark grey, orange, brown","lucario":"very dark grey, blue, cream, white, red","koffing":"purple, white, cream, pale yellow green","jigglypuff":"pale pink body; warmer pink inside ears; blue-green eyes; white highlights","gyarados":"ocean blue, cream yellow, plum, pink","greninja":"","gengar":"purple, rosy red","gardevoir":"green, pink, red, white","garchomp":"navy blue, red, yellow, white","flareon":"soft orange, golden cream, dark grey","eevee":"chestnut-brown body; deeper brown legs and tail base; ivory ruff and tail tip; beige shading","dragonite":"golden orange, golden brown, turquoise, cream","bulbasaur":"turquoise body; darker green plant; pale spots","arbok":"serpent purple, charcoal hood mark, marking red, marking yellow","charmander":"orange body; pale-cream belly; yellow-to-red tail flame","spoink":"pearl pink, grey, light grey, soft pink, slate grey","meowstic":"","seadra":"ocean blue, golden beige","masquerain":"salmon orange, white, raspberry purple, very pale blue, coral orange","metagross":"steel blue, light grey, red, dark blue","torterra":"Green (only a general clue; no detailed palette)","cacturne":"cactus green, forest green, golden yellow","mudkip":"lagoon blue, orange, very pale blue, bluish white","pelipper":"white, sky blue, cream yellow","seviper":"midnight blue, golden yellow, greyish purple, coral red, venom pink","audino":"","loudred":"bluish purple, purple, mauve pink, cream yellow, plum, white","spiritomb":"green, purple, brown, light green","chespin":"","snorunt":"straw yellow, orange, charcoal grey, light blue, ivory","ledian":"red, dark gray, blue, white, cream, pink","salamence":"","xatu":"green, yellow, white, dark gray, red, pink, white, yellow, green, yellow","wigglytuff":"soft pink, ivory, turquoise blue, raspberry pink","weedle":"golden beige, raspberry pink","voltorb":"coral red","wailord":"blue, white","venonat":"mauve, ruby pink, greyish beige, dark mauve","tyranitar":"green, navy blue, steel grey, pink, deep pink, ivory","dugtrio":"beige, pink, gray, light gray","foongus":"","togepi":"cream, white, orange, white, blue, pink","diglett":"sandy brown, pink, stone grey","grimer":"purple, dark grey, pink","poliwrath":"blue, white, white","stunfisk":"brown, yellow, dark brown, white","staryu":"golden brown, warm brown, golden yellow, ruby pink","starmie":"lavender, greyish purple, golden yellow, ruby pink, ruby red","squirtle":"light-blue skin; brown shell; cream belly and shell edge","drowzee":"yellow, brown, white, pink, gray","sudowoodo":"brown, green, yellow, pink","shuckle":"yellow, red, cream, very dark grey","sharpedo":"ocean blue, golden yellow, pearl grey, deep pink","lunatone":"cream, golden yellow, very dark grey, pink","gligar":"purple, blue, pink","scyther":"leaf green, dark green, ivory, cream yellow","tangela":"light blue, charcoal grey, terracotta","sableye":"purple, light blue, ivory, blue, red","sandshrew":"sandy gold, soft cream, slate blue","pidgey":"vanilla cream, wing brown, charcoal brown, rufous brown, golden cream, beak pink","rhyperior":"","rhydon":"steel grey, cream, soft pink","regirock":"cream, orange, brown, grey, golden yellow","regice":"light blue, yellow, blue, ivory","raticate":"golden brown, belly cream, mouth pink, grey brown, tail cream, band brown, paw beige","slowpoke":"pink, beige, white, pink","raichu":"golden orange, belly cream, lightning yellow, ear yellow, ear-tip brown, cheek yellow, tail charcoal","vileplume":"rosy red, ivory, slate blue, plum","geodude":"gray","porygon2":"red, blue","nidorina":"light blue, blue, dark blue, midnight blue, red","nidorino":"orchid purple, ear turquoise, deep violet spots","exeggutor":"leaf green, golden yellow, sandy brown, warm brown, soft pink","noctowl":"brown body, cream crest, cream facial rings, charcoal facial contours, red irises, pink beak, dark brown wings, brown chest markings, golden talons","golbat":"sky blue, mauve, plum, pink","octillery":"red, cream","onix":"rock grey, shaded grey","marowak":"white, brown, cream","seel":"bluish white, cream, pink","butterfree":"slate violet, coral red, midnight blue, pale blue","paras":"","parasect":"brick red, cream yellow, soft orange","persian":"cream, brown, white, red, gray, dark gray","phanpy":"light blue, orange, ivory, very dark grey, deep pink","pineco":"grey green, navy blue, red","pinsir":"greyish brown, dark brown, pearl grey, charcoal grey","plusle":"cream yellow, coral red, red pink, mauve pink","seaking":"coral orange, charcoal grey, ivory, soft pink, dark grey","nidoran (fritidsparken image; sex unclear)":{"female":"medium blue body; lighter blue belly and muzzle; dark teal/navy spots; pale-pink inner ears; cream or light-gray horn","male":"violet/lavender body; deeper-purple spots; pale-cream belly; pink or turquoise ear details"}};
function normalizedPokemonName(title){
 return String(title||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
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
 return ["#578db7","#eee2c8","#85898c"];
}
const namedColorRules=[
 [/very dark (?:grey|gray)|charcoal|black|dark (?:grey|gray)/i,"#42434c"],
 [/navy|midnight blue|deep blue|dark blue/i,"#3d546e"],
 [/blue[ -]?green|turquoise|teal|lagoon/i,"#4997a7"],
 [/sky blue|ocean blue|light blue|blue/i,"#71adc9"],
 [/purple|violet|plum|mauve|lilac/i,"#987ab5"],
 [/pink|rose|coral|salmon|raspberry/i,"#ed8b96"],
 [/red|scarlet|ruby/i,"#ed5945"],
 [/orange|amber/i,"#ee9957"],
 [/yellow|golden|gold/i,"#f6cd35"],
 [/green|mint|foliage/i,"#5e9d63"],
 [/brown|chestnut|hazelnut|tan/i,"#985a3c"],
 [/cream|ivory|beige|vanilla/i,"#f0dfb7"],
 [/white/i,"#fffdf4"],
 [/grey|gray|silver/i,"#a6a4b3"]
];
function namedGuideColor(text){
 let match=null;
 for(const [pattern,color] of namedColorRules){const found=pattern.exec(text);if(found&&(!match||found.index<match.index))match={index:found.index,color}}
 return match?match.color:null;
}
function roleGuideColor(guide,role){
 if(!guide)return null;
 const clauses=guide.toLowerCase().split(/[;,.]/).map(v=>v.trim()).filter(Boolean);
 const clause=clauses.find(v=>new RegExp("\\b"+role+"\\b","i").test(v));
 return clause?namedGuideColor(clause):null;
}
function autoRegionColor(region,regions,palette,guide,title){
 const species=pokemonKey(title||"");
 const total=regions.reduce((sum,r)=>sum+r.area,0)||1;
 const ratio=region.area/total,cx=region.cx||0,cy=region.cy||0;
 const body=roleGuideColor(guide,"body")||palette[0]||"#7f8c8d";
 // Keep the automatic pass conservative: only color enclosed regions in the
 // character's central drawing area. Ambiguous tiny regions stay white rather
 // than receiving a guessed accent color (which previously colored flowers,
 // props and limbs incorrectly).
 const inSubject=cx>.18&&cx<.82&&cy>.10&&cy<.84;
 if(!inSubject&&ratio<.20)return null;
 if(species==="pikachu")return inSubject?"#f6cd35":null;
 return body;
}
const style=document.createElement("style");style.textContent=
".fp-online-actions{display:flex;flex-direction:column;gap:5px;margin:8px 0}.fp-online-actions button,.fp-online-actions a{box-sizing:border-box;display:flex;width:100%;min-width:0;align-items:center;justify-content:center;white-space:nowrap;border:1px solid #d7e2d7;border-radius:12px;padding:6px 7px;background:var(--bg);color:var(--ink);font-family:inherit;font-size:12px;font-weight:600;line-height:1.15;text-decoration:none;cursor:pointer}.fp-online-actions button:hover,.fp-online-actions a:hover{background:var(--bg);border-color:var(--line)}@media(max-width:700px){.fp-online-actions{gap:4px;margin:7px 0}.fp-online-actions button,.fp-online-actions a{padding:5px 5px;font-size:10px;border-radius:10px}}";

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
@media(min-width:701px){
 .fp-paint-dialog.fp-paint-ghost{width:min(1480px,calc(100vw - 12px));height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);display:grid;grid-template-columns:260px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto auto auto;gap:8px;padding:12px;border-radius:14px}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-head{grid-column:1 / -1;grid-row:1}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-tools{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:6px;overflow:auto}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-tools button,.fp-paint-dialog.fp-paint-ghost .fp-paint-tools select{min-height:36px;padding:5px 6px;font-size:12px;white-space:nowrap}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-palette{grid-column:1;grid-row:3;display:grid;grid-template-columns:repeat(5,32px);align-content:start;gap:7px}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-swatch{width:30px;height:30px}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-custom{grid-column:1 / -1}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-stage{grid-column:2;grid-row:2 / 4;min-height:0}
 .fp-paint-dialog.fp-paint-ghost .fp-auto-progress{grid-column:1 / -1;grid-row:4;margin:0}
 .fp-paint-dialog.fp-paint-ghost .fp-paint-status{grid-column:1 / -1;grid-row:5}
}
`;
style.textContent+=".fp-paint-tools [data-action=auto]{background:#f3bd43!important;color:#26392b!important;font-weight:700!important;border-color:#e7b331!important}.fp-auto-progress{display:block;width:100%;height:10px;margin:0 0 8px;accent-color:#5da96e}.fp-auto-progress[hidden]{display:none}";
document.head.append(style);
function addButton(){
 document.querySelectorAll(".mandala-card").forEach(card=>{
  const galleryIntro=document.querySelector("#catalog .mandala-intro strong");
  if(galleryIntro?.textContent.trim().startsWith("Färglägg, klipp ut och klä på"))return;
  if(card.querySelector(".fp-online-actions"))return;
  const links=card.querySelector(".mandala-links");if(!links)return;
  const heading=card.querySelector("h3");const title=heading?.textContent.trim()||"Färgläggningsbild";
  const thumb=card.querySelector("img");if(!thumb)return;
  const imageUrl=thumb.currentSrc||thumb.src;
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
 const castleConfig=TARGET.toLocaleLowerCase("sv").trim()==="fladdermusslottet"?window.FP_CASTLE_COLORING:null;
 const horseConfig=castleConfig|| (TARGET.toLocaleLowerCase("sv").trim()==="hästar under halloweenmånen"?window.FP_HORSE_COLORING:null);
 const back=document.createElement("div");back.className="fp-paint-back";back.innerHTML='<section class="fp-paint-dialog" role="dialog" aria-modal="true" aria-label="Måla online"><header class="fp-paint-head"><div><h2>🎨 Måla online</h2><p></p></div><button class="fp-paint-close" aria-label="Stäng">×</button></header><div class="fp-paint-tools"><button data-tool="fill" aria-pressed="true">🪣 Fyll</button><button data-tool="pen" aria-pressed="false">✏️ Penna</button><button data-tool="erase" aria-pressed="false">🧽 Sudd</button><select aria-label="Penselstorlek"><option value="5">● Liten</option><option value="14" selected>● Medium</option><option value="30">● Stor</option></select><button data-action="undo" disabled>↶ Ångra</button><button data-action="redo" disabled>↷ Gör om</button><button data-action="minus" aria-label="Zooma ut">−</button><button data-action="one">100%</button><button data-action="plus" aria-label="Zooma in">+</button><button data-action="reset">🗑️ Börja om</button>'+'<button data-action="auto">✨ Färglägg automatiskt</button>'+'<button data-action="save">💾 Spara bild</button></div><div class="fp-paint-palette" role="group" aria-label="Färgpalett"></div><div class="fp-paint-stage"><div class="fp-paint-sheet"><canvas class="fp-paint-layer"></canvas><canvas class="fp-line-layer"></canvas></div></div><div class="fp-paint-status">Välj färg och tryck på ett område. Två fingrar flyttar och zoomar. Dator: håll mellanslag och dra.</div></section>';
 back.querySelector(".fp-paint-head p").textContent=TARGET+" · Måla med färghink eller penna!";
 document.body.append(back);document.body.style.overflow="hidden";
 const $=s=>back.querySelector(s),dialog=$(".fp-paint-dialog"),stage=$(".fp-paint-stage"),sheet=$(".fp-paint-sheet"),paint=$(".fp-paint-layer"),lines=$(".fp-line-layer"),ctx=paint.getContext("2d",{willReadFrequently:true}),lctx=lines.getContext("2d"),undo=$('[data-action="undo"]'),redo=$('[data-action="redo"]');if(horseConfig||TARGET.toLocaleLowerCase("sv").trim()==="spöke vid det hemsökta huset")dialog.classList.add("fp-paint-ghost");
 let tool="fill",color="#ef4444",brush=14,acts=[],future=[],W=0,H=0,luma=null,zoom=1,tx=0,ty=0,space=false,active=null,pending=null,gesture=false,pinch=null;
 const autoButton=$('[data-action="auto"]'),autoProgress=document.createElement("progress"),status=$(".fp-paint-status");
 let autoRunning=false;
 let ghostReference=null,ghostReferencePixels=null,ghostOriginalInk=null,ghostPumpkinLightMap=null,ghostPumpkinLights=[];
 const getGhostReference=()=>new Promise((resolve,reject)=>{if(ghostReference?.complete&&ghostReference.naturalWidth){resolve(ghostReference);return}const ref=new Image();ref.onload=()=>{ghostReference=ref;resolve(ref)};ref.onerror=reject;const data=horseConfig?horseConfig.reference:window.FP_GHOST_REFERENCE_BASE64;if(!data){reject(new Error("Reference data missing"));return}ref.src="data:image/webp;base64,"+data});
 autoProgress.className="fp-auto-progress";autoProgress.max=1;autoProgress.value=0;autoProgress.hidden=true;
 status.setAttribute("aria-live","polite");if(autoButton)dialog.insertBefore(autoProgress,stage);

 const img=new Image();if(new URL(IMAGE,location.href).origin!==location.origin)img.crossOrigin="anonymous";img.onload=()=>{
   const prepareCanvas=()=>{
     const isGhostTarget=!!horseConfig||String(TARGET||"").toLocaleLowerCase("sv").trim()==="spöke vid det hemsökta huset";
     if(isGhostTarget&&ghostReference?.naturalWidth){W=ghostReference.naturalWidth;H=ghostReference.naturalHeight}
     else {const scale=Math.min(1,2200/Math.max(img.naturalWidth,img.naturalHeight),Math.sqrt(2.5e6/(img.naturalWidth*img.naturalHeight)));W=Math.max(1,Math.round(img.naturalWidth*scale));H=Math.max(1,Math.round(img.naturalHeight*scale))}
     [paint,lines].forEach(c=>{c.width=W;c.height=H});
     const src=document.createElement("canvas");src.width=W;src.height=H;const sctx=src.getContext("2d",{willReadFrequently:true});sctx.drawImage(img,0,0,W,H);
     const dat=sctx.getImageData(0,0,W,H),d=dat.data;luma=new Uint8Array(W*H);for(let i=0,j=0;i<d.length;i+=4,j++){const g=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000;luma[j]=g;const a=Math.max(0,Math.min(255,Math.round((245-g)*1.7)));d[i]=d[i+1]=d[i+2]=0;d[i+3]=a}
     lctx.putImageData(dat,0,0);if(isGhostTarget)ghostOriginalInk=lctx.getImageData(0,0,W,H);fit();window.addEventListener("resize",fit);
   };
   if(horseConfig||String(TARGET||"").toLocaleLowerCase("sv").trim()==="spöke vid det hemsökta huset")getGhostReference().then(prepareCanvas).catch(()=>{status.textContent="Färgreferensen kunde inte öppnas. Stäng och försök igen."});
   else prepareCanvas();
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
 function historyUI(){undo.disabled=autoRunning||!acts.length;redo.disabled=autoRunning||!future.length}
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
 async function findAutoRegions(isGhost=false){
   const scale=Math.min(1,(isGhost?Math.max(W,H):700)/Math.max(W,H)),RW=Math.max(1,Math.round(W*scale)),RH=Math.max(1,Math.round(H*scale));
   const reduced=new Uint8Array(RW*RH),stepX=W/RW,stepY=H/RH;
   for(let y=0;y<RH;y++){
     for(let x=0;x<RW;x++){
       const x0=Math.floor(x*stepX),x1=Math.min(W,Math.ceil((x+1)*stepX)),y0=Math.floor(y*stepY),y1=Math.min(H,Math.ceil((y+1)*stepY));
       let value=255;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++){const current=luma[sy*W+sx];if(current<value)value=current}
       reduced[y*RW+x]=value;
     }
     if(y%12===11){status.textContent="Hittar slutna färgområden… "+Math.round((y+1)/RH*100)+" %";await new Promise(resolve=>setTimeout(resolve,0));}
   }
   const total=RW*RH,seen=new Uint8Array(total),queue=new Uint32Array(total),regions=[];
   let visits=0;
   for(let start=0;start<total;start++){
     if(seen[start]||reduced[start]<220)continue;
     let head=0,tail=0,minX=RW,minY=RH,maxX=0,maxY=0,sumX=0,sumY=0,touchesEdge=false;
     seen[start]=1;queue[tail++]=start;
     while(head<tail){
       const i=queue[head++],y=(i/RW)|0,x=i-y*RW;
       sumX+=x;sumY+=y;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
       if(x===0||y===0||x===RW-1||y===RH-1)touchesEdge=true;
       let n;
       if(x>0&&(n=i-1,!seen[n]&&reduced[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(x<RW-1&&(n=i+1,!seen[n]&&reduced[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(y>0&&(n=i-RW,!seen[n]&&reduced[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(y<RH-1&&(n=i+RW,!seen[n]&&reduced[n]>=220)){seen[n]=1;queue[tail++]=n}
       if(++visits%24000===0){status.textContent="Hittar slutna färgområden…";await new Promise(resolve=>setTimeout(resolve,0));}
     }
     if((isGhost||!touchesEdge)&&tail>=(isGhost?3:9)&&(isGhost||tail<total*.45))regions.push({pixels:queue.slice(0,tail),minX,minY,maxX,maxY,area:tail,cx:sumX/tail/RW,cy:sumY/tail/RH,scaleX:W/RW,scaleY:H/RH});
   }
   regions.sort((a,b)=>b.area-a.area);if(!isGhost)regions.length=Math.min(regions.length,160);
   regions.sort((a,b)=>a.minY-b.minY||a.minX-b.minX);
   return regions;
 }
 function ghostAlignedReference(){
   const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d",{willReadFrequently:true});
   g.fillStyle="#fff";g.fillRect(0,0,W,H);
   g.drawImage(ghostReference,0,0,W,H);
   return g.getImageData(0,0,W,H).data;
 }
 async function findGhostRegions(){
   const total=W*H,barrier=new Uint8Array(total),labels=new Int32Array(total),queue=new Uint32Array(total),regions=[];
   const pause=async text=>{status.textContent=text;await new Promise(resolve=>setTimeout(resolve,0))};
   // Close one-pixel gaps for segmentation only. The displayed line drawing
   // is never changed, erased or replaced.
   for(let y=0;y<H;y++){
     for(let x=0;x<W;x++){
       const i=y*W+x;
       barrier[i]=luma[i]<220||(x>0&&luma[i-1]<220)||(x<W-1&&luma[i+1]<220)||(y>0&&luma[i-W]<220)||(y<H-1&&luma[i+W]<220)?1:0;
     }
     if(y%80===79)await pause("Förbereder originalets slutna färgområden…");
   }
   if(castleConfig?.closures){
     // Bridge only small breaks between original contour endpoints. These
     // segmentation barriers never alter the displayed original line layer.
     for(const [ax,ay,bx,by] of castleConfig.closures){
       const x0=ax/castleConfig.sourceWidth*W,y0=ay/castleConfig.sourceHeight*H,x1=bx/castleConfig.sourceWidth*W,y1=by/castleConfig.sourceHeight*H,steps=Math.ceil(Math.hypot(x1-x0,y1-y0)*2);
       for(let n=0;n<=steps;n++){const x=Math.round(x0+(x1-x0)*n/Math.max(1,steps)),y=Math.round(y0+(y1-y0)*n/Math.max(1,steps));for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H)barrier[(y+dy)*W+x+dx]=1}
     }
   }
   if(castleConfig?.bridgeRuns){
     // Sparse contour repairs derived from the original line drawing. Only
     // its leaking background is closed; existing enclosed areas are kept.
     for(const [row,left,right] of castleConfig.bridgeRuns){
       const y=Math.round(row/castleConfig.bridgeHeight*H),x0=Math.round(left/castleConfig.bridgeWidth*W),x1=Math.round(right/castleConfig.bridgeWidth*W);
       if(y>=0&&y<H)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++)barrier[y*W+x]=1;
     }
   }
   let visits=0;
   for(let start=0;start<total;start++){
     if(barrier[start]||labels[start])continue;
     const id=regions.length+1;let head=0,tail=1,sumX=0,sumY=0;queue[0]=start;labels[start]=id;
     while(head<tail){
       const i=queue[head++],y=(i/W)|0,x=i-y*W;sumX+=x;sumY+=y;
       const add=n=>{if(!barrier[n]&&!labels[n]){labels[n]=id;queue[tail++]=n}};
       if(x>0)add(i-1);if(x<W-1)add(i+1);if(y>0)add(i-W);if(y<H-1)add(i+W);
       if(++visits%60000===0)await pause("Hittar originalets färgområden…");
     }
     if(tail<3){for(let j=0;j<tail;j++)labels[queue[j]]=-1;continue}
     regions.push({id,area:tail,cx:sumX/tail/W,cy:sumY/tail/H,scaleX:1,scaleY:1});
   }
   if(!regions.length)return [];
   // Extend each fill beneath the original ink to avoid pale halos. Each
   // pixel belongs to one original region; the black line layer stays on top.
   let head=0,tail=0;
   for(let i=0;i<total;i++){if(labels[i]>0)queue[tail++]=i;else labels[i]=0}
   while(head<tail){
     const i=queue[head++],id=labels[i],y=(i/W)|0,x=i-y*W;
     const add=n=>{if(!labels[n]){labels[n]=id;queue[tail++]=n}};
     if(x>0)add(i-1);if(x<W-1)add(i+1);if(y>0)add(i-W);if(y<H-1)add(i+W);
     if(head%100000===0)await pause("Förbereder färgfyllning fram till konturerna…");
   }
   const counts=new Uint32Array(regions.length+1),offsets=new Uint32Array(regions.length+1);
   for(let i=0;i<total;i++)counts[labels[i]]++;
   for(const r of regions){r.pixels=new Uint32Array(counts[r.id]);r.area=counts[r.id];r.minX=W;r.minY=H;r.maxX=r.maxY=0}
   for(let i=0;i<total;i++){
     const id=labels[i],r=regions[id-1],y=(i/W)|0,x=i-y*W;r.pixels[offsets[id]++]=i;
     if(x<r.minX)r.minX=x;if(x>r.maxX)r.maxX=x;if(y<r.minY)r.minY=y;if(y>r.maxY)r.maxY=y;
   }
   if(castleConfig)setCastleColorHints(regions,labels);else if(horseConfig)setHorseColorHints(regions,labels);else setGhostColorHints(regions,labels);
   return regions.sort((a,b)=>a.minY-b.minY||a.minX-b.minX);
 }
 function setCastleColorHints(regions,labels){
   const inside=(x,y,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])yes=!yes;return yes};
   for(const r of regions){
     const x=r.cx*castleConfig.sourceWidth,y=r.cy*castleConfig.sourceHeight;
     if(r.area>200000)r.hint="background";
     for(const zone of castleConfig.zones){
       if(r.area>zone.limit)continue;
       const hit=zone.poly?inside(x,y,zone.poly):((x-zone.ellipse[0])/zone.ellipse[2])**2+((y-zone.ellipse[1])/zone.ellipse[3])**2<1;
       if(hit)r.hint=zone.role;
     }
   }
   setHorseColorHints(regions,labels);
   for(const r of regions){
     const x=r.cx*castleConfig.sourceWidth,y=r.cy*castleConfig.sourceHeight;
     if(r.area<2500&&castleConfig.windowBoxes.some(([x0,y0,x1,y1])=>x>=x0&&x<=x1&&y>=y0&&y<=y1))r.hint="glass";
   }
 }
 function setHorseColorHints(regions,labels){
   // Color-family anchors use the original drawing's coordinates. Only the
   // original's closed regions define masks; reference contours are never drawn.
   const {sourceWidth,sourceHeight,seeds,limits}=horseConfig;
   for(const [sx,sy,role,radius] of seeds){
     const x=Math.round(sx/sourceWidth*W),y=Math.round(sy/sourceHeight*H),rx=Math.max(1,Math.round(radius/sourceWidth*W)),ry=Math.max(1,Math.round(radius/sourceHeight*H));
     for(let yy=Math.max(0,y-ry);yy<=Math.min(H-1,y+ry);yy++)for(let xx=Math.max(0,x-rx);xx<=Math.min(W-1,x+rx);xx++){
       if(((xx-x)/rx)**2+((yy-y)/ry)**2>1)continue;
       const region=regions[labels[yy*W+xx]-1];if(region&&region.area<=limits[role])region.hint=role;
     }
   }
 }
 function setGhostColorHints(regions,labels){
   // Locations belong to the original 1054 x 1492 drawing, not the colored
   // reference. Hints keep small shifted features in the right color family.
   const seeds=[
     [820,190,"moon",1],[440,620,"ghost",1],[365,693,"pink",2],[510,739,"pink",2],[432,738,"red",2],
     [400,640,"white",3],[493,687,"white",3],
     [725,85,"bat",10],[852,135,"bat",10],[791,148,"bat",7],[908,235,"bat",8],[977,225,"bat",8],[940,265,"bat",6],[891,247,"bat",7],[999,219,"bat",6],
     [755,123,"bat",1],[879,134,"bat",1],[1008,193,"bat",1],
     [330,364,"bat",7],[421,374,"bat",7],[370,392,"bat",6],[710,204,"bat",4],
     [566,109,"cloud",8],[623,125,"cloud",8],[1020,61,"cloud",8],[1040,120,"cloud",6],[1027,350,"cloud",6],
     [495,370,"wall",3],[490,440,"wall",3],[461,524,"wall",4],[544,614,"wall",4],
     [490,184,"roof",6],[518,210,"roof",7],[613,244,"roof",7],[640,272,"roof",8],[752,378,"roof",6],[871,501,"roof",6],[947,529,"roof",6],[443,489,"roof",6],[531,559,"roof",6],
     [509,319,"glass",5],[532,320,"glass",5],[513,352,"glass",5],[534,352,"glass",5],
     [630,323,"glass",5],[646,324,"glass",5],[627,353,"glass",5],[645,353,"glass",5],
     [613,456,"glass",5],[632,456,"glass",5],[608,485,"glass",5],[633,490,"glass",5],
     [752,479,"glass",5],[779,488,"glass",5],[951,617,"glass",5],[977,638,"glass",5],[950,656,"glass",5],[977,675,"glass",5],
     [578,809,"glass",5],[594,814,"glass",5],[580,842,"glass",5],[596,842,"glass",5],[570,800,"glass",3],[590,800,"glass",3],[570,831,"glass",3],[590,831,"glass",3],[451,529,"glass",4],
     [939,805,"glass",5],[959,816,"glass",5],[941,840,"glass",5],[966,840,"glass",5],[1027,855,"glass",4],[1045,856,"glass",4],
     [120,82,"leaf",7],[445,79,"leaf",7],[437,150,"leaf",7],[191,195,"leaf",5],[360,245,"leaf",7],
     [176,290,"leaf",7],[80,325,"leaf",6],[224,428,"leaf",7],[391,464,"leaf",6],[353,565,"leaf",6],
     [212,594,"leaf",6],[132,645,"leaf",5],[132,710,"leaf",5],[114,779,"leaf",6],[152,789,"leaf",5],
     [40,816,"leaf",6],[1030,407,"leaf",4],[1027,533,"leaf",4],
     [87,1340,"cream",5],[84,1296,"red",7],[922,1411,"cream",5],[932,1375,"red",7]
   ];
   const limits={moon:300000,ghost:300000,pink:2400,red:6500,white:2400,bat:15000,cloud:50000,wall:45000,roof:22000,glass:2600,leaf:5500,cream:6000};
   for(const [sx,sy,role,radius] of seeds){
     const x=Math.round(sx/1054*W),y=Math.round(sy/1492*H),rx=Math.max(1,Math.round(radius/1054*W)),ry=Math.max(1,Math.round(radius/1492*H));
     for(let yy=Math.max(0,y-ry);yy<=Math.min(H-1,y+ry);yy++)for(let xx=Math.max(0,x-rx);xx<=Math.min(W-1,x+rx);xx++){
       if(((xx-x)/rx)**2+((yy-y)/ry)**2>1)continue;
       const region=regions[labels[yy*W+xx]-1];if(region&&region.area<=limits[role])region.hint=role;
     }
   }
 }
 function ghostSample(r,g,b){
   const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=0;
   if(delta){if(max===r)h=((g-b)/delta+6)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h/=6}
   return {r,g,b,h,s:max?delta/max:0,v:max/255,l:r*.299+g*.587+b*.114};
 }
 function ghostShades(samples,forced=false){
   let selected=samples;
   if(!forced){
     const histogram=new Float64Array(24);let neutral=0;
     for(const c of samples){if(c.v<.09)continue;const w=.2+.8*Math.sqrt(c.v);if(c.s<.16)neutral+=w;else histogram[Math.floor(c.h*24)%24]+=w}
     let best=0,score=-1;
     for(let i=0;i<24;i++){const v=histogram[i]+.7*(histogram[(i+23)%24]+histogram[(i+1)%24]);if(v>score){score=v;best=i}}
     selected=samples.filter(c=>{if(c.v<.09)return false;if(neutral>score)return c.s<.16;const bin=Math.floor(c.h*24)%24,d=Math.abs(bin-best);return c.s>=.16&&Math.min(d,24-d)<=1});
   }
   if(!selected.length)selected=samples;
   if(!selected.length)return [[210,190,160],[225,210,185],[245,235,215]];
   selected.sort((a,b)=>a.l-b.l);
   return [.08,.60,.97].map(q=>{
     const center=Math.min(selected.length-1,Math.floor(q*selected.length)),radius=Math.max(1,Math.floor(selected.length*.035));
     let r=0,g=0,b=0,n=0;
     for(let i=Math.max(0,center-radius);i<=Math.min(selected.length-1,center+radius);i++){const c=selected[i];r+=c.r;g+=c.g;b+=c.b;n++}
     return [r/n,g/n,b/n];
   });
 }
 function ghostColorPalettes(){
   if(horseConfig)return horseConfig.palettes;
   const boxes={
     moon:[.69,.025,.83,.14],ghost:[.29,.49,.43,.60],pink:[.344,.414,.369,.435],red:[.39,.451,.417,.469],
     bat:[.714,.035,.752,.082],wall:[.55,.28,.575,.32],roof:[.493,.084,.529,.124],
     cloud:[.89,.14,.98,.22],glass:[.50,.17,.54,.25],leaf:[.37,.10,.48,.20],white:[.28,.43,.36,.55],cream:[.04,.91,.09,.94]
   },palettes={};
   for(const [role,box] of Object.entries(boxes)){
     const samples=[];
     for(let y=Math.floor(box[1]*H);y<Math.floor(box[3]*H);y+=2)for(let x=Math.floor(box[0]*W);x<Math.floor(box[2]*W);x+=2){
       const k=(y*W+x)*4,c=ghostSample(ghostReferencePixels[k],ghostReferencePixels[k+1],ghostReferencePixels[k+2]);
       if(role==="leaf"&&!(c.h<.18&&c.s>.4&&c.v>.25))continue;
       if(role==="glass"&&!(c.h>.04&&c.h<.18&&c.s>.4&&c.v>.6))continue;
       if(role==="cloud"&&!(c.h>.5&&c.h<.75&&c.s<.6&&c.v>.25))continue;
       if(role==="white"&&!(c.s<.18&&c.v>.8))continue;
       if(role==="bat"&&!(c.v<.35))continue;
       if(c.v>.06)samples.push(c);
     }
     palettes[role]=ghostShades(samples,true);
   }
   return palettes;
 }
 function ghostRegionShades(region,palettes){
   if(region.hint&&palettes[region.hint])return palettes[region.hint];
   const samples=[],stride=Math.max(1,Math.floor(region.pixels.length/1600));
   for(let i=0;i<region.pixels.length;i+=stride){const k=region.pixels[i]*4;samples.push(ghostSample(ghostReferencePixels[k],ghostReferencePixels[k+1],ghostReferencePixels[k+2]))}
   return ghostShades(samples);
 }
 function prepareGhostPumpkinLights(){
   ghostPumpkinLightMap=new Uint8Array(W*H);ghostPumpkinLights=[];
   // Only the carved facial openings, in original drawing coordinates.
   const faces=[[75,1155,244,1275],[275,1257,379,1335],[798,1205,938,1325],[704,1292,793,1370],[929,1299,1038,1392],[864,984,921,1030],[804,1035,856,1081]];
   for(const box of faces){
     const x0=Math.round(box[0]/1054*W),y0=Math.round(box[1]/1492*H),x1=Math.round(box[2]/1054*W),y1=Math.round(box[3]/1492*H),width=x1-x0,height=y1-y0;
     const distance=new Uint16Array(width*height),seen=new Uint8Array(width*height),queue=new Uint32Array(width*height),parts=[];
     for(let y=0;y<height;y++)for(let x=0;x<width;x++){
       const i=y*width+x;if(luma[(y+y0)*W+x+x0]>=110)continue;
       distance[i]=Math.min(x?distance[i-1]+1:1,y?distance[i-width]+1:1);
     }
     for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
       const i=y*width+x;if(distance[i])distance[i]=Math.min(distance[i],x<width-1?distance[i+1]+1:1,y<height-1?distance[i+width]+1:1);
     }
     for(let start=0;start<distance.length;start++){
       if(seen[start]||distance[start]<3)continue;
       let head=0,tail=1,minX=width,minY=height,maxX=0,maxY=0;queue[0]=start;seen[start]=1;
       while(head<tail){
         const i=queue[head++],y=(i/width)|0,x=i-y*width;
         minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
         const add=n=>{if(!seen[n]&&distance[n]>=3){seen[n]=1;queue[tail++]=n}};
         if(x)add(i-1);if(x<width-1)add(i+1);if(y)add(i-width);if(y<height-1)add(i+width);
       }
       if(tail>=3)parts.push({pixels:queue.slice(0,tail),minX,minY,maxX,maxY});
     }
     // Thin pumpkin grooves are not lights. Retain only eyes, nose and mouth.
     parts.sort((a,b)=>b.pixels.length-a.pixels.length);
     for(const part of parts.slice(0,4)){
       const id=ghostPumpkinLights.length+1;
       ghostPumpkinLights.push({cx:x0+(part.minX+part.maxX)/2,cy:y0+(part.minY+part.maxY)/2,rx:(part.maxX-part.minX)/2+1,ry:(part.maxY-part.minY)/2+1});
       for(const i of part.pixels){const y=(i/width)|0,x=i-y*width;ghostPumpkinLightMap[(y+y0)*W+x+x0]=id}
     }
   }
 }
 function ghostWarmLight(t){
   t=Math.max(0,Math.min(1,t));
   const low=[255,125,18],mid=[255,217,76],high=[255,255,220],a=t<.5?low:mid,b=t<.5?mid:high,mix=t<.5?t*2:(t-.5)*2;
   return [a[0]+(b[0]-a[0])*mix,a[1]+(b[1]-a[1])*mix,a[2]+(b[2]-a[2])*mix];
 }
 function paintGhostRegion(region){
   if(!region.shades)return;
   const width=region.maxX-region.minX+1,height=region.maxY-region.minY+1,mask=document.createElement("canvas");
   mask.width=width;mask.height=height;
   const maskCtx=mask.getContext("2d"),image=maskCtx.createImageData(width,height),data=image.data,stops=region.shades;
   let cutout=null;
   for(const index of region.pixels){
     const x=index%W-region.minX,y=((index/W)|0)-region.minY,k=(y*width+x)*4;
     const t=Math.max(0,Math.min(1,.55+.50*(x/width-.5)-.60*(y/height-.5))),a=t<.5?stops[0]:stops[1],b=t<.5?stops[1]:stops[2],mix=t<.5?t*2:(t-.5)*2;
     data[k]=a[0]+(b[0]-a[0])*mix;data[k+1]=a[1]+(b[1]-a[1])*mix;data[k+2]=a[2]+(b[2]-a[2])*mix;data[k+3]=255;
     if(region.hint==="glass"){
       const light=ghostWarmLight(1-.65*Math.hypot((x/Math.max(1,width-1)-.5)*2,(y/Math.max(1,height-1)-.55)*1.5));
       data[k]=light[0];data[k+1]=light[1];data[k+2]=light[2];
     }
     if(castleConfig){
       const gx=x+region.minX,gy=y+region.minY;
       if(region.hint==="background"){
         const stops=castleConfig.background,t=gy/H;
         let a=stops[0],b=stops[stops.length-1];
         for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){a=stops[i-1];b=stops[i];break}
         const k=Math.max(0,Math.min(1,(t-a[0])/Math.max(.0001,b[0]-a[0])));
         for(let c=0;c<3;c++)data[(y*width+x)*4+c]=a[c+1]+(b[c+1]-a[c+1])*k;
       }
       if(region.hint==="wall"||region.hint==="rock"||region.hint==="path"){
         for(const glow of castleConfig.glows){
           const dx=(gx/W-glow[0])/glow[2],dy=(gy/H-glow[1])/glow[3],d=Math.hypot(dx,dy);
           if(d>=1)continue;
           const mix=(1-d)**2*glow[4];
           data[k]+=(255-data[k])*mix;data[k+1]+=(180-data[k+1])*mix;data[k+2]+=(65-data[k+2])*mix;
         }
       }
     }
     const lightId=ghostPumpkinLightMap?.[index];
     if(lightId){
       const p=ghostPumpkinLights[lightId-1],light=ghostWarmLight(1-.72*Math.hypot((x+region.minX-p.cx)/p.rx,(y+region.minY-p.cy)/p.ry));
       data[k]=light[0];data[k+1]=light[1];data[k+2]=light[2];
       if(!cutout)cutout=maskCtx.createImageData(width,height);cutout.data[k+3]=255;
     }
   }
   maskCtx.putImageData(image,0,0);
   ctx.drawImage(mask,region.minX,region.minY);
   if(cutout){
     // Remove only ink inside the carved openings; retain their black edges.
     maskCtx.putImageData(cutout,0,0);lctx.save();lctx.globalCompositeOperation="destination-out";lctx.drawImage(mask,region.minX,region.minY);lctx.restore();
   }
 }
 function paintAutoRegion(region,fillColor){
   const width=region.maxX-region.minX+1,height=region.maxY-region.minY+1,mask=document.createElement("canvas");
   mask.width=width;mask.height=height;
   const maskCtx=mask.getContext("2d"),image=maskCtx.createImageData(width,height),data=image.data;
   const red=parseInt(fillColor.slice(1,3),16),green=parseInt(fillColor.slice(3,5),16),blue=parseInt(fillColor.slice(5,7),16),canvasW=Math.round(W/region.scaleX);
   for(const index of region.pixels){const x=index%canvasW-region.minX,y=((index/canvasW)|0)-region.minY,k=(y*width+x)*4;data[k]=red;data[k+1]=green;data[k+2]=blue;data[k+3]=255}
   maskCtx.putImageData(image,0,0);
   ctx.drawImage(mask,region.minX*region.scaleX,region.minY*region.scaleY,width*region.scaleX,height*region.scaleY);
 } async function runAutoColor(){
   if(!autoButton||autoRunning||!W)return;
   if(acts.length&&!confirm("Automatisk färgläggning börjar från en tom bild. Vill du rensa din målning och fortsätta?"))return;
   acts=[];future=[];ctx.clearRect(0,0,W,H);if(ghostOriginalInk)lctx.putImageData(ghostOriginalInk,0,0);lines.style.opacity="";autoRunning=true;historyUI();autoButton.disabled=true;
   autoProgress.hidden=false;autoProgress.value=0;sheet.style.pointerEvents="none";toolSet("fill");
   const isGhost=!!horseConfig||TARGET.toLocaleLowerCase("sv").trim()==="spöke vid det hemsökta huset";
   let plan;
   if(isGhost){
     status.textContent="Hämtar färgreferensen…";
     try{await getGhostReference()}catch{autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;sheet.style.pointerEvents="";status.textContent="Färgreferensen kunde inte öppnas. Försök igen.";return}
     ghostReferencePixels=ghostAlignedReference();
     const regions=await findGhostRegions(),palettes=ghostColorPalettes();
     if(!horseConfig)prepareGhostPumpkinLights();
     for(const region of regions)region.shades=ghostRegionShades(region,palettes);
     plan=regions.map(region=>({type:"ghostRegion",region}));
   }else{
     status.textContent="Hittar slutna färgområden…";
     await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
     const regions=await findAutoRegions(),paletteColors=autoPalette(TARGET),guide=pokemonGuide(TARGET);
     plan=regions.map(region=>({type:"region",region,color:autoRegionColor(region,regions,paletteColors,guide,TARGET)})).filter(step=>step.color);
   }
   if(!plan.length){
     if(isGhost)lines.style.opacity="";
     autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;sheet.style.pointerEvents="";
     status.textContent="Jag hittade inga tydligt slutna områden i bilden. Du kan färglägga den med hink eller penna.";
     return;
   }
   autoProgress.max=plan.length;
   for(let i=0;i<plan.length;i++){
     if(!back.isConnected){autoRunning=false;return}
     const step=plan[i];
     if(step.type==="region"){
       paintAutoRegion(step.region,step.color);
       acts.push({type:"region",region:step.region,color:step.color});
     }else if(step.type==="ghostRegion"){
       paintGhostRegion(step.region);
       acts.push({type:"ghostRegion",region:step.region});
     }
     future=[];autoProgress.value=i+1;
     status.textContent="Timelapse: färglägger "+TARGET+", steg "+(i+1)+" av "+plan.length+"…";historyUI();
     await new Promise(resolve=>setTimeout(resolve,isGhost?Math.max(8,Math.min(30,18000/plan.length)):115));
   }
   // Keep the actual region fills as the final result. Never swap in a photo.
   autoRunning=false;sheet.style.pointerEvents="";historyUI();
   status.textContent=isGhost?"Klart! "+TARGET+" är färglagd enligt färgreferensen. Du kan fortsätta måla eller spara bilden.":"Klart! "+TARGET+" är färglagd. Du kan fortsätta måla eller spara bilden.";
 }
 if(autoButton)autoButton.addEventListener("click",runAutoColor);
 function redraw(){lines.style.opacity="";if(ghostOriginalInk)lctx.putImageData(ghostOriginalInk,0,0);ctx.clearRect(0,0,W,H);for(const a of acts){if(a.type==="ghostRegions"){for(const region of a.regions)paintGhostRegion(region)}else if(a.type==="ghostRegion"){paintGhostRegion(a.region)}else if(a.type==="fill"){const old=color;color=a.color;fillRegion(ctx,a.x,a.y);color=old}else if(a.type==="region"){paintAutoRegion(a.region,a.color)}else drawStroke(ctx,a)}historyUI()}
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
 const undoOne=()=>{if(autoRunning)return;if(acts.length)future.push(acts.pop());redraw()},redoOne=()=>{if(autoRunning)return;if(future.length)acts.push(future.pop());redraw()};
 undo.onclick=undoOne;redo.onclick=redoOne;
 back.querySelector('[data-action="minus"]').onclick=()=>setZoom(zoom-.25);back.querySelector('[data-action="plus"]').onclick=()=>setZoom(zoom+.25);back.querySelector('[data-action="one"]').onclick=()=>setZoom(1);
 stage.addEventListener("wheel",e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();setZoom(zoom+(e.deltaY<0?.15:-.15))},{passive:false});
 back.querySelector('[data-action="reset"]').onclick=()=>{if(autoRunning)return;if(confirm("Vill du radera hela målningen och börja om?")){acts=[];future=[];autoProgress.hidden=true;autoProgress.value=0;if(autoButton)autoButton.disabled=false;status.textContent="Välj färg och tryck på ett område. Två fingrar flyttar och zoomar. Dator: håll mellanslag och dra.";redraw()}};
 back.querySelector('[data-action="save"]').onclick=()=>{if(!W)return;const out=document.createElement("canvas");const ghostTarget=dialog.classList.contains("fp-paint-ghost");out.width=ghostTarget?W:img.naturalWidth;out.height=ghostTarget?H:img.naturalHeight;const c=out.getContext("2d");c.drawImage(paint,0,0,out.width,out.height);c.drawImage(lines,0,0,out.width,out.height);out.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="min-farglagda-"+TARGET.toLocaleLowerCase("sv").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},"image/png")};
 function close(){window.removeEventListener("resize",fit);window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);back.remove();document.body.style.overflow="";addButton()}
 back.querySelector(".fp-paint-close").onclick=close;back.addEventListener("click",e=>{if(e.target===back)close()});const keydown=e=>{if(e.code==="Space"){space=true;if(e.target===document.body||e.target===back)e.preventDefault()}if(e.key==="Escape")close();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redoOne():undoOne()}};const keyup=e=>{if(e.code==="Space")space=false};window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);back.addEventListener("keydown",e=>{if(e.code==="Space")e.preventDefault()});back.tabIndex=-1;back.focus();
}
})();




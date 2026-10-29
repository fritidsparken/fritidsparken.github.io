export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const LEVELS=[
 {name:'Klassisk',tag:'Din första strike',hint:'Sikta lite bredvid den främsta käglan.',color:'#ffcb75',sky:'#182941',kind:'classic'},
 {name:'Rampen',tag:'Redo för ett litet hopp?',hint:'Den lilla rampen ger klotet luft under vingarna.',color:'#ffaf91',sky:'#302541',kind:'ramp'},
 {name:'Rörliga hinder',tag:'Allt handlar om tajming',hint:'Vänta tills de mjuka hindren lämnar en öppning.',color:'#a7e3ab',sky:'#183c39',kind:'moving'},
 {name:'Isbanan',tag:'Halt, halare, strike!',hint:'På isen glider klotet längre. Skruven är svagare.',color:'#9de8fa',sky:'#16364e',kind:'ice'},
 {name:'Neon Bowling',tag:'Lys upp bowlinghallen',hint:'Samma bowling, helt ny nattklubbskänsla.',color:'#dd9bff',sky:'#130d30',kind:'neon'},
 {name:'Flipperbanan',tag:'Studsa till seger',hint:'De runda stötfångarna ger klotet extra fart.',color:'#ff9cbd',sky:'#34213a',kind:'bumpers'},
 {name:'Brobanan',tag:'Håll dig på bron',hint:'Mitt på banan finns inga räcken. Sikta noga!',color:'#b5eab8',sky:'#174347',kind:'bridge'},
 {name:'Snurran',tag:'Hitta din lucka',hint:'Kasta när den roterande armen pekar längs banan.',color:'#ffbc7d',sky:'#30273d',kind:'spinner'},
 {name:'Megarampen',tag:'Ta bowling till nya höjder',hint:'Ta fart! Rampen skickar klotet mot käglorna.',color:'#a6b9ff',sky:'#24234c',kind:'mega'},
 {name:'Crazy Bowling',tag:'Den stora finalen',hint:'Välj rampen i mitten eller vägen runt. Tajma snurran!',color:'#ffd873',sky:'#301c46',kind:'final'}
];
export const BALLS=[
 {name:'Standard',color:'#8259ff',cost:0,mass:5,spin:1,bounce:.45,drag:.06,text:'En pålitlig allroundfavorit.'},
 {name:'Tungviktaren',color:'#4b758c',cost:3,mass:7,spin:.55,bounce:.35,drag:.08,text:'Mer tyngd. Lite mindre skruv.'},
 {name:'Super Spin',color:'#f65aac',cost:6,mass:4.5,spin:1.6,bounce:.45,drag:.06,text:'För dig som gillar svängar.'},
 {name:'Studsbollen',color:'#7ae299',cost:10,mass:4,spin:1,bounce:.85,drag:.06,text:'Extra studs mot stötfångarna.'},
 {name:'Isklotet',color:'#79ddff',cost:16,mass:5,spin:.85,bounce:.45,drag:.015,text:'Glider lätt och behåller farten.'},
 {name:'Eldklotet',color:'#ff773e',cost:24,mass:5,spin:1.15,bounce:.5,drag:.05,text:'Glödande stil. Brännande strikes!'}
];
// Full ten-frame tenpin rules, including all tenth-frame bonus-rack cases.
export class Match {
 constructor(){this.frames=[[]];this.done=false;}
 get frame(){return this.frames.length-1;}
 get rack(){const f=this.frames.at(-1);if(this.frame<9)return f.length?10-f[0]:10;if(!f.length||f[0]===10&&(f.length===1||f[1]===10)||f.length===2&&f[0]+f[1]===10)return 10;return 10-f.at(-1);}
 add(n){if(this.done)throw Error('Series finished');if(!Number.isInteger(n)||n<0||n>this.rack)throw Error('Invalid pin count');let f=this.frames.at(-1);f.push(n);if(this.frame<9){if(n===10||f.length===2)this.frames.push([]);}else if(f.length===2&&f[0]+f[1]<10||f.length===3)this.done=true;return this;}
 scores(){let total=0;const rolls=this.frames.flat();let offset=0;return this.frames.map((f,i)=>{let score=null;if(i===9){if(this.done)score=f.reduce((a,b)=>a+b,0);}else if(f[0]===10){if(rolls.length>=offset+3)score=10+rolls[offset+1]+rolls[offset+2];}else if(f.length===2){if(f[0]+f[1]===10){if(rolls.length>offset+2)score=10+rolls[offset+2];}else score=f[0]+f[1];}offset+=f.length;if(score===null)return null;total+=score;return total;});}
 get total(){return this.scores().filter(v=>v!==null).at(-1)||0;}
 get strikes(){return this.frames.reduce((n,f,i)=>n+Number(f[0]===10)+(i===9?Number(f[0]===10&&f[1]===10)+Number(f[2]===10&&(f[0]!==10||f[1]===10)):0),0);}
 get spares(){return this.frames.filter(f=>f[0]!==10&&f.length>=2&&f[0]+f[1]===10).length+Number(this.frames[9]?.[0]===10&&this.frames[9]?.[1]!==10&&this.frames[9]?.[1]+this.frames[9]?.[2]===10);}
}
export const starsFor=score=>score>=120?3:score>=60?2:1;
export function cleanSave(raw){const d=raw&&typeof raw==='object'?raw:{};const best=Array.from({length:10},(_,i)=>clamp(Math.floor(Number(d.best?.[i])||0),0,300));const stars=Array.from({length:10},(_,i)=>clamp(Math.floor(Number(d.stars?.[i])||0),0,3));let unlocked=clamp(Math.floor(Number(d.unlocked)||0),0,9);const total=stars.reduce((a,b)=>a+b,0);let selected=clamp(Math.floor(Number(d.selected)||0),0,5);if(BALLS[selected].cost>total)selected=0;return {best,stars,unlocked,selected,sound:d.sound!==false};}
export function finishLevel(save,level,score){save.best[level]=Math.max(save.best[level],score);save.stars[level]=Math.max(save.stars[level],starsFor(score));save.unlocked=Math.max(save.unlocked,Math.min(9,level+1));return save;}

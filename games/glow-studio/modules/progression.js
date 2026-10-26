export const palettes=[['Ros','#dc688f',1],['Bär','#a34367',1],['Lavendel','#b39ce0',1],['Hav','#5b9ac1',1],['Salvia','#72ad96',1],['Guld','#ddbc6d',1],['Pärla','#f0d4bf',1],['Midnatt','#343e72',2],['Korall','#ef987d',3],['Orkidé','#cc69cb',5],['Isblå','#aad9e9',8],['Koppar','#ba764d',10]];
export const finishes=[['gloss','Blank',1],['matt','Matt',1],['metallic','Metallic',2],['pearl','Pärlemor',3],['holo','Holografisk',5]];
export const levelFor=xp=>1+Math.floor(Math.max(0,xp)/150);
export function studioFor(xp){const l=levelFor(xp);return l>=20?{name:'VIP Studio',color:0x433850}:l>=10?{name:'Fashion Studio',color:0x85667d}:l>=5?{name:'Beauty Salon',color:0x5d7b89}:{name:'Lilla studion',color:0x526b60};}
export function unlocksBetween(before,after){const a=levelFor(before),b=levelFor(after);return[...palettes,...finishes].filter(x=>x[2]>a&&x[2]<=b).map(x=>x[1].startsWith('#')?x[0]:x[1]);}
export function rewardFor({face,nails,colors,tools}){if(face<4||nails<1)return 0;return 60+Math.min(30,colors*5)+Math.min(25,nails*5)+Math.min(15,tools*3);}

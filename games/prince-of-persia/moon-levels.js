"use strict";
// Walk lines and hazard coordinates share the palace simulation's 1672 × 941 space.
const chapters = [
  {name:'Månskärans tröskel',hint:'Hoppa över brotten. När kedjan rycker är kuben på väg ned.', floors:[[0,445,654],[545,1045,654],[1145,1672,644]], traps:[['stone',760,1,72,48]], cubes:[321,1380]},
  {name:'Den blå cisternens djup',hint:'Läs vattenstrålarna och ta sats före kanten.', floors:[[0,422,667],[530,922,646],[1034,1380,637],[1454,1672,637]], traps:[['jet',705,1,56,111],['hatch',1210,2,64,0]], cubes:[300]},
  {name:'Kedjornas smedja',hint:'Locka ned pressarna och spring när kedjan drar upp dem.', floors:[[0,571,648],[686,1092,629],[1209,1672,641]],traps:[['saw',940,1,60,65]],cubes:[338,775,1420]},
  {name:'Trädgårdarna ovan molnen',hint:'Servicebron ger en övre väg förbi taggarna.', floors:[[0,457,677],[547,1070,657],[1170,1672,663]],extras:[[315,485,587],[536,797,551],[855,1090,556],[1140,1280,578]],traps:[['spikes',830,1,61,117],['hatch',1400,2,72,0]],cubes:[252]},
  {name:'Prismornas passage',hint:'Sågarna går fram och tillbaka. Vänta vid den ljusa kanten.', floors:[[0,432,645],[547,923,632],[1042,1353,612],[1455,1672,612]],traps:[['saw',735,1,64,72],['spikes',1225,2,55,98]],cubes:[296]},
  {name:'Klockornas djup',hint:'Ta höjd före nästa avsats. Andra trycket ger ett högre hopp.', floors:[[0,452,690],[548,885,658],[996,1288,635],[1396,1672,612]],traps:[['jet',682,1,50,100],['hatch',1120,2,64,0]],cubes:[275,1516]},
  {name:'Himlens sluss',hint:'Slussen öppnas vid spaken. Håll dig framför flodvågen.', floors:[[0,485,650],[595,1048,647],[1168,1672,639]],traps:[['hatch',812,1,68,0]],cubes:[1395],surge:true},
  {name:'Tidvattnets hjärta',hint:'Läs varje mekanism innan du lämnar nästa fäste.', floors:[[0,472,660],[578,976,639],[1092,1672,631]],traps:[['saw',758,1,65,69],['spikes',1250,2,56,114]],cubes:[286,1470]},
  {name:'Bron under förmörkelsen',hint:'Tre långa språng leder fram till väktarens tron.', floors:[[0,386,658],[512,856,647],[982,1295,635],[1422,1672,628]],traps:[['spikes',683,1,58,107],['hatch',1155,2,70,0]],cubes:[265,1522]},
  {name:'Vägen förbi väktaren',hint:'Locka väktarens kross över de tre lysande låsen. Spring undan när märket stannar!',floors:[[0,1672,654]],traps:[],cubes:[],boss:true}
];
chapters.forEach((room,i)=>{
  room.key='moon'+(i+1);
  room.exit=1600;
  const index=ROOMS.push(room)-1;
  trials[index]=room.traps;
  HANGING_BOXES[index]=room.cubes.map(x=>[0,x-44,190,88,116,x]);
});


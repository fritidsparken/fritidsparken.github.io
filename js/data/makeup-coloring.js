// Original colouring pages for Fritidsparken’s Smink collection.
(() => {
  const base = './assets/coloring-originals-2026/smink/';
  const motifs = [
    ["01-lappstift.webp","Läppstift"],
    ["02-lappglans.webp","Läppglans"],
    ["03-lappenna.webp","Läppenna"],
    ["04-lappbalsam.webp","Läppbalsam"],
    ["05-lappfarg.webp","Läppfärg med applikator"],
    ["06-mascara.webp","Mascara"],
    ["07-eyeliner.webp","Flytande eyeliner"],
    ["08-ogonskugga.webp","Ögonskuggepalett"],
    ["09-ogonbryn.webp","Ögonbrynspenna, borste och pomada"],
    ["10-foundation.webp","Foundation"],
    ["11-concealer.webp","Concealer"],
    ["12-lospuder.webp","Löspuder och puderpuff"],
    ["13-kompaktpuder.webp","Kompaktpuder med spegel"],
    ["14-rouge.webp","Rouge och rougeborste"],
    ["15-bronzer.webp","Bronzer med solmönster"],
    ["16-highlighter.webp","Highlighter med stjärna"],
    ["17-contour.webp","Contourstick och borste"],
    ["18-primer-setting-spray.webp","Primer och setting spray"],
    ["19-borstar.webp","Sminkborstar"],
    ["20-svampar.webp","Sminksvampar"],
    ["21-fransar.webp","Fransböjare och lösögonfransar"],
    ["22-nagellack.webp","Nagellack och nagelmönster"],
    ["23-nageldekor.webp","Nagelkonst med verktyg och dekorationer"],
    ["24-glitter.webp","Kroppsglitter och ansiktsstenar"],
    ["25-ansiktsfarg.webp","Ansiktsfärg och penslar"],
    ["26-sminkvaska.webp","Sminkväska"],
    ["27-sminkspegel.webp","Sminkspegel med kosmetika"],
    ["28-rosset.webp","Sminkporträtt med rosett"],
    ["29-stjarnor.webp","Stjärnor vid ögonen"],
    ["30-fjaril.webp","Fjärilsmönster som ansiktsmålning"],
    ["31-blommor.webp","Blomsteransikte med fräknar"],
    ["32-geometrisk.webp","Geometrisk ögonmakeup"],
    ["33-regnbage.webp","Regnbåge och moln som ansiktsmålning"],
    ["34-scensmink.webp","Scensmink och teatermasker"],
    ["35-resenecessar.webp","Resenecessär med smink"],
    ["36-organisor.webp","Sminkförvaring med lådor"]
  ];
  mandalas.push(...motifs.map(([file, title]) => ({
    title,
    type: 'Smink',
    img: base + file,
    reference: base + file.replace(/\.webp$/, '-reference.webp'),
    src: base + file,
    sourceLabel: 'Egen färgläggningsbild'
  })));
})();


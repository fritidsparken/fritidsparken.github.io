// Original machine coloring pages and their matching generated color references.
(() => {
  const base = './assets/coloring-originals-2026/stora-maskiner-20261108/';
  const machines = [["gravmaskin","Grävmaskin"],["hjullastare","Hjullastare"],["dumper","Dumper"],["schaktare","Bulldozer"],["mobilkran","Mobilkran"],["betongbil","Betongbil"],["traktor","Traktor med plog"],["skordetroska","Skördetröska"],["balpress","Traktor med balpress"],["teleskoplastare","Teleskoplastare"],["skogsmaskin","Skogsmaskin"],["vagvalt","Vägvält"],["vaghyvel","Väghyvel"],["pistmaskin","Pistmaskin"],["snoslunga","Snöslunga"],["plogbil","Plogbil"],["bandvagn","Bandvagn"],["snoskoter","Snöskoter"],["sakanon","Snökanon"],["asfaltlaggare","Asfaltläggare"]];
  mandalas.push(...machines.map(([id, title]) => ({
    title, type: 'Stora maskiner',
    img: base + id + '.webp', preview: base + id + '.webp',
    reference: base + id + '-reference.webp',
    pdf: base + id + '.pdf', src: base + id + '.pdf',
    sourceLabel: 'Eget maskinmotiv · Fritidsparken'
  })));
})();

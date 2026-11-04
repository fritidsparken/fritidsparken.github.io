# Blockvärlden – expeditionsversionen

## Innehåll

Spelet använder webbplatsens lokala Three.js, ES-moduler, Web Workers och IndexedDB. Ett världsfrö ger en kontinuerligt genererad karta med tolv biomer. Chunks mäter 16 × 16 block i markplanet och världen är 80 block hög. Alla synliga terrängytor sammanfogas med greedy meshing per 16-blockssektion, med separat pass för genomsläppliga material. En ändring ogiltigförklarar den lokala chunken och vid behov angränsande chunks.

Blender 4.3.2 genererade 144 UV-mappade blockoriginal med 276 atlasrutor, 34 placerbara eller användbara specialmodeller samt 16 riggade figurer med totalt 118 rörelseklipp. De riggade modellerna omfattar en spelare, tio djur och fem fantasivarelser. Vanlig terräng läser atlasen och blockregistret. Originalkubens GLB behöver därför inte laddas en gång per block. Vegetationen visas med instanser. Originalbilderna för startmenyn och spelikonen renderades i Blender. Se respektive manifest under assets/blockvarlden och generatorerna under tools/blender/blockvarlden. Ljud och musik använder egna Web Audio-kompositioner.

Kreativt läge har fritt byggande, flygning, sökbar byggmeny och en byggklippbok för områden upp till 16 × 16 × 16 block. Överlevnad har resurser, förbrukning, tre svårighetsgrader, mat, verktyg med slitage och 113 recept som ger 105 olika resultat. Arbetsbänken låser upp avancerade recept. Dörrar kan öppnas och lådor kan användas för förvaring. Planteringskärl och odlingsjord kan sås och skördas. Sängar låter spelaren vila till morgonen. Fiskespöt kan användas vid vatten. Djur väljer beteende efter avstånd, biom och tid på dygnet.

Världar exporteras som JSON. Blockändringar sparas inkrementellt och tillsammans med världsmetadata i en IndexedDB-transaktion. Tidigare lokala v1-världar importeras under ett eget namn. Originalsparfilen ligger kvar. Föremål och block väljs genom att trycka på snabbvalsplatsen och sedan i ryggsäcken.

## Genomförda prov

- Riktiga Blender-exporter med verifierade vertexdata, UV-attribut och manifest. Samtliga 16 riggar och 118 rörelseklipp kördes med Three.js. Vegetationsprovet delade upp 239 instanser i sex batcher.
- I testmiljöns Chrome klarade spelet startmeny och formulär. Den tillgängliga webbläsaren rapporterade att WebGL-drivrutinen var avstängd.
- Ett integrerat Chromeprov körde spelets riktiga Web Workers, Three.js-scengraf och IndexedDB. Det verifierade tolv biomer, placering och borttagning över chunkgräns, hinder mot genomfall, hopp, kopiering av bygge, återbesök efter tio chunkgränser, lagring, import, export och migrering av en äldre sparfil.
- Med fröet Expedition blev 25 chunks färdiga på 278 ms i det sista provet. De innehöll 49 terrängmeshar och 13 534 trianglar. Detta är ett prov nära ursprunget.
- Ett separat spelflödesprov i Chrome använde en testadapter för renderaren. Det körde den ordinarie spelkoden för skapande, kreativt läge, kameraläge, inventariesökning, snabbval, överlevnad, tillverkning, spara och fortsätt. Kontrollernas placering verifierades i 390 × 844 och 740 × 360 CSS-pixlar.
- Terrängens standardmaterial, himlen och nederbörden kompilerades och länkades med Mesa OpenGL ES. Ett separat terrängprov ritade seedens 13 028 ogenomskinliga trianglar i 640 × 360 med blockatlasen och materialtabellen. Provet gav en avläst bild med varierande texturfärger. Dess genomströmning mäter enbart terrängpasset.
- Ljudsystemets schemaläggning, materialprofiler samt paus och återstart har kontrollerats. Ljudmixen behöver lyssnas igenom på högtalare och hörlurar.

## Återstående arbete

- Spela hela flödet med aktiv WebGL på Windows Chrome, macOS Safari, Chromebook, Android, iPhone och iPad. Mät FPS, bildtider och minne vid snabb flygning, regn och stora byggen. Finjustera grafiknivåerna från mätningarna. Ett separat Playwright-test finns i tools/blockvarlden/browser-test.cjs och ett avgränsat GitHub Actions-arbetsflöde i .github/workflows.
- Utveckla vattnet vidare med vattenfall, mer avancerade reflektioner och flödessimulering. Vattnet i denna version har genomskinlighet, UV-rörelse, simning och undervattensdimma.
- Utöka grottornas ruinvariationer, odlingens visuella växtstadier, riktiga klätterytor och klätterstyrning. Koppla fler situationsspecifika rörelser och ljud till spelhändelserna.
- Djur rör sig lokalt, kan reagera och fly och återskapas när spelaren kommer tillbaka. Beständiga individer och vägval runt mer komplicerade hinder återstår.
- Utveckla inventariet med fasta stapelgränser och drag-och-släpp. Verifiera separata samtidiga spelsessioner med samma värld, längre stresstester och återhämtning när enhetens lagringsutrymme tar slut.

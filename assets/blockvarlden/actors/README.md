# Blockvärldens figurer

Biblioteket innehåller tio djur, fem fantasivarelser och Stigfinnaren. Varje GLB innehåller en UV-mappad mesh, ett material med målade hörnfärger, ett skelett och egna rörelseklipp. Marknivån ligger vid fötterna. En längdenhet motsvarar ett block. GLB-filerna använder glTF:s Y-upp och figurerna tittar mot positiv Z. Manifestet anger fil, figurtyp, animationer och SHA-256 för varje modell.

## Återskapa i Blender

Kör från projektroten med Blender 4.3.2. Skriptet bygger geometrin, skapar ben och vikter, sätter nyckelrutor, exporterar och kontrollerar varje GLB samt skriver om manifestet.

```sh
blender -b -t 2 --python-exit-code 1 -P tools/blender/blockvarlden/actors.py
```

Modellerna är självständiga och kan importeras i andra spel med en vanlig glTF 2.0-läsare som stöder skinning, hörnfärger och animation. I Blockvärlden laddar `games/blockvarlden/entities/actors.js` modeller först när de behövs. Flera djur av samma art delar geometri, material och rörelseklipp men har egna skelett. På större avstånd lämnar djuren simuleringen. Det vilda beståndet återskapas från världsseed och position. Världens sparfil behåller vilka djur som tämjts, var de står och vilka som redan har lämnat mat. Lugnt läge pausar djursimuleringen. Skelettens fötter har sin vilopunkt vid marknivå och djuren faller när spelaren gräver undan deras stöd.

Skriptet genererar även `viltmat.glb`, en fristående modell av viltproviant inlindad i blad. Spelet återanvänder modellen både i spelarens hand och vid uppsamling från marken.

## Licens

Fritidsparken tillgängliggör dessa egenproducerade modeller, hörnfärger och animationer under CC0-1.0. Inga externa texturer, animationer eller modeller behövs.

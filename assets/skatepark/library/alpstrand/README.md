# Alpstrand Vertpark

Banan är modellerad i Blender 4.3.2. Den sammanhängande betongplattan mäter 96 × 86 meter i spelvärlden. Den största bowlen är cirka 55 × 29 meter och 3,3 meter djup. Tornets åkyta når 15 meter och den västra trärampens kant når 9 meter. Måtten gäller modellen. De är uppskattningar utifrån den enda referensvyn.

## Modellbibliotek

Öppna [Alpstrand.blend](../../blender/alpstrand/Alpstrand.blend) för att redigera parken eller välja referenskameran. De 18 återanvändbara samlingarna är markerade som Blender-assets. Varje samling har också en egen startfil i samma mapp. Startfilen placerar modulen i origo och länkar till det gemensamma originalet med en relativ sökväg.

[Katalogen](catalog.json) anger mått, insättningspunkt, objekt, material och sökvägar till varje moduls Blender-fil och GLB. De separata [spelmodulerna](../../models/alpstrand) använder delade [KTX2-texturer](../../materials/alpstrand). Behåll mapparnas inbördes struktur när du flyttar dem. Den [kompletta spelbanan](../../models/alpstrand.glb) har alla modelltexturer inbäddade.

Vid nästa bana, sök först i katalogen och i [det befintliga biblioteket](../../shared). Där finns även halfpipes, brädor och åkare. Lägg till en befintlig samling i Blender med Link eller Append. Skapa en lokal kopia om en ändring bara ska gälla den nya banan. När en modell saknas, kontrollera externa modellers licens, bygg eller anpassa modellen i Blender och märk samlingen som asset. Exportkedjan tar automatiskt med märkta samlingar i katalogen och skapar modulernas GLB- och Blender-filer.

## Rekonstruktion och material

Bowlarnas öppningar är utskurna ur plattan. Botten, väggar och coping har gemensamma konturer. Spelfysiken använder de exporterade åkytornas trianglar. Träramperna har separata böjda åkytor, stålställningar, räcken och målade sidopaneler. Hålet på den östra väggen går igenom betongen. Stairs, banks, kickers, manuallådor, planteringskanter och grindlinjer ligger i namngivna samlingar.

Betongen har färg-, normal- och roughnesskartor, med skilda ytor för gjutna plattor och slitna bowlväggar. Plywooden har skarvar, skruvhuvuden och ådring. Lackerat stål har separata färger och gemensamma mikronormaler. Bläckfisken, stadssilhuetten i solnedgång, bergsmotiven och de dubbla pilarna är originalmålningar för banan. Sjön använder vindmönstrade normaler. De två bergskedjorna har bakade kartor med berggrund, snö och vegetation.

Från fotot uppskattades bland annat exakta djup och radier, avstånden mellan hinder, rampernas baksidor, tornets trappa, strandlinjen och staden utanför bild. Bergsprofilen, trädens placering, grafiken och kameran är tolkningar. Översiktsbilden visar poserade exemplar av projektets åkare för skala. Spelaren styr den animerade åkaren.

## Ursprung och återanvändning

| Tillgång | Ursprung |
| --- | --- |
| Alm och fjärrmodell, bänk, bostadshus, riggad åkare med bräda | Fritidsparkens befintliga bibliotek i `assets/skatepark/shared/`. Projektets modelloriginal återanvänds. |
| Ekens grentextur | Paula Benson, [OpenGameArt](https://opengameart.org/node/49256), CC0. Beskuren och nedskalad. Trädens grenar och stammar modellerades för parken. |
| Himmel | Projektets version av [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Poly Haven, CC0. Färger och molnens höjd anpassades för dagsljuset. |
| Ramper, bowls, streetsektion, stål, målningar, strand, berg och övrigt nytt innehåll | Framtaget för Fritidsparken i detta projekt. |
| Meshopt och Basis Universal samt Three.js-laddare | Licenser och versionsuppgifter medföljer i `games/skatepark/alpstrand/vendor/compression`. |

## Bygg och testa

Kör följande från projektroten med Blender 4.3.2, Node, Python, ImageMagick och Basis Universal (`basisu`) tillgängliga. Blender använder de färdiga originaltexturerna i `textures/alpstrand`. NumPy och Pillow används vid tillverkning av miljön.

```sh
src=tools/blender/skatepark/alpstrand
blender -b --python-exit-code 1 --python "$src/assemble.py" -- /tmp/alpstrand-raw.glb -
node "$src/pack.mjs" /tmp/alpstrand-raw.glb assets/skatepark/models/alpstrand.glb
python3 "$src/modules.py"
blender -b --python-exit-code 1 --python "$src/native_modules.py"
blender -b assets/skatepark/blender/alpstrand/Alpstrand.blend --python-exit-code 1 --python "$src/cover.py" -- /tmp/alpstrand.png
node tools/skatepark/test-alpstrand.mjs
```

Webbtestet i `tools/skatepark/alpstrand-browser.cjs` startar banor från den vanliga menyn. Det kan köras med Playwright och miljövariabeln `SKATE_URL` för att testa en lokal eller publicerad version. Grafiklägena styr bl.a. upplösning, skuggor och avståndet för detaljerade träd. Åkytorna är gemensamma för alla tre lägen.

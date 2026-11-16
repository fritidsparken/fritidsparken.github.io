# Alla origamimodeller i Blender

Varje modell i `../js/models.mjs` har ett eget `.blend`-projekt med dubbelsidiga panelmesher, papperstjocklek, studio, kamera och animerade viksteg. Projekten byggs i Blender 4.3.2. Tidslinjen har 48 bildrutor per steg vid 24 fps: steg 1 börjar på ruta 1, steg 2 på 49 och så vidare. Workbench används för tydliga papperslager och skuggor. Ljusobjekt och nodmaterial finns även för vidare bearbetning.

Bygg om en modell från rotmappen (byt `katt` till valfritt modell-id):

```sh
node origami/blender/export-frames.mjs /tmp/katt-frames.json katt
blender -b -t 3 --python-exit-code 1 --python "$PWD/origami/blender/render-glidaren.py" -- --input /tmp/katt-frames.json --out /tmp/katt-render
python origami/blender/encode.py /tmp/katt-render origami/assets/katt
```

Renderingsskriptets historiska filnamn är kvar, men modellen väljs av JSON-indata. Standardmodell vid export utan modell-id är Glidaren. Python-paketeringen behöver Pillow och ffmpeg. `--preview` på renderingsskriptet gör granskningsbilder utan att bygga hela animationen. `--samples 8` ger snabbare kantutjämning; standard är 16 sampel. De 40 nya modellerna och Arrowhead använder 8 sampel; övriga tidigare modeller 16. Full körning sparar projektet i renderingsmappen; paketeringen kopierar det hit.

Webbformat: en WebP-bild före första steget och efter varje steg, samt ett H.264-klipp per steg, 640×640, 24 fps och två sekunder. Manuell uppspelning laddar aktuellt steg. `python3 origami/blender/continuous.py` sammanfogar stegklippen utan omkodning till `continuous.mp4` per modell. Hela den valda modellens film förladdas när guiden öppnas. Automatisk vikning använder samma video och blob-URL genom samtliga steg, utan byten till stillbilder. Det är förhandsrenderad Blender-animation, inte Blender eller WebGL som körs i besökarens webbläsare. Kamera och färg är fasta i denna vy. Den vanliga SVG-vikvyn delar exakt samma vikgeometri och behåller färg- och kameravalen. Växling mellan vyerna behåller aktuellt steg.

Kameran är fast under varje guide och anpassad till hela viksekvensens utsträckning. Fyrkantiga modeller visas mer ovanifrån så ansikten och former blir tydliga. Kattens och hundens ritade ansikten visas på slutsteget. Varje modell har källhänvisning i sin `manifest.json` och i guiden; egna geometrier och renderade bilder används. Fysisk provvikning och provflygning har inte genomförts.

## Flyganimation

`render-flight.py` öppnar modellens färdiga `.blend`, hämtar det utvärderade slutstegets mesh och animerar samma geometri genom en egenbyggd Blender-miljö. En analytisk flygbana och kamera ger en sammanhängande 12-sekunders tagning, 30 fps och 960×540. Det är en illustrerad flygtur, inte en aerodynamisk beräkning eller utlovad kastlängd. Vingformen morfas inte under flygningen.

```sh
blender -b -t 4 --python-exit-code 1 --python "$PWD/origami/blender/render-flight.py" -- --model "$PWD/origami/blender/glidaren.blend" --out /tmp/glidaren-flight
python origami/blender/encode-flight.py /tmp/glidaren-flight origami/assets/glidaren
```

`--preview` renderar fem kontrollbilder. Paketeringen sparar `flight.mp4`, `flight.webp` och `flight.json` i modellens mediemapp samt det redigerbara `glidaren-flight.blend` här. Besökaren startar filmen med **Se planet flyga**; stängning återgår till samma viksteg.

Flygscenen töms uttryckligen på alla objekt, inklusive dolda viksteg med synlighetsnycklar. Annars kan gamla papperspaneler blinka på marken. Kontrollera efter rendering med `blender -b --python-exit-code 1 --python "$PWD/origami/blender/validate-flight.py"`; den jämför slutmeshen och kontrollerar samma synliga objekt i alla 360 bildrutor.

## 40 nya projekt

52 guider totalt. De nya projekten finns i `../js/projects/` med källor och variantbeskrivningar i `../../docs/origami-projects/`. Båda vyerna använder samma geometri. Ritade detaljer visas på slutsteget. Materialrutan anger när sax, penna, tejp eller klistermärke behövs.

Flygfilmerna använder inte Workbench-skuggvolymer: de kan korsa kameran och bilda stora blinkande grå polygoner. `repair-flight-shadows.py` stänger av effekten i befintliga scener och renderar om alla 360 bildrutor med oförändrad geometri, flygbana och kamera.

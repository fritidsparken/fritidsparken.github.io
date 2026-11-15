# Alla origamimodeller i Blender

Varje modell i `../js/models.mjs` har ett eget `.blend`-projekt med dubbelsidiga panelmesher, papperstjocklek, studio, kamera och animerade viksteg. Projekten byggs i Blender 4.3.2. Tidslinjen har 48 bildrutor per steg vid 24 fps: steg 1 börjar på ruta 1, steg 2 på 49 och så vidare. Workbench används för tydliga papperslager och skuggor. Ljusobjekt och nodmaterial finns även för vidare bearbetning.

Bygg om en modell från rotmappen (byt `katt` till valfritt modell-id):

```sh
node origami/blender/export-frames.mjs /tmp/katt-frames.json katt
blender -b -t 3 --python-exit-code 1 --python "$PWD/origami/blender/render-glidaren.py" -- --input /tmp/katt-frames.json --out /tmp/katt-render
python origami/blender/encode.py /tmp/katt-render origami/assets/katt
```

Renderingsskriptets historiska filnamn är kvar, men modellen väljs av JSON-indata. Standardmodell vid export utan modell-id är Glidaren. Python-paketeringen behöver Pillow och ffmpeg. `--preview` på renderingsskriptet gör granskningsbilder utan att bygga hela animationen. Full körning sparar projektet i renderingsmappen; paketeringen kopierar det hit.

Webbformat: en WebP-bild före första steget och efter varje steg, samt ett H.264-klipp per steg, 640×640, 24 fps och två sekunder. Endast aktuellt steg laddas. Det är förhandsrenderad Blender-animation, inte Blender eller WebGL som körs i besökarens webbläsare. Kamera och färg är fasta i denna vy. Den vanliga SVG-vikvyn delar exakt samma vikgeometri och behåller färg- och kameravalen. Växling mellan vyerna behåller aktuellt steg.

Kameran är fast under varje guide och anpassad till hela viksekvensens utsträckning. Fyrkantiga modeller visas mer ovanifrån så ansikten och former blir tydliga. Kattens och hundens ritade ansikten visas på slutsteget. Varje modell har källhänvisning i sin `manifest.json` och i guiden; egna geometrier och renderade bilder används. Fysisk provvikning och provflygning har inte genomförts.

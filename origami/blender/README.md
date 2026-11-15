# Glidaren – Blender-jämförelse

`glidaren.blend` är ett faktiskt Blender 4.3.2-projekt med dubbelsidiga panelmesher, papperstjocklek, studio, kamera och 15 animerade steg. Tidslinjen är 1–720 vid 24 fps, med 48 rutor per steg. Steg 1 börjar på ruta 1, steg 2 på 49 och så vidare. Workbench används för en tydlig, lättläst pappersvisning. Ljusobjekt och nodmaterial finns även för vidare bearbetning.

Bygg om från rotmappen:

```sh
node origami/blender/export-frames.mjs /tmp/glidaren-frames.json
blender -b -t 6 --python origami/blender/render-glidaren.py -- --input /tmp/glidaren-frames.json --out /tmp/glidaren-render
python origami/blender/encode.py /tmp/glidaren-render origami/assets/glidaren
```

Python-paketeringen behöver Pillow och ffmpeg. `--preview` på renderingsskriptet gör tre granskningsbilder. Full körning sparar projektet i renderingsmappen; paketeringen kopierar det hit. Det här är förhandsrenderad Blender-animation, inte Blender eller WebGL som körs i besökarens webbläsare. Endast valt steg laddas. Motsvarande SVG-vy delar vikgeometrin och stöder fortsatt färg-/kameraval.

Källmodell: [The Stable, Fold’N Fly](https://www.foldnfly.com/2.html). Egen geometri och egna renderade bilder; inga källbilder ingår. Fysisk provflygning har inte genomförts.

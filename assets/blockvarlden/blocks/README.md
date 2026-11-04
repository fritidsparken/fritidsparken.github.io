# Blockvärldens materialbibliotek

Blockbiblioteket är skapat för Fritidsparken i Blender 4.3.2. Modeller, mönster och färgrecept är original och tillhandahålls under CC0-1.0. Produktionens källkod ligger i `tools/blender/blockvarlden/`.

## Återskapa

Kör från repots rot med Blender 4.3.2 och dess medföljande Python och NumPy.

```sh
blender -b -t 2 --python-exit-code 1 -P tools/blender/blockvarlden/generate_blocks.py
```

Skriptet skapar en separat Blender-mesh med en meters kantlängd och ett UV-mappat material för varje blocktyp. Pivot ligger mitt på underkanten. Varje block exporteras en gång som en namngiven nod i GLB-biblioteket. Bibliotekets noder är uppställda i rader för att vara lätta att bläddra bland i Blender. Nollställ nodens position när du använder en modell separat.

## Manifest och användning

| Fil | Innehåll |
| --- | --- |
| registry.json | Ett stabilt numeriskt ID och en unik modellnyckel per block, svenska namn, materialegenskaper, ljudgrupper, verktyg, fysik, ljus, resursdropp och texturrutor. |
| atlas.png | Gemensam färgatlas med 32 × 32 rutor om 32 × 32 texlar. 276 rutor har eget innehåll. Rutorna numreras från övre vänstra hörnet. |
| block-library.glb | 144 Blender-original för återbruk i Blender eller glTF-kompatibla spel. Modellnamnet är postens `model` i manifestet. En enda färgatlas är inbäddad. |

Terrängmotorn behöver bara registret och PNG-atlasen. Block-ID 0 är reserverat för luft. `tiles` anger grundvariantens över-, under- och sidoyta. `variants` inkluderar grundvarianten på plats 0 och ytterligare en deterministisk variant för vanliga natur-, trä-, mineral- och vegetationsmaterial. Välj variant från världspositionen så att ytan förblir stabil när en chunk laddas om. Punktfiltrering och UV-koordinater en halv texel in från kanterna hindrar färgblödning mellan rutorna.

`collision` och `transparent` är booleska. `opacity` anger genomsläppliga materials täckning. `light` är ett värde mellan 0 och 15. `crafting` anger att materialet får förekomma i recept. Enskilda recept definieras i spelmotorn. `drop` är block-ID eller null.

Materialens procedurrecept bakas direkt till atlasens texlar från Blender-skriptet. Det gör omkörningar oberoende av grafikdrivrutin och renderingsenhet. Exportkontrollen läser därefter GLB-filen och verifierar antalet meshobjekt, nodnycklar, UV-attribut och inbäddade bilder.

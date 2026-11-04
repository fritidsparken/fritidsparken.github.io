# Skateparks modellbibliotek

Varje modell i `shared/` har ett redigerbart Blender-original och en GLB med samma grundnamn. Modellerna är byggda för Fritidsparken. Eventuella bildtexturer som modellen behöver följer med i exporten. Filer som slutar på `-lod` eller `-distance` är förenklade varianter.

| Mapp | Innehåll |
| --- | --- |
| characters, skateboards | Riggad åkare med 17 klipp, bräda med träskikt, truckar och hjul |
| ramps, bowls, ledges, stairs | Quarterpipe, halfpipe, bank, kicker, funbox, vågor, två bowls, granitkant och trappa |
| rails | Rak och böjd orange stålrail. Övriga grindytor ingår i respektive moduls geometri |
| buildings | Fabriksflyglar, gavel, hyreshus, skorsten och kyrktorn |
| trees, vegetation | Lind, alm, lönn, buskar, kullar, gräs och moln |
| street-furniture | Bänk, gatlykta och kajräcke |
| materials, textures | Betongplatta med bowlöppningar, skylt och betongtextur |
| sounds | Originalmusik, skateboardljud, stadsljud och licens |

## Öppna hela banan i Blender

Öppna `levels/stadsgardskajen/stadsgardskajen.blend` med katalogstrukturen intakt. Scenen öppnas med startkameran och länkar till 35 modelloriginal via relativa sökvägar. Ändra en delad modell i dess eget original, eller gör en lokal kopia när en förändring bara ska gälla en ny bana.

## Placera en modell

En enhet motsvarar en meter. I Three.js är Y uppåt, åkarens färdriktning är lokal −Z och husens framsida är lokal +Z. Åkare och bräda delar origo under brädan. Markera samma position och rotation för båda när de placeras ut. Låt en AnimationMixer på åkarmodellen spela klippen. Spelfysiken styr brädans bana, lutning och trickrotation.

Stadsgårdskajens placeringar finns i `levels/stadsgardskajen/`. I `park-data.js` pekar varje placering på ett namngivet objekt med läge, skala och vinkel i grader. Modulens lokala körbara trianglar och grindlinjer följer med. `park.js` använder samma transform för synlig geometri och kollisionsyta. `city.js` använder radianer för stadens rotationer och grupperar upprepade objekt för instansritning.

En ny bana kan läsa valfri GLB direkt från `shared/` med spelets GLTFLoader och ha en egen placeringslista i `levels/`. För en ny bowl behöver även markplattan ha ett hål som motsvarar bowlens öppning. Blender-originalen laddas aldrig av webbspelet.

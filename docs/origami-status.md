# Aktuellt läge – fler flygplan 2026-11-15

10 modeller totalt, varav fem pappersflygplan. Tre nya: Glidaren (The Stable), Humlan (The Buzz, liggande A4) och Korpen (Raven). Befintliga modeller och toppbanner behålls.

Glidaren har två jämförbara visningar för samma viksekvens: vanlig SVG-vikvy och en modell byggd och animerad i Blender 4.3.2. Blender-projektet innehåller 15 animerade steg på en 720-bildrutors tidslinje. Publicerade medier: 15 H.264-klipp, 16 WebP-stillbilder, 640×640 och 24 bilder/s. Kameran och färgen är fasta i Blender-vyn. Källprojekt och reproduktionsskript ligger i `origami/blender/`.

Kontroller för detta tillägg: 27 geometriska tester godkända, syntaxkontroll, alla 15 videofiler validerade med ffprobe och samtliga stillbilder verifierade. De tre nya guiderna har navigerats till sista steget i Chrome. Växling mellan visningarna behåller steget. Blender-uppspelning, paus, fortsätt, omspelning och reducerad rörelse kontrollerade. Stående 390×844 och liggande 844×390 har ingen scroll i dialogen eller kontrollpanelen. Ingen fysisk provflygning eller test på faktisk iOS-enhet har genomförts.

## Historik: första arbetsversionen

# Origamistudion – arbetsversion 2026-11-15

Detta är en påbörjad implementation, inte en färdig 48-modellersleverans. Arbetsgrenen ska inte slås ihop till main som om hela uppdraget vore klart.

## Implementerat

- Sju modellsekvenser: Klassisk pil, Breda vingar, Kattansikte, Hundansikte, Tulpanblomma (utan stjälk), Hjärta och Julgran.
- Polygoner delas geometriskt vid viklinjen och roteras med Rodrigues rotation i 3D. Pappersytan och panelernas kantlängder bevaras under varje animation.
- Färg/avvikande baksida, lagerurval, vändning, reverserad uppspelning för öppning, två separata flygplansvingar.
- SVG-visning utan WebGL eller externa grafikbibliotek. Förhandsbilden använder samma slutgeometri som guiden.
- How to Draw-inspirerad mörkgrön studio, explicit väntan på barnet, Tillbaka, Spela om, Pausa/Fortsätt, Börja om, färg, tre kameravinklar, hastighet, slutmodell, lokal progression och reducerad rörelse.
- Befintlig toppbanner och besökstid återanvänds. Endast origami, dess tester och dokumentation ändras.

## Kontroller genomförda

- `node --test tests/origami-geometry.test.mjs`: 19 godkända tester. Alla modellsteg samplas vid sju tidpunkter för yta, kantlängder och ändliga koordinater. Även vikaxel, clipping, öppning, lagerurval och upprepbarhet testas.
- `node --test tests/drawing-lessons.test.cjs`: befintligt test godkänt (63 motiv, fem steg, väntan/omspelning/stängning).
- Chrome: samtliga sju guider har klickats till sista steget i läget utan rörelse. Tillbaka och Spela om testade vid slutet. Normal animering granskad på första flygplanssteg.
- Sparat steg och rosa pappersfärg återställdes efter omladdning (katt steg 2).
- Chrome med iframe-viewport: 390×844 stående, 844×390 liggande, 820×1180 surfplatta och vanlig datorvy. Studioknappar ligger inom sin viewport. Liggende sidopanel hade först scroll och korrigerades; uppmätt clientHeight/scrollHeight båda 157 px.
- Slutformerna för katt, hund, hjärta och gran visuellt granskade. Alla förhandsbilder kommer från respektive verkliga renderade slutgeometri.

## Kvar före full leverans

- 41 ytterligare individuella modeller. `origami-research.md` är ett källregister för samtliga 48 ursprungliga kandidater och anger verifieringsgrad, material och svåra operationer.
- Bygga verkliga fickvikningar, squash/inversion, kollaps, tuck och modulmontering innan modeller som ask, loppa, groda, trana och lotus läggs till. Dessa kan inte ersättas av en silhuettmorfning.
- Förfina lagersorteringen till korrekt partiell skymning för komplex geometri. Nuvarande SVG-ritare använder en förenklad djupsortering. Ingen generell kollisionskontroll av självgenomträngning finns.
- Fysisk provvikning har inte genomförts. Matematisk ytbevaring är inte ett bevis på att en viksekvens kan utföras i papper.
- Full animerad genomgång av varje steg, paus och återupptagning under olika fliksituationer, verkliga iOS Safari/Android Chrome-enheter, små mobilhöjder och skärmläsare återstår.
- Mer genomarbetade slutanimationer och automatisk kameraregi för avancerade veck återstår.
- Blender finns i miljön men har inte använts i denna arbetsversion.
- Ingen publicering till main eller ändring av den publika sidan gjordes i denna arbetsversion.

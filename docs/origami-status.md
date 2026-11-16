# Sammanhängande automatisk vikning och skuggfix, 2026-11-16

Alla 52 guider har en sammanhängande Blender-film som laddas helt innan automatisk uppspelning. Samma video behålls mellan vikstegen. Längd och bildruteantal kontrollerade för samtliga 52 filmer. Chrome-kontroll: samma blob-URL genom flera steg, hela filmen buffrad, paus/fortsätt, stopp, omstart och automatisk övergång till snurrbar slutmodell. 170 automatiska tester godkända.

Den stora grå polygonen i flygfilmerna kommer från Workbench-skuggvolymer. Effekten stängs av i samtliga tre flygscener; flygbana, kamera och pappersgeometri behålls.

# Aktuellt tillägg – 40 nya guider och vikfönster utan scroll, 2026-11-16

40 nya individuella projekt: åtta djur, åtta djuransikten, åtta praktiska papperssaker, åtta dekorationer och åtta saker/leksaker. Totalt 52 guider. Alla har vanlig SVG-vikvy och en egen Blender-modell med samma geometriska viksteg. De nya guiderna omfattar 488 steg. Källor, material, variantval och förenklingar finns i `origami-projects/`. Geometri, svenska instruktioner och bilder är egenproducerade.

Vikfönstret har fast höjd inom den tillgängliga skärmen. Vikningen, instruktionen och navigeringen ryms tillsammans. Inställningar och material/källor visas i separata paneler i samma fönster; navigeringen ligger kvar. Tillbaka, Spela om, Nästa, Börja om och Visa färdig modell återgår till själva vikningen. Det går att växla mellan Vikvy och Blender utan att förlora steget. Flygspelaren anpassar också sin höjd.

Kontrollerad skärmpassning i Chrome med 320×568, 390×844, 667×375, 844×390 och 1280×800: ingen intern scroll i vikdialogen eller inställningspanelen. Även materialrutan med lång titel och flygspelaren har kontrollerats på liten mobil. Det är webbläsarbaserad responsiv kontroll, inte test på en fysisk iPhone.

170 automatiska tester godkända (geometri, SVG-rendering och fullständiga matchande mediefiler för samtliga 52 guider). Alla 488 nya H.264-klipp verifierade: 640×640, 24 fps, 48 bildrutor, två sekunder och yuv420p. Alla 528 nya WebP-bilder avkodade. 40 redigerbara Blender-projekt finns i `origami/blender/`. Slutbilderna för alla 40 granskade tillsammans; representativa guider i samtliga grupper kontrollerade i båda vyerna i Chrome. Valens och namnskyltens Blender-uppspelning kontrollerad. Mobilbild: `origami-projects/mobile-dialog.jpg`.

Geometritesterna kontrollerar: vikgeometri, bevarad pappersyta/panellängd, lagerordning efter rotation och SVG-rendering inklusive ritade detaljer. Den stående namnskylten behåller lageravstånd genom en delvis öppen vikning. Fysisk provvikning har inte genomförts; matematisk geometri är ingen generell kollisionssimulering.

# Föregående tillägg – Foldable Flight och flygfilmer 2026-11-15

Vapor (21 steg) och Arrowhead (24 steg), efter Kyle Boyers Foldable Flight-guider, har lagts till med egna svenska instruktioner, A4-geometri och Blender-projekt. Totalt finns nu tolv modeller, varav sju flygplan. Alla har både vanlig vikvy och Blender 3D. Källor och anpassningar dokumenteras i `origami-flight-sources.md`.

Vapor, Arrowhead och Glidaren har varsin sammanhängande 12-sekunders flyganimation, byggd i Blender med samma färdiga pappersmesh som vikguiden. Knappen **Se planet flyga** öppnar en separat spelare med omspelning och återgång till samma viksteg. Filmerna är illustrerade flygrörelser, inte aerodynamiska simuleringar. De redigerbara flygscenerna sparas tillsammans med vikprojekten.

Arrowheads mittveck, yttre kantvikningar och ficklåsning finns med. Fickan öppnas och stängs kring befintliga veck; slutlig lagerordning lägger kappan över spetsarna. Panelernas yta och kantlängder bevaras. Elastisk böjning vid verklig instoppning är förenklad. Fysisk provvikning och provflygning har inte genomförts.

Kontroller för detta tillägg: 47 automatiska tester godkända. Nya stegfilmer och stillbilder avkodade och formatkontrollerade. De tre flygfilmernas mesher jämfördes mot vikprojektens slutmesher i Blender: samma vertexantal och maximal koordinatskillnad 0 efter orientering. Båda nya guiderna har navigerats till slutet i Chrome; fickstegets video, vybyte, flygning, omspelning, Escape och återgång till samma steg är kontrollerade. Flygdialogen ryms utan intern scroll i stående 390×844 och liggande 844×390. Faktisk iOS-enhet är inte testad.

# Föregående tillägg – två vyer för alla modeller 2026-11-15

Alla tio modeller har nu vanlig SVG-vikvy och Blender 3D, inklusive samtliga fem flygplan, katt, hund, tulpan, hjärta och julgran. Växling mellan vyerna behåller aktuellt viksteg och läget för färdig modell. Blender är standardvy. Färg och kamera är fasta i Blender-vyn; den vanliga vikvyn har kvar sina val.

Varje modell har ett eget redigerbart Blender-projekt, en bild före första vikningen, en bild efter varje steg och ett tvåsekunders videoklipp per steg. Totalt 10 Blender-projekt, 122 videoklipp och 132 stillbilder. Båda vyerna använder samma geometriska viksekvens. Blender-kameran anpassas till hela sekvensen, och kattens och hundens ansikten ritas i slutsteget. Källor, modellnamn och antal steg finns i respektive manifest. Gemensam export, rendering och paketering dokumenteras i `origami/blender/README.md`.

Kontroller: 37 automatiska tester godkända (geometri och fullständig tillgång till alla steg). Alla 122 H.264-klipp verifierade med ffprobe: 640×640, 24 fps, 48 bildrutor, två sekunder, yuv420p. Alla 132 WebP-bilder avkodade och kontrollerade. Båda vyerna och bibehållet steg kontrollerade för samtliga tio modeller i Chrome. Uppspelning kontrollerad med bland annat Klassisk pil, Humlan, katt och hjärta. Mobilens stående 390×844 och liggande 844×390 har ingen extra scroll i studio eller kontrollpanel. Kattens sparade Blender-projekt återöppnades och slutsteget renderades om med exakt samma pixlar (RGB RMS 0). Fysisk provvikning och faktisk iOS-enhet har inte testats.

# Föregående tillägg – fler flygplan 2026-11-15

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

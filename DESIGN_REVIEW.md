# Gemensam Fritidsparken-design – arbetsversion

Den här versionen ersätter `css/standard-home.css` och använder samma header,
hero, kategorier, kort och brytpunkter i Standard, Halloween och Jul. Färger och
befintlig hero-bild väljs efter tema. Mobilkategorier visas i ett rutnät, navigationen
har en öppningsbar meny och spel visas i en mörk sektion över färgläggningen.
Kataloger och aktivitetsdialoger får samma ytor. Startsidan behåller sex
färgläggningsbilder. Pluggparkens befintliga ikon används.

Spelregistret i `js/game-hub.js` delas med startsidan och sökningen; alla nio
befintliga spel kan därför hittas utan en separat, ofullständig spelista.
Färgläggningseditorn, kalenderns datum-/öppningslogik och spelmotorerna är oförändrade.
Den gamla mobila headerstilmallen laddas inte längre.

## Verifierat

- Syntaxkontroll av båda ändrade JavaScript-filerna.
- Alla nio spelomslag och alla lokala resurssökvägar i index finns i repot.
- Balanserade CSS-block och gemensam hero-geometri.
- 26 godkända befintliga tester: julkalenderns datum/progress, Straffläggarens
  fysik, Flygpilotens fysik och Stuntcykelns banor/kontroller.
- Ett bredare testförsök blockerades av saknade lokala Three.js- och bildfiler.
  Dessa finns kvar i fjärrrepot; den lokala arbetskopian hämtades selektivt.

## Återstår före main

Detta är en arbetsversion, inte en färdigtestad leverans. Lokal HTTP-server
blockerades av körmiljön (bind: Operation not permitted). Webbläsarens URL-policy
blockerade file:-förhandsvisning. Den ändrade designen har därför inte körts
eller granskats visuellt i en webbläsare.

- Granska mot referensbilden och justera typografi, bildplacering och kort.
- Testa 1920, 1366, 1024, 768, 390, 320 samt 844×390 px i alla teman.
- Kontrollera överlapp, horisontell scroll, fokus och mobilmeny.
- Testa samtliga kataloger, modalvyer och fristående spel/verktyg.
- Prova Måla online, Skriv ut, automatisk färgläggning och färgförslag.
- Prova julkalenderns kodförhandsvisning och lucköppning i nya placeringen.
- Kontrollera konsol och nätverksfel, och rensa kvarvarande obsoleta regler i
  `site.css` efter visuell verifiering av vilka komponenter som använder dem.
- Slå ihop till main först när dessa kontroller är klara.

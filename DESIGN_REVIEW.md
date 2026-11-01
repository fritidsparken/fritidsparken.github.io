# Gemensamt designsystem för Fritidsparken

`css/standard-home.css` äger webbplatsens gemensamma presentation: header,
hero, navigation, kategorier, kort, kataloger och aktivitetsdialoger. Standard,
Halloween och Jul använder samma komponenter och brytpunkter. Temaidentiteten
styrs av CSS-variabler och de befintliga hero-bilderna.

Startsidan visar fem riktiga aktiviteter, sex spel och sex färgläggningsbilder.
Spelregistret i `js/game-hub.js` delas med sökningen; alla nio befintliga spel
är sökbara. Katalogernas innehåll, färgläggningsmotor, kalenderlogik och spelmotorer
är bevarade. Pluggparkens riktiga ikon används. Den tidigare mobila
headerstilmallen laddas inte längre. 225 obsoleta header-/hero-regler har tagits
bort ur `site.css`.

## Verifiering

- 26 befintliga tester godkända: julkalender, Straffläggaren, Flygpilot och Stuntcykel.
- Syntaxkontroll av ändrade JavaScript-filer.
- Lokala länkar i index och samtliga nio spelomslag kontrollerade mot repots filer.
- Webbläsarkontroll vid 1920×1080, 1366×768, 1024×768, 768×1024,
  390×844, 320×640 och 844×390 i samtliga tre teman: ingen horisontell sidskroll.
- Mobilmeny, sökning, kategoribyte, aktiviteternas dialoger och kalenderlucka
  öppnade i webbläsaren. Kalenderns kodförhandsvisning testad före december.
- Måla online öppnar editorn med auto-färgläggning, färgförslag och färgpalett.
  Canvas-baserade funktioner kräver samma domän för bilderna och kontrolleras
  därför även på den publicerade sidan; en extern HTML-förhandsvisning kan inte
  verifiera dem fullt ut.

Storlekarna testas i webbläsaren, inte på fysiska Chromebook-/iPad-enheter.

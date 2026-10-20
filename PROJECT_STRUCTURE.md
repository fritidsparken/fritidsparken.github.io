# Projektstruktur

Den aktiva startsidan är `index.html`. Sidans kod är uppdelad så att ändringar i innehåll, utseende och ritguider kan göras var för sig.

- `site.css` innehåller sidans samlade CSS-regler i samma ordning som de låg i HTML-filen.
- `js/data/activities.js` innehåller aktivitets- och fritidsgympainnehåll.
- `js/data/catalogs.js` innehåller kategorier, färgläggningsbilder, klippdockor och säsongspyssel.
- `js/site.js` innehåller sidans vyer, interaktioner och temalogik.
- `js/drawing-guides.js` ritar och visar Rita steg-för-steg-guiderna.
- `assets/embedded/` innehåller bilder som tidigare låg inbäddade i CSS och JavaScript.

JavaScript-filerna laddas i ordning längst ned i `index.html`: aktivitetsdata, katalogdata, sidlogik och ritguider. Behåll den ordningen eftersom sidlogiken använder datan.

Filerna `app.js` och `style.css` i projektroten är äldre filer och laddas inte av den aktiva `index.html`. De har lämnats orörda i denna refaktorering.

# Fritidsparken

Ett statiskt aktivitetsverktyg för fritidshem F–6. 24 färdiga aktiviteter med instruktioner, sökning, filter, lokala favoriter, veckoplan och utskriftsvy.

## Publicera med GitHub Pages

Öppna Settings → Pages. Välj Deploy from a branch, grenen main och mappen / (root). Spara.

Nuvarande Pages-adress: https://fritidsparken.github.io/

Adressen https://fritidsparken.github.io/ kräver att ägaren är användaren eller organisationen fritidsparken, med ett repository med namnet fritidsparken.github.io.

## Utveckling

Ingen byggprocess eller API-nyckel behövs. Kör exempelvis python3 -m http.server 8080 i projektmappen. Innehåll och logik finns i app.js, design i style.css.

Favoriter och veckoplan sparas endast i den aktuella webbläsarens localStorage. Inga elevuppgifter krävs. Google Fonts används med lokala sans-serif-typsnitt som reserv. Aktiviteterna är redaktionellt skrivna och genereras inte av ett API.

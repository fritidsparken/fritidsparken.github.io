# Publicera Prince of Persia – tre separata uppladdningar

GitHubs webbuppladdning kan avvisa en stor uppladdning. **Ladda bara upp en del åt gången, och committa varje del separat till main.**

1. Välj **Add file → Upload files** i denna mapp. Välj endast `prince-of-persia-github.zip.part01` (19 MB) och klicka **Commit changes** till main.
2. Öppna denna mapp igen. Ladda upp endast `prince-of-persia-github.zip.part02` (19 MB). **Commit changes** till main.
3. Öppna denna mapp igen. Ladda upp endast `prince-of-persia-github.zip.part03` (17,7 MB). **Commit changes** till main.

**Efter den tredje uppladdningen** kör GitHub Actions importen automatiskt. Den verifierar arkivets kontrollsumma, packar upp alla 254 spelfiler till `games/prince-of-persia/`, publicerar dem till `main` och tar bort uppladdningsdelarna.

Kontrollera resultatet under **Actions → Publicera Prince of Persia fran uppdelat spelarkiv**.

Speladress efter lyckad körning: https://fritidsparken.se/games/prince-of-persia/

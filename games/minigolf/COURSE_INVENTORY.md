# Baninventering och visuell riktning

Alla koordinater är meter [x, höjd, z]. Ursprunglig fysik, banform, par och hinder är oförändrade. Referenser finns i `references/index.html`.

## 1. Första putten

Miljö: Klassiska parken. Par 2. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[0,0,-7],[2,0,-14],[1,0,-22]]`

Hinder: `[]`

## 2. Tunneln

Miljö: Botaniska trädgården. Par 2. Bredd 4.8 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,2,0],[0,2,-9],[0,0,-17],[5,0,-23]]`

Hinder: `[{"type":"tunnel","node":1}]`

## 3. Väderkvarnen

Miljö: Japanska trädgården. Par 3. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[0,0,-10],[0,0,-20],[-5,0,-26]]`

Hinder: `[{"type":"windmill","node":1}]`

## 4. Piratbron

Miljö: Skogsbäcken. Par 3. Bredd 3.3 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,1,0],[0,2,-9],[5,2,-17],[5,1,-26]]`

Hinder: `[{"type":"bridge","node":1}]`

## 5. Piratskeppet

Miljö: Medelhavsviken. Par 3. Bredd 4.6 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[0,3,-10],[0,3,-23],[5,0,-32]]`

Hinder: `[{"type":"ship","node":1},{"type":"barrel","node":2}]`

## 6. Kanonen

Miljö: Tropiska ravinen. Par 3. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,1,0],[0,1,-10],[0,1,-40],[4,1,-48]]`

Hinder: `[{"type":"cannon","node":1,"exit":2,"gap":true}]`

## 7. Djungelstigen

Miljö: Kustträdgården. Par 3. Bredd 4 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[-7,0,-6],[-7,0,-15],[5,0,-20],[5,0,-29],[-1,0,-35]]`

Hinder: `[]`

## 8. Vattenfallet

Miljö: Slottets kaskader. Par 4. Bredd 4.7 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[0,4,-12],[0,4,-23],[7,1,-30],[10,1,-37]]`

Hinder: `[{"type":"waterfall","node":2},{"type":"tunnel","node":2}]`

## 9. Apans genväg

Miljö: Tallarnas bergsstig. Par 3. Bredd 4 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[-9,0,-8],[-9,0,-22],[0,0,-29],[7,0,-34]]`

Hinder: `[{"type":"logShortcut","node":0,"exit":3}]`

## 10. Godisvägen

Miljö: Oasens slingor. Par 3. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[6,0,-8],[-4,1,-17],[6,1,-26],[0,0,-34]]`

Hinder: `[{"type":"bumper","node":2}]`

## 11. Donutloopen

Miljö: Lyktornas trädgård. Par 3. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,0,0],[0,0,-12],[0,0,-23],[5,0,-31]]`

Hinder: `[{"type":"loop","node":1,"exit":2,"radius":3.1}]`

## 12. Chokladfloden

Miljö: Alpbäcken. Par 4. Bredd 3.8 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,1,0],[0,1,-9],[0,1,-17],[7,2,-24],[7,2,-32],[0,1,-39]]`

Hinder: `[{"type":"movingBridge","node":1,"exit":2},{"type":"bumper","node":4}]`

## 13. Månbasen

Miljö: Månresorten. Par 3. Bredd 5 m. Gravitation 6 m/s².

Mittlinje: `[[0,0,0],[0,2,-10],[8,2,-19],[8,0,-30],[0,0,-36]]`

Hinder: `[{"type":"bumper","node":2}]`

## 14. Planethoppet

Miljö: Den lysande skogen. Par 4. Bredd 4.5 m. Gravitation 6 m/s².

Mittlinje: `[[0,0,0],[0,2,-10],[0,1,-22],[5,3,-32],[5,1,-44],[0,1,-51]]`

Hinder: `[{"type":"jump","node":1,"exit":2,"gap":true},{"type":"jump","node":3,"exit":4,"gap":true}]`

## 15. Portalen

Miljö: Portalhamnen. Par 4. Bredd 5 m. Gravitation 6 m/s².

Mittlinje: `[[0,0,0],[0,0,-10],[8,1,-25],[8,1,-35],[-6,0,-47],[-6,0,-56]]`

Hinder: `[{"type":"portal","node":1,"exit":2,"gap":true},{"type":"portal","node":3,"exit":4,"gap":true},{"type":"returnPortal","node":4,"exit":2,"offset":1.8}]`

## 16. Vulkangrottan

Miljö: Höstens stengrotta. Par 4. Bredd 4 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,3,0],[0,1,-12],[-6,1,-19],[-6,0,-29],[4,0,-37]]`

Hinder: `[{"type":"tunnel","node":2},{"type":"bumper","node":3}]`

## 17. Lavabron

Miljö: Nattens lavabro. Par 4. Bredd 3 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,1,0],[0,1,-10],[0,1,-19],[8,1,-26],[8,1,-35],[0,1,-42]]`

Hinder: `[{"type":"movingBridge","node":1,"exit":2},{"type":"barrel","node":3}]`

## 18. Den stora finalen

Miljö: Finalens terrasser. Par 5. Bredd 5 m. Gravitation 9.81 m/s².

Mittlinje: `[[0,14,0],[0,5,-22],[12,4,-27],[18,3,-17],[10,2,-10],[3,1,-19],[3,1,-34],[3,1,-45],[3,1,-57],[3,0,-90],[3,-2,-103],[3,0,-115],[3,2,-124],[3,1,-134]]`

Hinder: `[{"type":"barrel","node":3},{"type":"tunnel","node":6},{"type":"loop","node":7,"exit":8,"radius":3.1},{"type":"cannon","node":8,"exit":9,"gap":true},{"type":"underwaterTunnel","node":10}]`

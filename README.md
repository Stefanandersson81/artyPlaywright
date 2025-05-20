
http.response_time.95 < 500
Detta betyder att 95 % av alla HTTP-responser bör ha varit snabbare än 500 millisekunder. Bara de långsammaste 5 % får vara långsammare än 500 ms.

http.response_time.99 < 500
Här kräver du att 99 % av alla responser ska vara under 500 ms. Endast de långsammaste 1 % får överskrida detta.

Separata, robusta moduler för inloggning och utloggning
✅ CSV-baserad fördelning av användare över parallella trådar
✅ En tydlig lasttestfil (load.spec.js) som kan köras med --workers=N

Om du senare vill lägga till fler steg i testet, utöka rapportering eller integrera med CI/CD
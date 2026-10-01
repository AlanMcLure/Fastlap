# Fixtures de la API de F1

Los ficheros `*.json` de esta carpeta son **sintéticos**: están escritos a mano siguiendo el formato documentado de Ergast/Jolpica-F1 para que los tests de la capa de datos sean estables y no dependan de la red.

Para validar los esquemas contra respuestas reales, ejecuta desde una máquina con acceso a internet:

```bash
node scripts/capture-f1-fixtures.mjs
```

El script guarda respuestas reales en `real/` (conviene versionarlas) y `src/lib/f1/contract.test.ts` las comprueba automáticamente: si Jolpica cambia el formato, ese test falla.

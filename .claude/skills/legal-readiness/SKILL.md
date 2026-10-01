---
name: legal-readiness
description: Prepara un proyecto web o app para salir al público en España y la UE. Audita el código para inventariar los datos personales, terceros y cookies que trata, redacta borradores legales (aviso legal, privacidad, cookies, condiciones, normas), detecta huecos técnicos (borrado de cuenta, exportación de datos, edad mínima, embeds, tokens guardados, moderación) y prepara la consulta con el abogado. Úsala cuando el usuario quiera publicar o lanzar un proyecto, pida textos legales, RGPD, LSSI, cookies o política de privacidad, o diga "prepáralo para sacarlo".
---

# Preparar un proyecto para publicarlo (legal + técnico)

Método sacado de preparar FastLap (`docs/legal/` de ese repositorio es un ejemplo completo). **No es asesoramiento legal**: produce borradores y una lista de preguntas para que los revise un profesional (abogado o consultoría de protección de datos con RGPD, LOPDGDD y LSSI-CE). El marco por defecto es España/UE; si el proyecto apunta a otro país, dilo y limita el alcance.

## Reglas que no se saltan

1. **Los textos describen lo que el código hace hoy**, verificado leyéndolo. Si una cláusula promete algo que el código no hace (o calla algo que sí hace), es un error. Cita el archivo que lo demuestra en el inventario.
2. **Nunca inventes datos del titular** (nombre, NIF, domicilio, correo, plazos, jurisdicción, proveedores elegidos). Pon `[PENDIENTE: qué falta]` y reúnelos al final. Antes de escribir datos personales reales en el repositorio, confirma con el titular.
3. **Borradores, sin publicar.** No crees páginas públicas ni enlaces desde la web hasta que el titular diga que están revisados. Los textos van en `docs/legal/` del proyecto.
4. **Informa de los huecos técnicos antes de arreglarlos y pide confirmación**: son decisiones de producto (quitar una función, añadir un paso al registro). Si el usuario pide arreglarlos, hazlos pequeños, con test, y apunta el antes y el después.
5. Si algo no se puede comprobar (OAuth real, proveedor sin cuenta, producción), dilo en lugar de darlo por hecho.

## Flujo

### 1. Reconocer el proyecto
- Lee el README y la guía del repositorio (`AGENTS.md`, `CLAUDE.md`). Pregunta solo lo que el código no responda: ¿quién es el titular (persona física o sociedad)?, ¿gratuito o de pago?, ¿hay usuarios que publican contenido?, ¿a qué países apunta?
- Ejecuta el escáner para tener un mapa de señales (no sustituye leer el código):
  `sh .claude/skills/legal-readiness/scripts/scan.sh [ruta-del-proyecto]`

### 2. Inventario de datos (`docs/legal/INVENTARIO-DATOS.md`)
Parte de `templates/INVENTARIO-DATOS.md`. Para cada dato personal: de dónde sale, dónde se guarda, para qué, quién lo ve (¿es público?), base jurídica propuesta, conservación y **la referencia al código**. Cubre siempre: cuenta y perfil, sesión y cookies, lo que publican los usuarios, votos y actividad, notificaciones, registros de moderación, archivos subidos, límites de uso y logs, copias y cachés. Incluye también los **terceros** (proveedor, qué recibe, por qué, región, si es encargado) y el estado de los **derechos** (acceso, rectificación, supresión, portabilidad, oposición).

### 3. Huecos técnicos
Recorre `templates/CHECKLIST-TECNICA.md` contra el código y anota cada punto como ✅ cumple, ⚠️ parcial o ❌ falta, con el archivo. Preséntaselos al titular ordenados por riesgo y con una recomendación; no los arregles sin su visto bueno.

### 4. Borradores
Usa `templates/ESQUELETOS-DOCUMENTOS.md`. Genera solo los que apliquen (una web sin usuarios que publican no necesita normas de la comunidad; sin pagos no necesita condiciones de contratación). Cada borrador cabecera con «borrador para revisión profesional» y lista sus `[PENDIENTE]`.

### 5. Consulta con el abogado
Parte de `templates/CONSULTA-ABOGADO.md`: resumen del proyecto, qué ya está hecho, y preguntas **solo de las áreas que apliquen**. Que sea corto: el abogado cobra por tiempo.

### 6. Dejar rastro
- `docs/legal/README.md`: estado, lista de documentos, datos que solo puede poner el titular (`grep -rn PENDIENTE docs/legal`), huecos y cómo publicar.
- Si se cambió código por motivos legales, `docs/legal/CAMBIOS-TECNICOS.md` con **cómo estaba antes**, cómo está ahora, límites conocidos y cómo revertirlo.
- Una viñeta en la guía del proyecto: cuando una función cambie qué datos se recogen, guardan, comparten o muestran, se actualizan el inventario y los borradores en el mismo cambio.

## Al terminar
Informa en pocas líneas: qué se hizo, qué huecos quedan, qué datos faltan y que los textos no valen hasta que los revise un profesional. Ofrece el siguiente paso, no lo inicies.

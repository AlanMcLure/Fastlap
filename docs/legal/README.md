# Borradores legales de FastLap

> **Estos textos son borradores técnicos, no asesoramiento legal.** Describen lo que la aplicación hace *hoy* (verificado contra el código) y proponen cláusulas habituales para una web española con usuarios en la UE. **No están publicados en la web.** Antes de publicarlos deben revisarlos un abogado o una gestoría especializada en protección de datos y comercio electrónico (RGPD, LOPDGDD, LSSI-CE y, si procede, el Reglamento de Servicios Digitales).

## Qué hay

| Documento | Para qué |
|---|---|
| [INVENTARIO-DATOS.md](INVENTARIO-DATOS.md) | **La base de todo lo demás**: qué datos personales trata la aplicación, dónde, para qué, quién los ve y con qué terceros se comparten, con la referencia al código. Es lo que hay que enseñar al abogado. |
| [AVISO-LEGAL.md](AVISO-LEGAL.md) | Identificación del titular (obligatoria por la LSSI-CE), propiedad intelectual, marcas y atribución de datos. |
| [POLITICA-PRIVACIDAD.md](POLITICA-PRIVACIDAD.md) | Información al usuario sobre el tratamiento de sus datos (art. 13 RGPD) y cómo ejercer sus derechos. |
| [POLITICA-COOKIES.md](POLITICA-COOKIES.md) | Cookies y almacenamiento local que usa la web (hoy solo técnicos). |
| [CONDICIONES-DE-USO.md](CONDICIONES-DE-USO.md) | Reglas del servicio, contenido de los usuarios, moderación, responsabilidad. |
| [NORMAS-DE-LA-COMUNIDAD.md](NORMAS-DE-LA-COMUNIDAD.md) | Normas de convivencia en lenguaje claro, alineadas con los motivos de denuncia de la app. |
| [CONSULTA-ABOGADO.md](CONSULTA-ABOGADO.md) | Resumen del proyecto y 30 preguntas para llevar a una primera consulta de revisión. |
| [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md) | Cambios de código hechos por motivos legales, con cómo estaba antes y cómo revertirlos. |

## Datos que solo puede poner el titular

Todo lo que dice `[PENDIENTE: …]` es un dato o una decisión que no puedo inventar. Para ver los que quedan: `grep -rn "PENDIENTE" docs/legal`.

- **Titular** (nombre completo o razón social, NIF/CIF, domicilio, correo de contacto, y datos registrales si es una sociedad). El correo de soporte que ya muestra la web es `fastlapsoporte@gmail.com`; confirma que quieres usarlo también como correo de contacto legal y de derechos RGPD.
- **Proveedores reales** (hosting, base de datos, país/región de cada uno) y si hay transferencias fuera del Espacio Económico Europeo.
- **Plazos de conservación** que quieras aplicar.
- **Jurisdicción** de las condiciones.

## Huecos técnicos que afectan a lo legal (decisiones tuyas)

Se han encontrado al preparar los borradores; los textos están escritos para ser **ciertos con el código actual**, pero estos puntos conviene resolverlos antes de abrir al público:

1. ~~**Contenido incrustado de terceros.**~~ **Resuelto**: la herramienta Embed se quitó del editor, el servidor rechaza bloques `embed` y los posts antiguos los muestran como enlace. Cómo estaba antes y cómo revertirlo: [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md).
2. ~~**Supresión y exportación de datos.**~~ **Resuelto**: Ajustes → «Eliminar mi cuenta» (las publicaciones y comentarios quedan anonimizados como «Usuario eliminado») y «Descargar mis datos» (JSON). Detalle, límites y cómo estaba antes en [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md). Pendiente menor: borrar las imágenes de UploadThing y cerrar las sesiones abiertas en otros dispositivos.
3. ~~**Tokens de Google guardados.**~~ **Resuelto en código**: ya no se guardan al iniciar sesión. Falta ejecutar `scripts/scrub-google-tokens.mjs` contra una base que ya tenga cuentas (ver [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md)).
4. ~~**Edad mínima.**~~ **Resuelto como declaración**: casilla obligatoria («Tengo al menos 14 años y acepto…») antes de crear la cuenta; se guarda la fecha y la versión aceptada. No es una verificación (Google no da la fecha de nacimiento): decide con el abogado si basta. Pendiente: enlazar las condiciones y la política en la casilla cuando estén publicadas. Detalle en [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md).
5. **Avisos de retirada de contenido.** Hay denuncias y un aviso al autor cuando se elimina algo, pero sin explicación detallada ni forma de recurrir. Si la web se considera servicio de alojamiento de datos, el Reglamento de Servicios Digitales pide un mecanismo de notificación, motivación de las decisiones y un punto de contacto; pregunta al abogado qué te alcanza.
6. **Premium (oculto).** Si algún día se activa, hay que añadir datos de facturación, condiciones de contratación, desistimiento y el tratamiento por Stripe, y los datos de F1 de Jolpica **no permiten uso comercial** sin licencia.

## Cómo publicarlos cuando estén revisados

1. Sustituye los `[PENDIENTE]` y aplica los cambios del abogado en estos archivos (son la fuente de verdad).
2. Crea las páginas públicas (`/aviso-legal`, `/privacidad`, `/cookies`, `/condiciones`, `/normas`) a partir de ellos y enlázalas en un pie de página; en el registro, enlaza las condiciones y la política de privacidad junto al botón de Google.
3. Actualiza `src/lib/faqs.ts` (la FAQ de contacto y la de contenido inadecuado deben apuntar a las normas) y `docs/DESPLIEGUE.md` (lista de comprobación).
4. Anota la fecha de la versión publicada y guarda las anteriores.

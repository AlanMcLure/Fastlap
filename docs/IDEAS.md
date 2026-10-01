# Ideas para FastLap

Banco de ideas, ordenado por valor frente a esfuerzo. Estado: ⏳ pendiente · 🚧 en curso · ✅ hecho · ❓ necesita decisión. Se actualiza al cerrar cada una. Las rebanadas 0–9 del dashboard están en [PLAN-DASHBOARD.md](PLAN-DASHBOARD.md).

## A. Se pueden hacer ya (sin depender de nada externo)

| # | Idea | Por qué | Estado |
|---|---|---|---|
| A1 | **Notificaciones dentro de la app**: respuestas a tus comentarios, comentarios en tus publicaciones, "se cierra el pronóstico" y "ya tienes puntos". Después, email. | Es lo que más retiene en una red social. Aprovecha lo ya construido. | ✅ dentro de la app (hecho: comentarios, respuestas, cierre de pronósticos, puntos); ⏳ email, preferencias y avisos por Piloto del Día |
| A2 | **SEO y vista previa de enlaces**: metadatos, `sitemap`, `robots`, imágenes Open Graph para comunidades, hilos de GP y pilotos. | Las páginas de pilotos y carreras son contenido indexable. | ✅ metadatos, canónicas, robots, sitemap, tarjetas para compartir y datos estructurados; ⏳ comprobar con Search Console al publicar, sitemap por partes si supera 50.000 URLs, páginas públicas de pilotos |
| A3 | **Moderación básica**: denunciar publicaciones y comentarios, cola para admins. | Imprescindible antes de abrir la app al público. | ✅ denuncias, cola de admins con registro y aviso al autor; ⏳ moderadores por comunidad, ocultar automáticamente con N denuncias, suspensión de usuarios, apelaciones, normas de la comunidad |
| A4 | **Perfil público con estadísticas de pronósticos**: puntos, aciertos exactos, mejor carrera, racha, insignia por ganar una liga. | Da identidad y motivo para volver; los datos ya se calculan. | ✅ estadísticas e insignias (campeón global y de liga en temporadas cerradas); ⏳ historial de pronósticos con detalle, comparar con otro usuario |
| A5 | **Clasificación global de pronósticos** por temporada. | Enseña la liga a todos y atrae a las comunidades. | ✅ `/pronosticos` con selector de temporada y listado de ligas; ⏳ clasificación mensual o por equipos |
| A6 | **Comparador de pilotos** cara a cara con las estadísticas ya calculadas y gráfico monocromo. | Contenido compartible. | ✅ `/f1-dashboard/comparar` (estadísticas de carrera lado a lado y cara a cara en carreras compartidas); ⏳ comparar dentro de una misma temporada o equipo, gráfico de puntos por temporada |
| A7 | **Búsqueda mejor**: publicaciones, usuarios y pilotos, con atajo de teclado. | Hoy solo busca comunidades. | ✅ comunidades, usuarios, títulos de publicaciones y pilotos, atajo `/`, teclado; ⏳ buscar dentro del texto de las publicaciones, página de resultados completa, búsqueda por similitud |
| A8 | **Imágenes para compartir**: resumen visual de un GP o de tu posición en la liga. | Tráfico externo. | ✅ tarjetas con el resultado del GP (podio y vuelta rápida), la liga, la clasificación global y el perfil, que además son la imagen al compartir el enlace, con botones «Compartir» y «Descargar imagen»; ⏳ tarjeta de un pronóstico concreto (con tus picks), formato vertical para historias, tarjeta de la clasificación del campeonato de F1 |
| A9 | **Accesibilidad, rendimiento y PWA**: contraste, teclado, Lighthouse, instalable en el móvil. | Calidad general. | ✅ accesibilidad (axe, teclado, contraste, reflujo a 320 px; ver AUDITORIA-VISUAL §8); ✅ rendimiento (Lighthouse 95–100, CLS ≈ 0) y PWA instalable con página sin conexión (ver AUDITORIA-VISUAL §9); ⏳ prueba con lector de pantalla, instalación en móvil real bajo HTTPS, notificaciones push |

## B. Más grandes, con decisión previa

| # | Idea | Nota | Estado |
|---|---|---|---|
| B1 | **Predicciones más ricas**: pole, abandonos, comodines. | Antes hay que añadir una consulta de clasificación (`getQualifying`) a la capa de datos. | ⏳ |
| B2 | **Ligas privadas con invitación**, premios simbólicos (insignias, flair). | | ⏳ |
| B3 | **Predicción del campeonato** al inicio de temporada, puntuada al final. | | ⏳ |
| B4 | **Noticias (D4)**: agregar fuentes por RSS con enlace y atribución, o dejar que la comunidad publique y vote, en vez de contenido escrito a mano. | Hay que elegir el camino. | ❓ |
| B5 | **Colores de equipo** en torre y gráficos, solo en vistas de datos y sin logos. | Decisión de diseño. | ❓ |
| B6 | **Datos en vivo reales (D6)**. | Solo con los términos del feed por escrito y una máquina con internet (ver PLAN, rebanada 9). | ❓ |
| B7 | **Premium con sentido** si se activa: estadística avanzada, ligas privadas ilimitadas, alertas. | El acceso básico no justifica pagar. | ❓ |

## C. Sin código, pero críticas

- ✅ **Borradores legales** (`docs/legal/`: aviso legal, privacidad, cookies, condiciones, normas e inventario de datos verificado contra el código). Pendiente: datos del titular, revisión profesional y decisiones técnicas. Hechos: embebidos, tokens de Google, baja de cuenta y exportación de datos (ver `docs/legal/CAMBIOS-TECNICOS.md`); faltan edad mínima y avisos de retirada.
- ✅ **Despliegue preparado** (imagen Docker verificada, comprobación de salud, validación del entorno, CI, guía en `DESPLIEGUE.md`). Falta desplegar de verdad: elegir hosting y crear las cuentas (base de datos, Upstash, Google, UploadThing).
- ✅ **FAQs reescritas** con lo que la app hace de verdad (antes hablaban de una sección «Resultados» y un botón «Registrarse» que no existen); ahora salen de `src/lib/faqs.ts` y se publican también como datos estructurados. Revisarlas cada vez que cambie una función.
- **Probar con aficionados reales** (cinco conversaciones valen más que otra funcionalidad): el plan se apoya en hipótesis.
- **Cerrar lo externo**: correo a Jolpica por la licencia comercial (lo envía el autor), capturar fixtures reales desde una máquina con internet, probar de verdad Google OAuth, UploadThing (v4), Docker y Stripe.
- **Despliegue**: elegir hosting (el directo y el cron de sincronización piden un proceso de larga vida), base de datos y Redis de producción.

## Orden recomendado

1. Notificaciones (A1) y moderación básica (A3): sin ellas no conviene abrir la app.
2. Perfil con estadísticas (A4) y clasificación global (A5): baratas y refuerzan lo ya hecho.
3. SEO (A2) e imágenes para compartir (A8): traen gente.
4. Comparador (A6) y predicciones más ricas (B1).

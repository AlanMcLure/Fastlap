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
| A6 | **Comparador de pilotos** cara a cara con las estadísticas ya calculadas y gráfico monocromo. | Contenido compartible. | ⏳ |
| A7 | **Búsqueda mejor**: publicaciones, usuarios y pilotos, con atajo de teclado. | Hoy solo busca comunidades. | ⏳ |
| A8 | **Imágenes para compartir**: resumen visual de un GP o de tu posición en la liga. | Tráfico externo. | 🚧 hechas las tarjetas de post, comunidad y GP; ⏳ resumen del resultado de un GP y de tu posición en la liga |
| A9 | **Accesibilidad, rendimiento y PWA**: contraste, teclado, Lighthouse, instalable en el móvil. | Calidad general. | ⏳ |

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

- **Probar con aficionados reales** (cinco conversaciones valen más que otra funcionalidad): el plan se apoya en hipótesis.
- **Cerrar lo externo**: correo a Jolpica por la licencia comercial (lo envía el autor), capturar fixtures reales desde una máquina con internet, probar de verdad Google OAuth, UploadThing (v4), Docker y Stripe.
- **Despliegue**: elegir hosting (el directo y el cron de sincronización piden un proceso de larga vida), base de datos y Redis de producción.

## Orden recomendado

1. Notificaciones (A1) y moderación básica (A3): sin ellas no conviene abrir la app.
2. Perfil con estadísticas (A4) y clasificación global (A5): baratas y refuerzan lo ya hecho.
3. SEO (A2) e imágenes para compartir (A8): traen gente.
4. Comparador (A6) y predicciones más ricas (B1).

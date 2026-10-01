# Auditoría visual de FastLap

Método: capturas en escritorio (1280 px) y móvil (390 px) de las pantallas principales con una sesión de usuario normal y sin sesión, más lectura del código. La aplicación se ejecutó con datos de prueba y **sin acceso a la API de F1**, por lo que las pantallas del dashboard se vieron en su estado de error. No he probado modo oscuro (no existe, ver más abajo) ni accesibilidad con lector de pantalla.

Pantallas revisadas: inicio (con y sin sesión), inicio de sesión, comunidad, post, crear comunidad, ajustes, dashboard, pilotos, carreras, FAQs y 404. No se detectó desbordamiento horizontal en ninguna.

## 1. Hallazgos

### Errores (algo se ve roto o no funciona)

| # | Hallazgo | Dónde |
|---|---|---|
| E1 | **La barra lateral del dashboard tapa el contenido**: el título queda cortado ("…venido al Dashboard") y en móvil ocupa casi toda la pantalla. El contenido solo deja 80–160 px de margen y la barra abierta mide ~290 px. | `app/f1-dashboard/layout.tsx`, `components/SideBar.tsx` |
| E2 | **Cuando falla la API del dashboard**: en inicio sale un texto en inglés cortado ("…ng data: Request failed with status code 500") y en `/pilotos` se redirige a una página 404. | `app/f1-dashboard/**` |
| E3 | La página 404 enlaza "Contactar con soporte" a un correo personal (`mailto:amclurealarcon@gmail.com`), distinto del que dan las FAQs (`fastlapsoporte@…`). Conviene unificar en un único correo de soporte. | `app/not-found.tsx`, `app/faqs/page.tsx` |

### Textos y localización (UI en español)

| # | Hallazgo | Dónde |
|---|---|---|
| T1 | "Tú Feed" y "Volver a tú Feed" (debe ser "Tu feed"). | `app/page.tsx`, `BackButton` |
| T2 | "1 comentarios" (sin plural). | `components/Post.tsx` |
| T3 | "About r/formula1" en inglés y fecha "October 1, 2026" en inglés. | `app/r/[slug]/layout.tsx` |
| T4 | "Home" en inglés en las pantallas de inicio de sesión y registro. | `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx` |
| T5 | `aria-label` en inglés ("Reload Posts", "Load More Posts") y botones del final del feed solo con icono. | `components/PostFeed.tsx` |

### Diseño y experiencia

| # | Hallazgo | Impacto |
|---|---|---|
| D1 | **Sin identidad de marca**: aspecto de clon de Reddit, barra roja plana, logotipo diminuto y poco legible. Nada recuerda a F1 (ni colores de equipo, ni tipografía de carrera, ni datos). | Alto |
| D2 | **Sin modo oscuro real**: Tailwind está en `darkMode: class`, pero hay solo 6 clases `dark:` y no hay botón para cambiarlo. | Alto (los aficionados ven carreras de noche) |
| D3 | **Tarjeta de post pobre**: sin texto ni imagen de vista previa, por lo que un post sin título largo deja un gran vacío; el botón "Borrar" rojo, grande y siempre visible en los posts propios (acción destructiva demasiado prominente). | Alto |
| D4 | La tarjeta lateral "Inicio"/"About" ocupa mucho espacio; en móvil empuja el feed hacia abajo antes del primer post. | Medio |
| D5 | Selectores nativos sin estilo en el dashboard (año, tipo de clasificación). | Medio |
| D6 | En móvil el icono del dashboard en la barra superior no tiene texto. | Bajo |
| D7 | Jerarquía débil: casi todo es negro sobre blanco con el mismo peso; los botones primarios y secundarios apenas se distinguen. | Medio |

## 2. Propuesta

### V0 · Arreglos rápidos (sin decisiones de diseño) — ✅ hecho
E1, E2, T1–T5 y D6. Resuelve E1, E2, E3, T1–T5 y D6 (este último solo con `aria-label`; el icono sigue sin texto visible en móvil, decisión de V1). Es corrección, no rediseño: textos y fechas en español (`date-fns/locale/es`), plural correcto, `aria-label` en español, barra lateral del dashboard que no tape el contenido (colapsada por defecto en móvil), mensajes de error en español con botón "Reintentar" en vez de redirigir al 404.

### V1 · Sistema de diseño — ✅ hecho (dirección B elegida)
- **Tokens** (colores, tipografía, espaciado, radios) en variables CSS de Tailwind/Shadcn, con **modo claro y oscuro** y selector de tema.
- **Identidad**: logotipo vectorial propio, color de acento y tratamiento de datos (números tabulares, tablas legibles). Sin logos ni colores oficiales de F1 ni de equipos como marca propia (ver R2 del plan).
- **Componentes base** coherentes: botones (primario/secundario/destructivo), tarjetas, tablas, estados vacío/carga/error, selectores con estilo.
- Revisión de accesibilidad: contraste AA, foco visible, objetivos táctiles ≥ 44 px, `prefers-reduced-motion`.

### V2 · Rediseño de pantallas clave
Feed y tarjeta de post (vista previa, acciones en menú), comunidad, y la pantalla que unirá comunidad y datos: el **hub de fin de semana de carrera** (resultados, hilo, votación de Piloto del Día, pronósticos).

## 3. Decisiones que necesito (D5)

1. **Rumbo**: ¿oscuro por defecto con acento rojo (estética de retransmisión/telemetría), claro tipo editorial, o ambos con selector? Mi recomendación: **oscuro por defecto con selector** y rojo solo como acento.
2. **Referencias**: ¿hay webs o apps que te gusten visualmente (de F1 o no)? Con dos o tres referencias acierto mucho más rápido que con adjetivos.
3. **Marca**: ¿se mantiene el nombre "FastLap" y el rojo, o también se replantea?
4. **Prioridad**: ¿V0 ahora y V1 después de la rebanada 3, o el rediseño antes que las páginas de datos? Recomiendo V0 ya; V1 antes de construir las pantallas nuevas de datos, para no rehacerlas dos veces.

## 4. Exploración de estilos (respuesta a D5)

Se maquetaron tres direcciones con los mismos datos de ejemplo (`docs/diseno/`): **A** Nothing puro, **B** Nothing con tablas de telemetría y **C** editorial claro como contraste. Las fuentes (Space Grotesk, Space Mono, Doto) y los tokens son los del proyecto `hub`; los datos son de ejemplo. Son maquetas estáticas, no código de la app.

### Qué hacen otros (fuentes secundarias; no he visto esas webs renderizadas)
- **F1 oficial:** vídeo primero, personalización por piloto/equipo, modo claro y oscuro y tamaños de letra adaptables ([F1](https://www.formula1.com/en/latest/article/formula-1-launches-new-website-and-personalised-mobile-app.1knZbPSCZ2tS2z6ADRn2Gs)).
- **Paneles de tiempos y telemetría** ([f1-dash](https://github.com/r4ai/f1-dash), [f1-telemetry](https://github.com/matteocelani/f1-telemetry)): fondo oscuro, torre de tiempos con posición, color de equipo, huecos y neumáticos, cifras tabulares y acentos de color neón.
- **Foros deportivos y plantillas modernas** (p. ej. [BigSoccer](https://www.themehouse.com/portfolio/bigsoccer-community), [Discusli](https://www.producthunt.com/products/discusli-community-forum-template)): lo que se persigue es evitar la fatiga de texto denso, con jerarquía tipográfica, respuestas anidadas legibles y modo oscuro/claro.
- **Nothing:** negro y blanco puros, un gris para lo secundario, tipografía de puntos solo para titulares, mono en mayúsculas para etiquetas ([análisis](https://www.shadcn.io/design/nothing)).

### ¿Pega Nothing con FastLap?
**En lo esencial, sí; para todo, no.**

- **Encaja muy bien en los datos:** una torre de tiempos F1 *ya es* mono + cifras tabulares + fondo oscuro + un acento. La clasificación en estilo Nothing (B) se ve natural. Rojo `#d71921` ≈ rojo F1.
- **Encaja con matices en el social:** el contenido de un foro es texto largo escrito por usuarios. El texto en mayúsculas con espaciado y la tipografía de puntos fatigan si se usan fuera de etiquetas y titulares. Los posts con vista previa o imagen piden tarjeta, no fila.
- **Regla de Nothing que habría que adaptar:** "rojo solo como interrupción". En FastLap el rojo funcionaría como señal de directo/alerta, no como color de botón; el botón principal sería blanco sobre negro (píldora). Y el color de equipo en la torre (pequeñas marcas) rompe el "un solo acento" de Nothing: es opcional y solo en vistas de datos, sin logos (R2 del plan).

### Las tres direcciones
| | Qué es | A favor | En contra |
|---|---|---|---|
| **A** Nothing puro | Filas con separadores, titular Doto enorme, todo monocromo | Identidad muy fuerte y coherente con tus otros proyectos; ligero | Un foro en filas oculta vistas previas e imágenes; el titular grande ocupa mucha pantalla en móvil |
| **B** Nothing + telemetría | Tarjetas para posts, módulo "próximo GP" con cuenta atrás en Doto, clasificación como torre de tiempos | Lo mejor de A con legibilidad de foro; la sección F1 gana mucho; el módulo "próximo GP" conecta con el hub de carrera y los pronósticos | Más componentes que mantener; los colores de equipo son decisión aparte |
| **C** Editorial claro | Fondo cálido, titulares grandes, tarjetas blancas, botón rojo | Muy legible, parece medio deportivo | Sin identidad propia; se parece a cualquier web de noticias; sin relación con tus otros proyectos |

### Recomendación
**B**, con estas reglas:
1. **Oscuro por defecto con selector claro/oscuro** (los tokens de `hub` ya definen ambos).
2. **Nothing en el marco y en los datos** (barra superior, etiquetas, controles segmentados, torre de tiempos, cifras); **lectura cómoda en el contenido** (Space Grotesk 16 px con interlineado 1,6, sin mayúsculas en texto de usuarios, tarjetas con vista previa).
3. **Doto una vez por pantalla** y solo en titulares o cifras grandes (cuenta atrás).
4. **Rojo solo como señal** (directo, error, aviso); botón principal blanco.
5. Contraste AA: el gris `#666` de Nothing no llega como texto; solo para elementos decorativos o desactivados.
6. Fuentes con `next/font/google` (hoy el proyecto usa Poppins, Gabarito e Inter, que se retirarían).

### Lo que falta
- Que elijas A, B o C (o una mezcla) y digas si el color de equipo en la torre te gusta.
- Si tienes **dos o tres webs concretas** que te gusten, pásamelas: lo que he podido consultar son descripciones, no páginas renderizadas, y con una captura tuya afino más.

## 5. Estado de V1

Elegida la dirección **B**. Implementado: tokens en CSS con tema oscuro por defecto y claro con selector (sin parpadeo al cargar), tipografías Space Grotesk / Space Mono / Doto, botones en píldora (primario invertido, destructivo con contorno rojo), barra superior nueva, y todos los colores fijos de la app sustituidos por tokens (también eliminadas las sombras). Reglas en `AGENTS.md`.

Queda para **V2** (rediseño de pantallas, con la dirección B de las maquetas): tarjeta de post con vista previa y acciones en menú, módulo de próximo GP en el feed, hub de carrera y la clasificación como torre de tiempos; además un logotipo vectorial propio (el actual es una línea muy fina y pequeña).

**Barra lateral del dashboard (rehecha):** se sustituyó por una navegación horizontal de secciones (`DashboardNav`, píldoras desplazables). Libera el ancho completo para tablas y gráficos, funciona igual en móvil y elimina el logotipo duplicado y el bloque flotante que se veía mal.

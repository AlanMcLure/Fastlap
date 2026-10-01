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

### V0 · Arreglos rápidos (sin decisiones de diseño)
E1, E2, T1–T5 y D6. Es corrección, no rediseño: textos y fechas en español (`date-fns/locale/es`), plural correcto, `aria-label` en español, barra lateral del dashboard que no tape el contenido (colapsada por defecto en móvil), mensajes de error en español con botón "Reintentar" en vez de redirigir al 404.

### V1 · Sistema de diseño (necesita decisión D5)
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

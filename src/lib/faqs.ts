export interface Faq {
  question: string
  answer: string
}

/** Email shown for support (also used on the 404 page). */
export const SUPPORT_EMAIL = 'fastlapsoporte@gmail.com'

/**
 * Keep every answer true to what the app does today: this page is public, indexed and
 * published as FAQPage structured data. When a feature changes, change its answer here.
 */
export const FAQS: Faq[] = [
  {
    question: '¿Qué es FastLap?',
    answer:
      'Una red social en español para aficionados de la Fórmula 1. Hay comunidades donde publicar y comentar, un hilo por cada fin de semana de Gran Premio, ligas de pronósticos y un panel con los datos de la temporada.',
  },
  {
    question: '¿Cómo me registro?',
    answer:
      'Pulsa «Iniciar sesión» en la esquina superior derecha y entra con tu cuenta de Google. Si es tu primera vez, la cuenta se crea sola y se te asigna un nombre de usuario que puedes cambiar en Ajustes.',
  },
  {
    question: '¿Cuesta algo usar FastLap?',
    answer: 'No. Por ahora todas las funciones son gratuitas.',
  },
  {
    question: '¿Cómo creo una comunidad?',
    answer:
      'Con la sesión iniciada, abre el menú de tu cuenta y elige «Crear Comunidad». El nombre tiene de 3 a 21 caracteres (letras, números y guiones bajos) y de momento no se puede cambiar después.',
  },
  {
    question: '¿Qué es el hilo de un Gran Premio?',
    answer:
      'Cada fin de semana de carrera tiene su página con un hilo para comentar las sesiones, el resultado de los diez primeros y la votación de Piloto del Día. El hilo se abre con la primera sesión de libres y la votación, cuando termina la carrera y se publican los resultados; dura 48 horas.',
  },
  {
    question: '¿Cómo funcionan los pronósticos?',
    answer:
      'El creador de una comunidad puede abrir una liga para la temporada. Cualquier usuario con sesión elige el podio de la próxima carrera (y la vuelta rápida, si quiere) y puede cambiarlo hasta que empieza la clasificación. Con las reglas habituales se dan 5 puntos por cada puesto exacto, 2 si el piloto acaba en el podio en otro puesto y 3 por la vuelta rápida; cada liga puede fijar las suyas. Los puntos se calculan solos con los resultados oficiales.',
  },
  {
    question: '¿Hay una clasificación general de pronósticos?',
    answer:
      'Sí, en la sección «Pronósticos». Reúne los pronósticos de todas las ligas con las mismas reglas para todos y, si pronosticas la misma carrera en varias ligas, cuenta el primer pronóstico que enviaste.',
  },
  {
    question: '¿Dónde veo los datos de la Fórmula 1?',
    answer:
      'Con la sesión iniciada, en la sección «F1»: calendario, clasificaciones de pilotos y constructores, pilotos con sus estadísticas y detalle de cada carrera, también de temporadas pasadas. Los resultados pueden tardar un poco en aparecer tras terminar una carrera. Los datos proceden de Jolpica-F1 y se usan bajo licencia CC BY-NC-SA 4.0.',
  },
  {
    question: '¿Cómo cambio mi nombre de usuario o mi foto?',
    answer: 'En «Ajustes», dentro del menú de tu cuenta. El nombre de usuario es único y admite letras, números y guiones bajos.',
  },
  {
    question: '¿Qué hago si veo contenido inadecuado?',
    answer:
      'Usa «Denunciar» en la publicación (menú «⋯») o en el comentario. Un moderador lo revisará y, si incumple las normas, lo eliminará y avisará a su autor.',
  },
  {
    question: '¿FastLap tiene relación con la Fórmula 1 o con los equipos?',
    answer:
      'No. FastLap es un proyecto independiente de aficionados y no está afiliado a Formula 1, a la FIA ni a ningún equipo o piloto. Los nombres se usan solo para informar.',
  },
  {
    question: '¿Cómo contacto con el soporte?',
    answer: `Escribe a ${SUPPORT_EMAIL}.`,
  },
]

/** schema.org FAQPage for the same questions. */
export function faqJsonLd(faqs: Faq[] = FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

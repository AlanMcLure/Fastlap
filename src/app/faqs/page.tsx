// /app/faqs/page.tsx

'use client';

import React from 'react';
import FAQItem from '@/components/FAQItem';

const faqData = [
  {
    question: '¿Cuál es el propósito de este sitio web?',
    answer: 'Este sitio web está diseñado para proporcionar información sobre las últimas noticias y eventos en el mundo de la Fórmula 1.'
  },
  {
    question: '¿Cómo puedo registrarme en el sitio?',
    answer: 'Para registrarte, simplemente haz clic en el botón "Registrarse" en la parte superior derecha y sigue las instrucciones.'
  },
  {
    question: '¿Puedo acceder a las estadísticas de carreras pasadas?',
    answer: 'Sí, puedes acceder a las estadísticas de carreras pasadas a través de la sección "Resultados" en el menú principal.'
  },
  {
    question: '¿Cómo puedo contactar con el soporte?',
    answer: 'Puedes contactar con el soporte enviando un correo electrónico a fastlapsoporte@gmail.com.'
  }
];

const FAQPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl md:text-4xl mb-4">Preguntas Frecuentes (FAQs)</h1>
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQPage;

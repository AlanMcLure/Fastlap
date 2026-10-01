import JsonLd from '@/components/JsonLd'
import { FAQS, faqJsonLd } from '@/lib/faqs'

// Server component with native <details>: indexable, accessible and no JavaScript needed.
const FAQPage = () => (
  <div className='mx-auto max-w-3xl space-y-8 py-6'>
    <JsonLd data={faqJsonLd()} />
    <header>
      <p className='label'>AYUDA</p>
      <h1 className='mt-2 text-3xl font-bold text-display md:text-4xl'>Preguntas frecuentes</h1>
    </header>

    <div className='divide-y divide-border rounded-xl border border-input bg-card'>
      {FAQS.map((faq) => (
        <details key={faq.question} className='group px-5 py-4'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-lg text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'>
            {faq.question}
            <span aria-hidden='true' className='font-mono text-muted-foreground group-open:hidden'>+</span>
            <span aria-hidden='true' className='hidden font-mono text-muted-foreground group-open:inline'>−</span>
          </summary>
          <p className='mt-3 leading-7 text-muted-foreground'>{faq.answer}</p>
        </details>
      ))}
    </div>
  </div>
)

export default FAQPage

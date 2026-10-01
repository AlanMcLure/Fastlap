import { describe, expect, it } from 'vitest'

import { FAQS, SUPPORT_EMAIL, faqJsonLd } from './faqs'

describe('FAQS', () => {
  it('has unique non-empty questions and answers', () => {
    expect(new Set(FAQS.map((f) => f.question)).size).toBe(FAQS.length)
    for (const f of FAQS) {
      expect(f.question.trim().length).toBeGreaterThan(5)
      expect(f.answer.trim().length).toBeGreaterThan(5)
    }
  })

  it('does not promise features that do not exist', () => {
    const text = FAQS.map((f) => f.answer).join(' ')
    expect(text).not.toMatch(/Registrarse|«Resultados»|noticias/i)
  })

  it('mentions the support email once, matching the constant', () => {
    expect(FAQS.filter((f) => f.answer.includes(SUPPORT_EMAIL))).toHaveLength(1)
  })
})

describe('faqJsonLd', () => {
  it('is a FAQPage with one Question per FAQ', () => {
    const data = faqJsonLd()
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(FAQS.length)
    expect(data.mainEntity[0]).toMatchObject({ '@type': 'Question', name: FAQS[0].question, acceptedAnswer: { text: FAQS[0].answer } })
  })
})

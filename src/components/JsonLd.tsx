import { jsonLd } from '@/lib/seo'

/** Structured data for search engines. Rendered on the server; `<` is escaped (see `jsonLd`). */
const JsonLd = ({ data }: { data: unknown }) => (
  <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
)

export default JsonLd

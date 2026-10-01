import type { ZodError } from 'zod'

/** The F1 API answered with an error status, or could not be reached. */
export class F1ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string
  ) {
    super(message)
    this.name = 'F1ApiError'
  }
}

/** The F1 API answered 200 but the body does not match the expected shape. */
export class F1SchemaError extends Error {
  constructor(
    readonly url: string,
    readonly issues: ZodError['issues']
  ) {
    const first = issues[0]
    super(
      `Unexpected F1 API response for ${url}: ${first?.path.join('.') || '(root)'} — ${first?.message}`
    )
    this.name = 'F1SchemaError'
  }
}

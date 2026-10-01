import { readFileSync } from 'node:fs'
import path from 'node:path'

const dir = path.join(__dirname, '__fixtures__')

/** Read a fixture (parsed JSON). Pass `real/<name>` for captured real responses. */
export const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'))

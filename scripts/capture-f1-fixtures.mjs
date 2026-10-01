/* eslint-disable no-console -- CLI script */
// Saves real Jolpica-F1 responses to src/lib/f1/__fixtures__/real/ so that
// `yarn test` can check the Zod schemas against them (src/lib/f1/contract.test.ts).
// Needs internet access. Run: node scripts/capture-f1-fixtures.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const base = (process.env.ERGAST_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1').replace(/\/$/, '')
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/lib/f1/__fixtures__/real')

// A closed season is used so the captured data is stable.
const endpoints = {
  calendar: '2024.json?limit=100',
  'driver-standings': '2024/driverStandings.json?limit=100',
  'constructor-standings': '2024/constructorStandings.json?limit=100',
  'race-results': '2024/1/results.json?limit=100',
  drivers: '2024/drivers.json?limit=100',
  pitstops: '2024/1/pitstops.json?limit=100',
  'driver-results': 'drivers/norris/results.json?limit=100',
}

await mkdir(out, { recursive: true })
for (const [name, endpoint] of Object.entries(endpoints)) {
  const url = `${base}/${endpoint}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} answered ${res.status}`)
  await writeFile(path.join(out, `${name}.json`), JSON.stringify(await res.json(), null, 2) + '\n')
  console.log('saved', name)
  await new Promise((r) => setTimeout(r, 400)) // stay under 4 requests/second
}

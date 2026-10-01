// ergast.com was shut down at the end of the 2024 season. Jolpica-F1 is its
// drop-in successor (same paths and JSON shape). Override with ERGAST_BASE_URL.
// Jolpica rate limits: 4 requests/second, 500 requests/hour per IP.
export const ERGAST_BASE_URL =
  process.env.ERGAST_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1'

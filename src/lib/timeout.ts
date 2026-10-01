/** Rejects when `promise` does not settle within `ms` (the work itself is not cancelled). */
export const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

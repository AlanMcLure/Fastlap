import type { Circuit } from './schemas'

// Pure helpers for the history pages (circuits, records).

const CIRCUIT_TYPE: Record<string, string> = { RACE: 'Permanente', ROAD: 'Carretera', STREET: 'Urbano' }
const DIRECTION: Record<string, string> = { CLOCKWISE: 'sentido horario', ANTI_CLOCKWISE: 'sentido antihorario' }

/** Short facts for a circuit header: "Permanente · sentido horario · 5.793 km". */
export function circuitFacts(circuit: Pick<Circuit, 'type' | 'direction' | 'length'>): string[] {
  return [
    CIRCUIT_TYPE[circuit.type] ?? circuit.type,
    circuit.direction ? DIRECTION[circuit.direction] ?? circuit.direction : null,
    circuit.length ? `${circuit.length.toLocaleString('es-ES')} km` : null,
  ].filter((fact): fact is string => fact !== null)
}

/** Share as a percentage with one decimal, or null when there is nothing to divide. */
export function percentage(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : null
}

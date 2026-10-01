import { describe, expect, it } from 'vitest'
import { anonymizeActor, confirmationMatches, deletionBlocker, isReservedUsername } from './accountRules'

describe('accountRules', () => {
  it('reserva los nombres del sistema sin distinguir mayúsculas', () => {
    expect(isReservedUsername('Eliminado')).toBe(true)
    expect(isReservedUsername('fastlap')).toBe(true)
    expect(isReservedUsername('ana_f1')).toBe(false)
  })

  it('no deja borrar administradores', () => {
    expect(deletionBlocker('ADMIN')).toMatch(/administrador/)
    expect(deletionBlocker('USER')).toBeNull()
    expect(deletionBlocker('PREMIUM')).toBeNull()
  })

  it('la confirmación exige el nombre de usuario exacto', () => {
    expect(confirmationMatches('ana_f1', 'ana_f1')).toBe(true)
    expect(confirmationMatches('  ana_f1 ', 'ana_f1')).toBe(true)
    expect(confirmationMatches('ANA_F1', 'ana_f1')).toBe(false)
    expect(confirmationMatches('', 'ana_f1')).toBe(false)
    expect(confirmationMatches('x', null)).toBe(false)
  })

  it('quita el nombre del actor en las notificaciones ajenas', () => {
    expect(anonymizeActor('u/ana ha respondido a tu comentario: «hola»', 'ana')).toBe(
      'Un usuario ha respondido a tu comentario: «hola»'
    )
    expect(anonymizeActor('u/ana2 ha comentado', 'ana')).toBe('u/ana2 ha comentado')
    expect(anonymizeActor('r/f1: sin cambios', 'ana')).toBe('r/f1: sin cambios')
  })
})

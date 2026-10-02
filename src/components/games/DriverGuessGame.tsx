'use client'

import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { FC, FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import ScrollRegion from '@/components/ScrollRegion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { toast } from '@/hooks/use-toast'
import {
  ageOn,
  EMPTY_STATS,
  findByName,
  MAX_ATTEMPTS,
  recordResult,
  shareText,
  type Compare,
  type Feedback,
  type GameDriver,
  type GameStats,
} from '@/lib/games/driverGuess'

interface Props {
  /** Day key (Spain) of the puzzle this page was rendered for. */
  date: string
  season: number
  pool: Pick<GameDriver, 'id' | 'name'>[]
}

interface Attempt {
  driver: GameDriver
  feedback: Feedback
}

interface SavedGame {
  date: string
  attempts: Attempt[]
  status: 'playing' | 'won' | 'lost'
  answer: GameDriver | null
}

interface GuessResponse {
  guess: GameDriver
  feedback: Feedback
  solved: boolean
  answer: GameDriver | null
}

const GAME_KEY = 'fastlap-adivina-piloto'
const STATS_KEY = 'fastlap-adivina-piloto-stats'
const CHANGE_EVENT = 'fastlap-game-change'

// Progress lives only in this browser (localStorage); nothing about the game is sent or stored on the server.
const read = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    // private mode or blocked storage: the game still works until the page is closed
  }
}
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const ARROW: Record<Compare, string> = { equal: '✓', higher: '↑', lower: '↓', unknown: '–' }
const SR: Record<Compare, string> = {
  equal: 'coincide',
  higher: 'el piloto secreto tiene más',
  lower: 'el piloto secreto tiene menos',
  unknown: 'sin dato',
}

const Cell: FC<{ value: string; state: Compare | boolean }> = ({ value, state }) => {
  const kind: Compare = state === true ? 'equal' : state === false ? 'unknown' : state
  const correct = kind === 'equal'
  const wrong = state === false
  return (
    <td className='relative p-1.5 text-center align-middle'>
      <div
        className={`mx-auto flex min-w-[4.5rem] flex-col items-center rounded-md border px-1.5 py-1 text-xs ${
          correct ? 'border-success text-success' : 'border-input text-foreground'
        }`}>
        <span className='font-mono'>{value}</span>
        <span aria-hidden='true' className={`text-sm ${correct ? '' : 'text-muted-foreground'}`}>
          {wrong ? '✗' : ARROW[kind]}
        </span>
        <span className='sr-only'>{wrong ? 'no coincide' : SR[kind]}</span>
      </div>
    </td>
  )
}

const DriverGuessGame: FC<Props> = ({ date, season, pool }) => {
  const rawGame = useSyncExternalStore(subscribe, () => read(GAME_KEY), () => null)
  const rawStats = useSyncExternalStore(subscribe, () => read(STATS_KEY), () => null)
  const [text, setText] = useState('')

  const game = useMemo<SavedGame>(() => {
    const saved = parse<SavedGame | null>(rawGame, null)
    return saved && saved.date === date ? saved : { date, attempts: [], status: 'playing', answer: null }
  }, [rawGame, date])
  const stats = useMemo(() => parse<GameStats>(rawStats, EMPTY_STATS), [rawStats])

  const { mutate: guess, isPending } = useMutation({
    mutationFn: async (driverId: string) => {
      const { data } = await axios.post<GuessResponse>('/api/juegos/adivina-piloto', {
        driverId,
        date,
        attempt: game.attempts.length + 1,
      })
      return data
    },
    onSuccess: (data) => {
      const attempts = [...game.attempts, { driver: data.guess, feedback: data.feedback }]
      const lost = !data.solved && attempts.length >= MAX_ATTEMPTS
      const status: SavedGame['status'] = data.solved ? 'won' : lost ? 'lost' : 'playing'
      write(GAME_KEY, { date, attempts, status, answer: data.answer } satisfies SavedGame)
      if (status !== 'playing') write(STATS_KEY, recordResult(stats, date, status === 'won'))
      setText('')
    },
    onError: (err) => {
      const status = err instanceof AxiosError ? err.response?.status : undefined
      toast({
        title: status === 409 ? 'Ha cambiado el día' : 'No se ha podido enviar',
        description:
          status === 409
            ? 'Hay un piloto nuevo. Recarga la página para jugar.'
            : status === 429
              ? 'Demasiados intentos seguidos. Espera un momento.'
              : 'Inténtalo de nuevo en unos segundos.',
        variant: 'destructive',
      })
    },
  })

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const found = findByName(pool, text)
      if (!found) {
        toast({ title: 'Piloto no reconocido', description: 'Elige uno de la lista.', variant: 'destructive' })
        return
      }
      if (game.attempts.some((a) => a.driver.id === found.id)) {
        toast({ title: 'Ya lo has probado', description: 'Elige otro piloto.', variant: 'destructive' })
        return
      }
      guess(found.id)
    },
    [pool, text, game.attempts, guess]
  )

  const share = async () => {
    const message = shareText(date, game.attempts.map((a) => a.feedback), game.status === 'won', `${window.location.origin}/juegos/adivina-piloto`)
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: message })
        return
      }
      await navigator.clipboard.writeText(message)
      toast({ description: 'Resultado copiado al portapapeles.' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast({ title: 'No se ha podido compartir', variant: 'destructive' })
    }
  }

  const over = game.status !== 'playing'
  const left = MAX_ATTEMPTS - game.attempts.length
  const now = useMemo(() => new Date(), [])

  return (
    <div className='space-y-6'>
      {!over && (
        <form onSubmit={submit} className='flex flex-col gap-2 sm:flex-row'>
          <div className='flex-1'>
            <Label htmlFor='piloto' className='sr-only'>
              Nombre del piloto
            </Label>
            <Input
              id='piloto'
              list='pilotos'
              autoComplete='off'
              autoCapitalize='words'
              placeholder='Escribe un piloto…'
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isPending}
            />
            <datalist id='pilotos'>
              {pool.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>
          <Button type='submit' isLoading={isPending} disabled={!text.trim()}>
            Probar
          </Button>
        </form>
      )}

      <p className='label' aria-live='polite'>
        {over ? 'PARTIDA TERMINADA' : `INTENTO ${game.attempts.length + 1} DE ${MAX_ATTEMPTS} · QUEDAN ${left}`}
      </p>

      {game.attempts.length > 0 && (
        <ScrollRegion label='Tus intentos'>
          <table className='w-full min-w-[34rem] border-collapse text-sm'>
            <caption className='sr-only'>Intentos y pistas</caption>
            <thead>
              <tr className='label text-left'>
                <th scope='col' className='p-2'>PILOTO</th>
                <th scope='col' className='p-2 text-center'>NAC.</th>
                <th scope='col' className='p-2 text-center'>EQUIPO</th>
                <th scope='col' className='p-2 text-center'>Nº</th>
                <th scope='col' className='p-2 text-center'>EDAD</th>
                <th scope='col' className='p-2 text-center'>VICT.</th>
                <th scope='col' className='p-2 text-center'>PTS</th>
              </tr>
            </thead>
            <tbody>
              {game.attempts.map(({ driver, feedback }) => (
                <tr key={driver.id} className='border-t border-border'>
                  <th scope='row' className='p-2 text-left font-medium text-foreground'>{driver.name}</th>
                  <Cell value={driver.nationality} state={feedback.nationality} />
                  <Cell value={driver.team ?? '—'} state={feedback.team} />
                  <Cell value={driver.number === null ? '—' : String(driver.number)} state={feedback.number} />
                  <Cell value={String(ageOn(driver.birthDate, now))} state={feedback.age} />
                  <Cell value={String(driver.wins)} state={feedback.wins} />
                  <Cell value={String(driver.points)} state={feedback.points} />
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}

      {over && (
        <section aria-label='Resultado' className='space-y-4 rounded-2xl border border-input bg-card p-5'>
          <h2 className='text-xl font-semibold text-display'>
            {game.status === 'won' ? `¡Acertaste en ${game.attempts.length} ${game.attempts.length === 1 ? 'intento' : 'intentos'}!` : 'Hoy no ha podido ser'}
          </h2>
          {game.answer && (
            <p className='text-sm text-muted-foreground'>
              El piloto era <strong className='text-foreground'>{game.answer.name}</strong>
              {game.answer.team ? ` (${game.answer.team})` : ''}. Vuelve mañana para el siguiente.
            </p>
          )}
          <dl className='grid grid-cols-3 gap-3 text-center'>
            <div>
              <dt className='label'>RACHA</dt>
              <dd className='font-mono text-lg text-foreground'>{stats.streak}</dd>
            </div>
            <div>
              <dt className='label'>MEJOR</dt>
              <dd className='font-mono text-lg text-foreground'>{stats.best}</dd>
            </div>
            <div>
              <dt className='label'>VICTORIAS</dt>
              <dd className='font-mono text-lg text-foreground'>
                {stats.wins}/{stats.played}
              </dd>
            </div>
          </dl>
          <Button type='button' variant='outline' onClick={share}>
            Compartir resultado
          </Button>
        </section>
      )}

      <p className='text-xs text-muted-foreground'>
        Temporada {season}. Tu progreso se guarda solo en este navegador; no hace falta cuenta.
      </p>
    </div>
  )
}

export default DriverGuessGame

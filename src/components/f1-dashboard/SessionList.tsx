import { weekendSessions } from '@/lib/f1/calendar'
import type { Race } from '@/lib/f1/schemas'

import LocalTime from './LocalTime'

/** The sessions of a race weekend with their start in the viewer's time zone. */
const SessionList = ({ race }: { race: Race }) => (
  <ol className='divide-y divide-border overflow-hidden rounded-xl border border-border bg-card'>
    {weekendSessions(race).map((session) => (
      <li
        key={session.key}
        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 ${
          session.key === 'Race' ? 'text-display' : 'text-foreground'
        }`}>
        <span className={session.key === 'Race' ? 'font-medium' : ''}>{session.label}</span>
        <span className='label'>
          <LocalTime iso={session.start.toISOString()} timeKnown={session.timeKnown} />
        </span>
      </li>
    ))}
  </ol>
)

export default SessionList

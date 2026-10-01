import { fastestPitStop, type DriverPitStops } from '@/lib/f1/race'
import ScrollRegion from '@/components/ScrollRegion'

/** Pit stops of the race per driver, in finishing order, with the quickest stop of the race highlighted. */
const PitStopsTable = ({ groups }: { groups: DriverPitStops[] }) => {
  const fastest = fastestPitStop(groups)

  return (
    <div className='space-y-3'>
      {fastest && (
        <p className='label'>
          PARADA MÁS RÁPIDA · <span className='text-display'>{fastest.code}</span> · {fastest.seconds.toFixed(1)} S
        </p>
      )}
      <ScrollRegion label='Tabla de paradas por piloto'>
        <table className='w-full border-collapse text-left tabular-nums'>
          <caption className='sr-only'>Paradas en boxes por piloto</caption>
          <thead>
            <tr className='label border-b border-border'>
              <th scope='col' className='px-4 py-3 font-normal'>PILOTO</th>
              <th scope='col' className='w-20 px-2 py-3 text-right font-normal'>PARADAS</th>
              <th scope='col' className='px-4 py-3 font-normal'>DETALLE (VUELTA · DURACIÓN)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.driverId} className='border-b border-border last:border-0'>
                <td className='px-4 py-3 font-mono font-bold tracking-wide text-display'>{group.code}</td>
                <td className='px-2 py-3 text-right font-mono text-foreground'>{group.stops.length}</td>
                <td className='px-4 py-3'>
                  <ul className='flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-muted-foreground'>
                    {group.stops.map((stop) => (
                      <li key={stop.stop}>
                        V{stop.lap} ·{' '}
                        <span className={fastest && stop.seconds === fastest.seconds && group.code === fastest.code ? 'text-display' : 'text-foreground'}>
                          {stop.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  )
}

export default PitStopsTable

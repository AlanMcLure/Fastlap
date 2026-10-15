/** Credits required by the data licences: F1DB (CC BY 4.0) and, for 2023+ sessions, OpenF1. */
const StatsAttribution = ({ detailed }: { detailed: boolean }) => (
  <p className='border-t border-border pt-4 text-xs text-muted-foreground'>
    Datos históricos de{' '}
    <a href='https://github.com/f1db/f1db' className='underline underline-offset-4 hover:text-display' rel='noreferrer' target='_blank'>
      F1DB
    </a>{' '}
    (CC BY 4.0)
    {detailed && (
      <>
        {' '}y datos de sesión de{' '}
        <a href='https://openf1.org' className='underline underline-offset-4 hover:text-display' rel='noreferrer' target='_blank'>
          OpenF1
        </a>{' '}
        (CC BY-NC-SA 4.0, uso no comercial)
      </>
    )}
    . FastLap no está afiliado a la Fórmula 1.
  </p>
)

export default StatsAttribution

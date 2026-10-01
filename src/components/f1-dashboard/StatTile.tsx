interface StatTileProps {
  label: string
  value: string | number
  detail?: string
}

/** One number with its label (careers, seasons...). */
const StatTile = ({ label, value, detail }: StatTileProps) => (
  <div className='rounded-xl border border-border bg-card p-4'>
    <p className='label'>{label}</p>
    <p className='mt-2 font-mono text-3xl tabular-nums text-display'>{value}</p>
    {detail && <p className='label mt-1 normal-case tracking-normal'>{detail}</p>}
  </div>
)

export default StatTile

interface Option {
  id: string
  code: string
}

interface CompareDriversFormProps {
  action: string
  session: string
  options: Option[]
  a: string
  b: string
}

/** Picks the two drivers of the lap-by-lap comparison. A plain GET form: works without JavaScript. */
const CompareDriversForm = ({ action, session, options, a, b }: CompareDriversFormProps) => (
  <form action={action} method='get' className='flex flex-wrap items-end gap-3'>
    <input type='hidden' name='sesion' value={session} />
    {(['a', 'b'] as const).map((name, index) => (
      <label key={name} className='flex flex-col gap-1'>
        <span className='label'>PILOTO {index + 1}</span>
        <select name={name} defaultValue={name === 'a' ? a : b}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code}
            </option>
          ))}
        </select>
      </label>
    ))}
    <button
      type='submit'
      className='label rounded-full border border-input px-4 py-2.5 text-display transition-colors hover:border-display'>
      COMPARAR
    </button>
  </form>
)

export default CompareDriversForm

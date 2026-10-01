'use client'

function CustomCodeRenderer({ data }: any) {
  (data)

  return (
    <pre className='bg-card border border-border rounded-md p-4'>
      <code className='text-foreground text-sm'>{data.code}</code>
    </pre>
  )
}

export default CustomCodeRenderer

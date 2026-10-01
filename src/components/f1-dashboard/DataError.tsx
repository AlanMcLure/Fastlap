import { Button } from '@/components/ui/Button'

interface DataErrorProps {
  message?: string
  onRetry?: () => void
}

/** Shown when the F1 data could not be loaded (instead of a raw error or a 404). */
const DataError = ({
  message = 'No se han podido cargar los datos de F1. Inténtalo de nuevo en unos minutos.',
  onRetry,
}: DataErrorProps) => (
  <div role='alert' className='flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center'>
    <p className='text-gray-800'>{message}</p>
    {onRetry && (
      <Button variant='outline' onClick={onRetry}>
        Reintentar
      </Button>
    )}
  </div>
)

export default DataError

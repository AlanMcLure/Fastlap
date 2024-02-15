import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { FC } from 'react'

interface EditButtonProps {
    seccion: string
    id: string | number
}

const EditButton: FC<EditButtonProps> = ({ seccion, id }) => {
    return (
        <Link href={`/f1-dashboard/${seccion}/${id}/edit`}>
            <Button
                size='default' variant='subtle'>
                Editar
            </Button>
        </Link>
    )
}

export default EditButton
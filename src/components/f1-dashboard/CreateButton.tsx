import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { FC } from 'react'

interface CreateButtonProps {
    seccion: string
}

const CreateButton: FC<CreateButtonProps> = ({ seccion }) => {
    return (
        <Link href={`/f1-dashboard/${seccion}/create`}>
            <Button
                size='default'>
                Crear
            </Button>
        </Link>
    )
}

export default CreateButton
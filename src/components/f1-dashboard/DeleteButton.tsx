import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FC, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { authenticated } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface DeleteButtonProps {
    id: string,
    seccion: string,
    onSuccess: () => void,
    onError: () => void,
    genero: 'masculino' | 'femenino'
}

const DeleteButton: FC<DeleteButtonProps> = ({ id, seccion, onSuccess, onError, genero }) => {
    const queryClient = useQueryClient()
    const { data: session } = useSession()

    const [isDialogOpen, setDialogOpen] = useState(false)

    const handleDelete = () => {
        setDialogOpen(false)
        deleteItem()
    }

    const openDialog = () => {
        setDialogOpen(true)
    }

    const { mutate: deleteItem } = useMutation({
        mutationFn: async () => {
            // const { data } = await axios.delete(`http://localhost:8083/${seccion}/${id}`)
            const data = await authenticated(`http://localhost:8083/${seccion}/${id}`, session, { method: 'DELETE' })

            if (!data) {
                throw new Error(`Error al eliminar el ${seccion}`);
            }

            return data;
        },
        onError: () => {
            onError()
        },
        onSuccess: () => {
            queryClient.invalidateQueries([seccion]) // Invalida todas las consultas con la clave del endpoint

            onSuccess()
        },
    })

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <Button
                className='bg-red-700 text-white'
                onClick={openDialog}
                variant='destructive'
                size='sm'>
                Borrar
                <Trash2 className='ml-1.5' size={16} />
            </Button>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Estás seguro de que quieres borrar {genero === 'masculino' ? 'este' : 'esta'} {seccion}?</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button size='xs' variant='outline' type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button size='xs' type="submit" onClick={handleDelete}>Confirmar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteButton
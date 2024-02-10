'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/hooks/use-toast'
import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { CreatePilotoPayload } from '@/lib/validators/piloto'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BackButton from '@/components/BackButton'

const Page = () => {
    const router = useRouter()
    const [nombre, setNombre] = useState<string>('')
    const [fechaNac, setFechaNac] = useState<string>('')
    const [nacionalidad, setNacionalidad] = useState<string>('')
    const [img, setImg] = useState<string>('')
    const [imgFlag, setImgFlag] = useState<string>('')
    const [lugarNac, setLugarNac] = useState<string>('')
    const [casco, setCasco] = useState<string>('')
    const { loginToast } = useCustomToasts()

    const { mutate: createPiloto, isLoading } = useMutation({
        mutationFn: async () => {
            const payload: CreatePilotoPayload = {
                nombre,
                fecha_nac: fechaNac,
                nacionalidad,
                img_flag: imgFlag,
                img,
                lugar_nac: lugarNac,
                casco,
            }

            const { data } = await axios.post('/api/piloto', payload)
            return data as string
        },
        onError: (err) => {
            if (err instanceof AxiosError) {
                if (err.response?.status === 409) {
                    return toast({
                        title: 'Piloto already exists.',
                        description: 'Please choose a different name.',
                        variant: 'destructive',
                    })
                }

                if (err.response?.status === 422) {
                    return toast({
                        title: 'Invalid piloto name.',
                        description: 'Please choose a name between 3 and 21 letters.',
                        variant: 'destructive',
                    })
                }

                if (err.response?.status === 401) {
                    return loginToast()
                }
            }

            toast({
                title: 'There was an error.',
                description: 'Could not create piloto.',
                variant: 'destructive',
            })
        },
        onSuccess: (data) => {
            router.push(`/p/${data}`)
        },
    })

    return (
        <div className='container flex flex-col items-start h-full max-w-3xl mx-auto'>
            <div className='w-full'>
                <BackButton defaultPath="/f1-dashboard/pilotos" backText="Volver al Dashboard" />
            </div>
            <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
                <div className='flex justify-between items-center'>
                    <h1 className='text-xl font-semibold'>Editar Piloto</h1>
                </div>

                <hr className='bg-red-500 h-px' />

                <div>
                    <p className='text-lg font-medium'>Nombre</p>
                    <div className='relative'>
                        <Input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className='pl-6'
                        />
                    </div>
                    <p className='text-lg font-medium'>Fecha de Nacimiento</p>
                    <div className='relative'>
                        <Input
                            value={fechaNac}
                            onChange={(e) => setFechaNac(e.target.value)}
                            className='pl-6'
                        />
                    </div>
                    <p className='text-lg font-medium'>Nacionalidad</p>
                    <div className='relative'>
                        <Input
                            value={nacionalidad}
                            onChange={(e) => setNacionalidad(e.target.value)}
                            className='pl-6'
                        />
                    </div>
                    <p className='text-lg font-medium'>Imagen (URL)</p>
                    <div className='relative'>
                        <Input
                            value={img}
                            onChange={(e) => setImg(e.target.value)}
                            className='pl-6'
                        />
                    </div>
                </div>

                <div className='flex justify-end gap-4'>
                    <Button
                        disabled={isLoading}
                        variant='subtle'
                        onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button
                        isLoading={isLoading}
                        disabled={nombre.length === 0 || fechaNac.length === 0 || nacionalidad.length === 0 || img.length === 0}
                        onClick={() => createPiloto()}>
                        Crear Piloto
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Page
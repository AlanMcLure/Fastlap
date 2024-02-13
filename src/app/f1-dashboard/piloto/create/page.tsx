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
import PilotoForm from '@/components/f1-dashboard/PilotoForm'

const Page = () => {
    const router = useRouter()
    const { loginToast } = useCustomToasts()

    // const { mutate: createPiloto, isLoading } = useMutation({
    //     mutationFn: async () => {
    //         const payload: CreatePilotoPayload = {
    //             nombre: nombre || null,
    //             fecha_nac: fechaNac || null,
    //             nacionalidad: nacionalidad || null,
    //             img_flag: imgFlag || null,
    //             img: img || null,
    //             lugar_nac: lugarNac || null,
    //             casco: casco || null,
    //         }

    //         console.log(payload)

    //         const { data } = await axios.post('http://localhost:8083/piloto', payload)
    //         return data as string
    //     },
    //     onError: (err) => {
    //         if (err instanceof AxiosError) {
    //             if (err.response?.status === 409) {
    //                 return toast({
    //                     title: 'Piloto already exists.',
    //                     description: 'Please choose a different name.',
    //                     variant: 'destructive',
    //                 })
    //             }

    //             if (err.response?.status === 422) {
    //                 return toast({
    //                     title: 'Invalid piloto name.',
    //                     description: 'Please choose a name between 3 and 21 letters.',
    //                     variant: 'destructive',
    //                 })
    //             }

    //             if (err.response?.status === 401) {
    //                 return loginToast()
    //             }
    //         }

    //         toast({
    //             title: 'There was an error.',
    //             description: 'Could not create piloto.',
    //             variant: 'destructive',
    //         })
    //     },
    //     onSuccess: (data) => {
    //         router.push(`/f1-dashboard/piloto/${data}`)
    //     },
    // })

    return (
        <div className='container flex flex-col items-start h-full max-w-3xl mx-auto'>
            <div className='w-full'>
                <BackButton defaultPath="/f1-dashboard/pilotos" backText="Volver al Dashboard" />
            </div>
            <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
                <div className='flex justify-between items-center'>
                    <h1 className='text-xl font-semibold'>Crear un Piloto</h1>
                </div>

                <hr className='bg-red-500 h-px' />

                <PilotoForm
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    )
}

export default Page
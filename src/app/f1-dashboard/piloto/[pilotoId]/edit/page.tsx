'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/hooks/use-toast'
import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { UpdatePilotoPayload } from '@/lib/validators/piloto'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BackButton from '@/components/BackButton'
import PilotoForm from '@/components/f1-dashboard/PilotoForm'

interface PageProps {
    params: {
        pilotoId: string;
    };
}

const Page: React.FC<PageProps> = ({ params }) => {
    const pilotoId = params.pilotoId
    const router = useRouter()
    // const [nombre, setNombre] = useState<string>('')
    // const [fechaNac, setFechaNac] = useState<string>('')
    // const [nacionalidad, setNacionalidad] = useState<string>('')
    // const [img, setImg] = useState<string>('')
    // const [imgFlag, setImgFlag] = useState<string>('')
    // const [lugarNac, setLugarNac] = useState<string>('')
    // const [casco, setCasco] = useState<string>('')
    // const { loginToast } = useCustomToasts()


    return (
        <div className='container flex flex-col items-start h-full max-w-3xl mx-auto'>
            <div className='w-full'>
                <BackButton defaultPath={`/f1-dashboard/piloto/${pilotoId}`} backText="Volver al Piloto" />
            </div>
            <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
                <div className='flex justify-between items-center'>
                    <h1 className='text-xl font-semibold'>Editar Piloto</h1>
                </div>

                <hr className='bg-red-500 h-px' />

                <PilotoForm
                    pilotoId={pilotoId}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    )
}

export default Page
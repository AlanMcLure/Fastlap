'use client'

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { uploadFiles } from '@/lib/uploadthing'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation';
import { CreatePilotoPayload, UpdatePilotoPayload } from '@/lib/validators/piloto';
import { useCustomToasts } from '@/hooks/use-custom-toasts';
import { set } from 'date-fns';

interface PilotoFormProps {
    pilotoId?: string;
    onCancel: () => void;
}

interface Piloto {
    nombre: string;
    fecha_nac: string;
    nacionalidad: string;
    img_flag: string;
    img: string;
    lugar_nac: string;
    casco: string;
    // ...resto de las propiedades
}

const PilotoForm: React.FC<PilotoFormProps> = ({
    pilotoId,
    onCancel,
}) => {
    const [nombre, setNombre] = useState<string>('');
    const [fechaNac, setFechaNac] = useState<string>('');
    const [nacionalidad, setNacionalidad] = useState<string>('');
    const [imgFlag, setImgFlag] = useState<string>('');
    const [img, setImg] = useState<string>('');
    const [lugarNac, setLugarNac] = useState<string>('');
    const [casco, setCasco] = useState<string>('');
    const [piloto, setPiloto] = useState<Piloto | null>(null);
    const [selectedImgFlag, setSelectedImgFlag] = useState<File | null>(null);
    const [selectedImg, setSelectedImg] = useState<File | null>(null);
    const [selectedCasco, setSelectedCasco] = useState<File | null>(null);
    const [previewImageFlag, setPreviewImageFlag] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewImageCasco, setPreviewImageCasco] = useState<string | null>(null);
    const router = useRouter();
    const { loginToast } = useCustomToasts()

    const { mutate: savePiloto, isLoading } = useMutation({
        mutationFn: async () => {

            let imageFlagUrl = '';
            if (selectedImgFlag) {
                const [res] = await uploadFiles([selectedImgFlag], 'imageUploader');
                imageFlagUrl = res.fileUrl;
            }

            let imageUrl = '';
            if (selectedImg) {
                const [res] = await uploadFiles([selectedImg], 'imageUploader');
                imageUrl = res.fileUrl;
            }

            let imageCascoUrl = '';
            if (selectedCasco) {
                const [res] = await uploadFiles([selectedCasco], 'imageUploader');
                imageCascoUrl = res.fileUrl;
            }

            if (pilotoId) {
                const payload: UpdatePilotoPayload = {
                    id: pilotoId,
                    nombre: nombre || null,
                    fecha_nac: fechaNac || null,
                    nacionalidad: nacionalidad || null,
                    img_flag: imageFlagUrl || null,
                    img: imageUrl || null,
                    lugar_nac: lugarNac || null,
                    casco: imageCascoUrl || null,
                }

                console.log(payload)

                const { data } = await axios.put(`http://localhost:8083/piloto`, payload)
                return data as string
            }

            const payload: CreatePilotoPayload = {
                nombre: nombre || null,
                fecha_nac: fechaNac || null,
                nacionalidad: nacionalidad || null,
                img_flag: imageFlagUrl || null,
                img: imageUrl || null,
                lugar_nac: lugarNac || null,
                casco: imageCascoUrl || null,
            }

            console.log(payload)

            const { data } = await axios.post('http://localhost:8083/piloto', payload)
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
            if (pilotoId) {
                return router.push(`/f1-dashboard/piloto/${pilotoId}`)
            } else {
                return router.push(`/f1-dashboard/piloto/${data}`)
            }
        },
    })

    const handleImgFlagUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const file = event.target.files[0];
            setSelectedImgFlag(file);
            setImgFlag(URL.createObjectURL(file));
            setPreviewImageFlag(URL.createObjectURL(file));
        }
    }

    const handleImgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const file = event.target.files[0];
            setSelectedImg(file);
            setImg(URL.createObjectURL(file));
            setPreviewImage(URL.createObjectURL(file));
        }
    }

    const handleCascoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const file = event.target.files[0];
            setSelectedCasco(file);
            setCasco(URL.createObjectURL(file));
            setPreviewImageCasco(URL.createObjectURL(file));
        }
    }

    useEffect(() => {
        if (pilotoId) {
            axios.get(`http://localhost:8083/piloto/${pilotoId}`)
                .then(response => setPiloto(response.data))
                .catch(error => console.error('Error:', error));
        }
    }, [pilotoId]);

    // Cuando los datos del piloto se cargan, establece los valores del formulario
    useEffect(() => {
        if (piloto) {
            setNombre(piloto.nombre || '');
            setFechaNac(piloto.fecha_nac || '');
            setNacionalidad(piloto.nacionalidad || '');
            setImgFlag(piloto.img_flag || '');
            setImg(piloto.img || '');
            setLugarNac(piloto.lugar_nac || '');
            setCasco(piloto.casco || '');

            // Establecer las imágenes existentes en previewImage, previewImageFlag y previewImageCasco
            setPreviewImageFlag(piloto.img_flag || null);
            setPreviewImage(piloto.img || null);
            setPreviewImageCasco(piloto.casco || null);
        }
    }, [piloto]);

    const buttonText = pilotoId ? 'Editar Piloto' : 'Crear Piloto';

    return (
        <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
            <div>
                {pilotoId && <><p className='text-lg font-medium'>ID del Piloto</p>
                    <div className='relative'>
                        <Input
                            value={pilotoId}
                            disabled
                            className='pl-6'
                        />
                    </div></>}
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
                {/* <p className='text-lg font-medium'>Bandera (URL)</p>
                <div className='relative'>
                    <Input
                        value={imgFlag}
                        onChange={(e) => setImgFlag(e.target.value)}
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
                </div> */}
                <p className='text-lg font-medium'>Bandera</p>
                <div className='relative'>
                    <input type="file" accept="image/*" onChange={handleImgFlagUpload} />
                    <img src={previewImageFlag ?? ''} alt="Bandera" />

                </div>
                <p className='text-lg font-medium'>Imagen</p>
                <div className='relative'>
                    <input type="file" accept="image/*" onChange={handleImgUpload} />
                    <img src={previewImage ?? ''} alt="Imagen del piloto" />
                </div>
                <p className='text-lg font-medium'>Lugar de Nacimiento</p>
                <div className='relative'>
                    <Input
                        value={lugarNac}
                        onChange={(e) => setLugarNac(e.target.value)}
                        className='pl-6'
                    />
                </div>
                <p className='text-lg font-medium'>Casco</p>
                <div className='relative'>
                    <input type="file" accept="image/*" onChange={handleCascoUpload} />
                    <img src={previewImageCasco ?? ''} alt="Casco" />
                </div>
            </div>

            <div className='flex justify-end gap-4'>
                <Button
                    disabled={isLoading}
                    variant='subtle'
                    onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    isLoading={isLoading}
                    disabled={nombre.length === 0}
                    onClick={() => savePiloto()}>
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

export default PilotoForm;
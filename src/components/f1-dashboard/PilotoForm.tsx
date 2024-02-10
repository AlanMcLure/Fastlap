import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

interface PilotoFormProps {
    nombre: string;
    setNombre: (value: string) => void;
    fechaNac: string;
    setFechaNac: (value: string) => void;
    nacionalidad: string;
    setNacionalidad: (value: string) => void;
    imgFlag: string;
    setImgFlag: (value: string) => void;
    img: string;
    setImg: (value: string) => void;
    lugarNac: string;
    setLugarNac: (value: string) => void;
    casco: string;
    setCasco: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

const PilotoForm: React.FC<PilotoFormProps> = ({
    nombre,
    setNombre,
    fechaNac,
    setFechaNac,
    nacionalidad,
    setNacionalidad,
    imgFlag,
    setImgFlag,
    img,
    setImg,
    lugarNac,
    setLugarNac,
    casco,
    setCasco,
    onSubmit,
    onCancel,
    isLoading,
}) => {
    return (
        <div className='relative bg-white w-full h-fit p-4 rounded-lg space-y-6 mt-6 self-center'>
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
                <p className='text-lg font-medium'>Bandera (URL)</p>
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
                </div>
                <p className='text-lg font-medium'>Lugar de Nacimiento</p>
                <div className='relative'>
                    <Input
                        value={lugarNac}
                        onChange={(e) => setLugarNac(e.target.value)}
                        className='pl-6'
                    />
                </div>
                <p className='text-lg font-medium'>Casco (URL)</p>
                <div className='relative'>
                    <Input
                        value={casco}
                        onChange={(e) => setCasco(e.target.value)}
                        className='pl-6'
                    />
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
                    disabled={nombre.length === 0 || fechaNac.length === 0 || nacionalidad.length === 0 || img.length === 0}
                    onClick={onSubmit}>
                    Crear Piloto
                </Button>
            </div>
        </div>
    );
};

export default PilotoForm;
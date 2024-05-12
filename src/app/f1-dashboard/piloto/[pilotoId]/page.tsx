'use client'

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { GraficoPuntos } from '@/components/GraficoPuntos';
import EditButton from '@/components/f1-dashboard/EditButton';
import DeleteButton from '@/components/f1-dashboard/DeleteButton';
import { toast } from '@/hooks/use-toast';
import BackButton from '@/components/BackButton';
import { useSession } from 'next-auth/react';
import { authenticated } from '@/lib/utils';

interface Piloto {
    id: string;
    nombre: string;
    fecha_nac: string;
    nacionalidad: string;
    img: string;
    img_flag: string | null;
    lugar_nac: string | null;
    casco: string | null;
}

interface PilotoData {
    piloto: Piloto;
    puntosConseguidos: number;
    victorias: number;
    podios: number;
    carrerasDisputadas: number;
    poles: number;
    vueltasRapidas: number;
    mejorPosicionCarrera: number;
    vecesMejorPosicionCarrera: number;
    mejorPosicionClasificacion: number;
    vecesMejorPosicionClasificacion: number;
    abandonos: number;
}

interface PilotoPageProps {
    params: {
        pilotoId: string;
    };
}

const PilotoPage: React.FC<PilotoPageProps> = ({ params }) => {
    const { pilotoId } = params
    const [pilotoData, setPilotoData] = useState<PilotoData | null>(null);
    const router = useRouter();
    const { data: session } = useSession()

    useEffect(() => {
        if (pilotoId) {
            authenticated(`http://localhost:8083/piloto/${pilotoId}/detalles`, session)
                // fetch(`http://localhost:8083/piloto/${pilotoId}/detalles`)
                // .then(response => {
                //     if (!response.ok) {
                //         throw new Error('Piloto no encontrado');
                //     }
                //     return response.json();
                // })
                .then(data => {
                    if (!data || !data.piloto || !data.piloto.id) {
                        throw new Error('Piloto no encontrado');
                    }
                    setPilotoData(data);
                })
                .catch(error => {
                    console.error(error);
                    router.push('/notfound'); // Redirige al usuario a la página de "no encontrado"
                });
        }
    }, [pilotoId, router]);

    if (!pilotoData) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <div className="relative">
                <div className='w-full mb-2'>
                    <BackButton defaultPath="/f1-dashboard/pilotos" backText="Volver al Dashboard" />
                </div>
                {/* {session?.user.role === 'ADMIN' && (<div className="absolute top-0 right-0 p-4">
                    <EditButton seccion="piloto" id={pilotoData.piloto.id} />
                    <DeleteButton id={pilotoData.piloto.id}
                        seccion="piloto"
                        genero="masculino"
                        onSuccess={() => {
                            router.push('/f1-dashboard/pilotos');
                            toast({
                                title: 'Piloto eliminado',
                                description: 'El piloto ha sido eliminado correctamente',
                                variant: 'default',
                            });
                        }}
                        onError={() => {
                            toast({
                                title: 'Error al eliminar el piloto',
                                description: 'El piloto no ha sido eliminado correctamente',
                                variant: 'destructive',
                            });
                            console.error('Error al eliminar el piloto');
                        }}
                    />
                </div>)} */}
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2">
                        <div className="w-full">
                            <Image src={pilotoData.piloto.img ?? '/default-driver.png'} alt={pilotoData.piloto.nombre ?? 'Piloto desconocido'} width={500} height={500} objectFit="cover" />
                        </div>
                        <h1 className="text-4xl font-bold text-center mt-1">{pilotoData.piloto.nombre}</h1>
                    </div>
                    <div className="w-full md:w-1/2">
                        {/* Render pilotoData characteristics here */}
                        <p>Características</p>
                        <ul>
                            {/* Render the pilot details here */}
                            <ul>
                                <li>País: {pilotoData.piloto.nacionalidad}</li>
                                <li>Podios: {pilotoData.podios}</li>
                                <li>Puntos: {pilotoData.puntosConseguidos}</li>
                                <li>Grandes Premios disputados: {pilotoData.carrerasDisputadas}</li>
                                <li>Campeonatos del Mundo: {pilotoData.vecesMejorPosicionCarrera}</li>
                                <li>Mejor posición en carrera: {pilotoData.mejorPosicionCarrera} (x{pilotoData.vecesMejorPosicionCarrera})</li>
                                <li>Mejor posición en clasificación: {pilotoData.mejorPosicionClasificacion} (x{pilotoData.vecesMejorPosicionClasificacion})</li>
                                <li>Fecha de nacimiento: {pilotoData.piloto.fecha_nac}</li>
                                <li>Lugar de nacimiento: {pilotoData.piloto.lugar_nac}, {pilotoData.piloto.nacionalidad}</li>
                            </ul>
                            {/* Add more details as needed */}
                        </ul>
                    </div>
                </div>
                <div>
                    {/* Render charts here */}
                    {/* <GraficoPuntos /> */}
                </div>
            </div>
        </div>
    );
};

export default PilotoPage;
'use client'

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { GraficoPuntos } from '@/components/GraficoPuntos';

interface PilotoData {
    id: string;
    nombre?: string;
    img?: string;
    // Add other properties as needed
}

interface PilotoPageProps {
    params: {
        pilotoId: string;
    };
}

const deletePiloto = async (id: string) => {
    const response = await fetch(`http://localhost:8083/piloto/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Error al eliminar el piloto');
    }

    // Actualizar la UI después de eliminar el piloto
};

const PilotoPage: React.FC<PilotoPageProps> = ({ params }) => {
    const { pilotoId } = params
    const [pilotoData, setPilotoData] = useState<PilotoData | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (pilotoId) {
            fetch(`http://localhost:8083/piloto/${pilotoId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Piloto no encontrado');
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || !data.id) {
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
            <h1>Información del piloto</h1>
            <div className="flex">
                <div className="w-1/2">
                    <Image src={pilotoData.img ?? '/default-driver.png'} alt={pilotoData.nombre ?? 'Piloto desconocido'} width={500} height={500} />
                    <h2>{pilotoData.nombre}</h2>
                </div>
                <div className="w-1/2">
                    {/* Render pilotoData characteristics here */}
                    <p>Características</p>
                    <button onClick={() => router.push(`${pilotoData.id}/edit`)}>Edit</button>
                    <button onClick={() => deletePiloto(pilotoData.id)}>Delete</button>
                </div>
            </div>
            <div>
                {/* Render charts here */}
                <GraficoPuntos />
            </div>
        </div>
    );
};

export default PilotoPage;
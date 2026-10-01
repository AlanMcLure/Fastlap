'use client';

import React, { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface PilotStats {
    driverId: string;
    givenName: string | null;
    familyName: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    permanentNumber: string | null;
    code: string | null;
    url: string | null;
    img: string | null;
}

const PilotoPage: React.FC = () => {
    const { pilotoId } = useParams();
    const [pilot, setPilot] = useState<PilotStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (pilotoId) {
            const fetchPilotData = async () => {
                try {
                    const response = await axios.get(`/api/ergast/driver?driverId=${pilotoId}`);
                    setPilot(response.data.content); // Asegúrate de acceder a los datos correctamente
                } catch (error) {
                    console.error('Error fetching pilot data:', error);
                    setError('Error fetching pilot data');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchPilotData();
        }
    }, [pilotoId]);

    if (isLoading) {
        return <div className='loader'></div>;
    }

    if (error) {
        return <div>Error al cargar los datos del piloto.</div>;
    }

    if (!pilot) {
        return <div>Piloto no encontrado.</div>;
    }

    const pilotoNombre = `${pilot.givenName} ${pilot.familyName}` || 'Nombre desconocido';
    const pilotoNacionalidad = pilot.nationality || 'Nacionalidad desconocida';
    const pilotoFechaNac = pilot.dateOfBirth ? new Date(pilot.dateOfBirth).toLocaleDateString() : 'Fecha de nacimiento desconocida';

    return (
        <div>
            <div className="relative">
                <div className='w-full mb-2'>
                    <BackButton defaultPath="/f1-dashboard/pilotos" backText="Volver al Dashboard" />
                </div>
                <div className="container mx-auto p-4">
                    <div className="flex flex-col md:flex-row items-center md:items-start">
                        <div className="w-full md:w-1/3 p-4">
                            {pilot.img ? (
                                <img src={pilot.img} alt={pilotoNombre} className="w-full rounded-lg" />
                            ) : (
                                <img src='/default-driver.png' alt={pilotoNombre} className="w-full rounded-lg" />
                            )}
                            <div className="text-center mt-4">
                                <h1 className="text-3xl font-bold">{pilotoNombre}</h1>
                                <p className="text-xl">{pilot.permanentNumber ? `#${pilot.permanentNumber}` : 'Número desconocido'}</p>
                            </div>
                        </div>
                        <div className="w-full md:w-2/3 p-4">
                            <div className="text-lg mb-4">
                                <strong>Fecha de nacimiento:</strong> {pilotoFechaNac}
                            </div>
                            <div className="text-lg mb-4">
                                <strong>Nacionalidad:</strong> {pilotoNacionalidad}
                            </div>
                            {pilot.code && (
                                <div className="text-lg mb-4">
                                    <strong>Código:</strong> {pilot.code}
                                </div>
                            )}
                            {pilot.url && (
                                <div className="text-lg mb-4">
                                    <a href={pilot.url} target="_blank" rel="noopener noreferrer" className="underline">
                                        Más información en Wikipedia
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PilotoPage;

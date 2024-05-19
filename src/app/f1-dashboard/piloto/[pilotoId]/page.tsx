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
import axios from 'axios';

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

    const [driverData, setDriverData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        const fetchDriverData = async () => {
          setIsLoading(true);
          try {
            const response = await axios.get(`http://ergast.com/api/f1/drivers/${pilotoId}.json`);
            const driver = response.data.MRData.DriverTable.Drivers[0];
            // Fake data for demonstration purposes, replace with actual response data
            setDriverData({
              givenName: driver.givenName,
              familyName: driver.familyName,
              number: driver.permanentNumber,
              nationality: driver.nationality,
              dateOfBirth: driver.dateOfBirth,
              team: "Aston Martin", // You need to map this from your own data source
              podiums: 106, // You need to map this from your own data source
              points: 2300, // You need to map this from your own data source
              grandsPrixEntered: 386, // You need to map this from your own data source
              worldChampionships: 2, // You need to map this from your own data source
              highestRaceFinish: "1 (x32)", // You need to map this from your own data source
              highestGridPosition: 1, // You need to map this from your own data source
              placeOfBirth: "Oviedo, Spain", // You need to map this from your own data source
              imageUrl: "https://example.com/path/to/image.jpg" // You need to map this from your own data source
            });
          } catch (error) {
            setError(error);
          } finally {
            setIsLoading(false);
          }
        };

        fetchDriverData();
    }, [pilotoId]);

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
                <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-center md:items-start">
        <div className="w-full md:w-1/3 p-4">
          <img src={driverData.imageUrl} alt={`${driverData.givenName} ${driverData.familyName}`} className="w-full rounded-lg" />
        </div>
        <div className="w-full md:w-2/3 p-4">
          <div className="flex items-center mb-4">
            <h1 className="text-4xl font-bold">{`${driverData.givenName} ${driverData.familyName}`}</h1>
            <div className="ml-4 text-2xl">{driverData.number}</div>
            <div className="ml-4">
              <img src={`https://countryflagsapi.com/png/${driverData.nationality.toLowerCase()}`} alt={driverData.nationality} className="w-8 h-8" />
            </div>
          </div>
          <div className="text-lg mb-4">
            <strong>Team:</strong> {driverData.team}
          </div>
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div><strong>Country:</strong> {driverData.nationality}</div>
            <div><strong>Podiums:</strong> {driverData.podiums}</div>
            <div><strong>Points:</strong> {driverData.points}</div>
            <div><strong>Grands Prix entered:</strong> {driverData.grandsPrixEntered}</div>
            <div><strong>World Championships:</strong> {driverData.worldChampionships}</div>
            <div><strong>Highest race finish:</strong> {driverData.highestRaceFinish}</div>
            <div><strong>Highest grid position:</strong> {driverData.highestGridPosition}</div>
            <div><strong>Date of birth:</strong> {new Date(driverData.dateOfBirth).toLocaleDateString()}</div>
            <div><strong>Place of birth:</strong> {driverData.placeOfBirth}</div>
          </div>
        </div>
      </div>
    </div>
            </div>
        </div>
    );
};

export default PilotoPage;
'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GraficoPuntos } from '@/components/GraficoPuntos';
import { Button } from '@/components/ui/Button';

interface Piloto {
    id: number;
    nombre: string;
    // añade aquí cualquier otro campo que tenga un piloto
}

const DashboardPage: React.FC = () => {
    const [pilotos, setPilotos] = useState<Piloto[]>([]);
    const [pilotoSeleccionado, setPilotoSeleccionado] = useState<number | null>(null);
    const [temporada, setTemporada] = useState<number | null>(null);
    const [enviar, setEnviar] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:8083/piloto')
            .then(response => {
                setPilotos(response.data.content);
            });
    }, []);

    const handleTemporadaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemporada(Number(event.target.value));
    };

    const handlePilotoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPilotoSeleccionado(Number(event.target.value));
    };

    const handleEnviarClick = () => {
        setEnviar(true);
    };

    console.log(pilotos);
    console.log(pilotoSeleccionado)

    return (
        <div>
            <h1>Bienvenido al Dashboard de F1</h1>
            <p className='mb-4'>Por favor, selecciona un piloto para ver su gráfico de puntos:</p>
            <select onChange={handlePilotoChange}>
                <option value="">Selecciona un piloto</option>
                {pilotos.map(piloto => (
                    <option key={piloto.id} value={piloto.id}>{piloto.nombre}</option>
                ))}
            </select>
            <input type="number" onChange={handleTemporadaChange} placeholder="Introduce la temporada" />
            <Button onClick={handleEnviarClick}>Enviar</Button>
            {enviar && pilotoSeleccionado && temporada && <GraficoPuntos pilotoId={pilotoSeleccionado} anyo={temporada} />}
        </div>
    );
};

export default DashboardPage;
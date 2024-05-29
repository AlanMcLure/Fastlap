'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GraficoPuntos } from '@/components/GraficoPuntos';
import { Button } from '@/components/ui/Button';
import DriverStandings from '@/components/f1-dashboard/DriverStandings';
import LapTimesChart from '@/components/f1-dashboard/LapTimesChart';

interface Piloto {
    id: number;
    nombre: string;
    // añade aquí cualquier otro campo que tenga un piloto
}

const DashboardPage: React.FC = () => {

    return (
        <div>
            <h1 className="font-bold text-3xl md:text-4xl">Bienvenido al Dashboard de F1</h1>
            {/* <p className='mb-4'>Por favor, selecciona un piloto para ver su gráfico de puntos:</p>
            <select onChange={handlePilotoChange}>
                <option value="">Selecciona un piloto</option>
                {pilotos.map(piloto => (
                    <option key={piloto.id} value={piloto.id}>{piloto.nombre}</option>
                ))}
            </select>
            <input type="number" onChange={handleTemporadaChange} placeholder="Introduce la temporada" />
            <Button onClick={handleEnviarClick}>Enviar</Button>
            {enviar && pilotoSeleccionado && temporada && <GraficoPuntos pilotoId={pilotoSeleccionado} anyo={temporada} />} */}
            <DriverStandings></DriverStandings>
            <LapTimesChart></LapTimesChart>
        </div>
    );
};

export default DashboardPage;
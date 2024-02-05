'use client'

import { useEffect, useState } from 'react';
import { Chart as ChartJs, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import axios from 'axios';

ChartJs.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

interface CarreraResult {
    carrera: {
        granPremio: {
            nombre: string;
        };
    };
    posicion: number;
    vuelta_rapida: boolean;
}

// Función para convertir posiciones en puntos
function posicionAPuntos(posicion: number, vuelta_rapida: boolean): number {
    const puntosPorPosicion = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    let puntos = posicion <= 10 ? puntosPorPosicion[posicion - 1] : 0;
    if (vuelta_rapida && posicion <= 10) {
        puntos += 1;
    }
    return puntos;
}

export const GraficoPuntos = () => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                label: '',
                data: [],
                backgroundColor: '',
            },
        ],
    });

    useEffect(() => {
        axios.get('http://localhost:8083/resultadocarrera/anyo/2021/piloto/1')
            .then(response => {
                const data = response.data;
                // Extrae los datos que necesitas para tu gráfico
                const labels = data.content.map((item: CarreraResult) => item.carrera.granPremio.nombre);

                let puntosAcumulados = 0;

                // const dataPoints = data.content.map((item: CarreraResult) => posicionAPuntos(item.posicion, item.vuelta_rapida));
                const dataPoints = data.content.map((item: CarreraResult) => {
                    puntosAcumulados += posicionAPuntos(item.posicion, item.vuelta_rapida);
                    return puntosAcumulados;
                });

                console.log(data);

                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Puntos',
                            data: dataPoints,
                            backgroundColor: 'Blue',
                        },
                    ],
                });
            });
    }, []);

    return (
        // <div>
        //     <Bar data={chartData} options={{
        //         responsive: true,
        //         scales: {
        //             x: {
        //                 type: 'category', // 'band' o 'time'
        //                 // Otras opciones de configuración de la escala
        //             },
        //             y: {
        //                 // Opciones de configuración de la escala del eje y
        //             },
        //         },
        //     }} />
        // </div>
        <div>
            <Line data={chartData} options={{
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Puntos en cada carrera' },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            }} />
        </div>
    );
};

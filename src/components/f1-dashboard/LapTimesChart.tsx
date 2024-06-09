import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const LapTimesChart = () => {
  const [year, setYear] = useState('2024');
  const [grandPrix, setGrandPrix] = useState('');
  const [session, setSession] = useState('');
  const [driver, setDriver] = useState('');
  const [lapTimes, setLapTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Opciones de filtros
  const years = ['2023', '2024']; // Agrega más años según sea necesario
  const grandPrixOptions = [
    { round: 1, name: 'Australian Grand Prix' },
    { round: 2, name: 'Emilia Romagna Grand Prix' }
  ]; // Agrega más GPs según sea necesario
  const sessions = ['laps']; // La API devuelve vueltas para carreras
  const drivers = [
    { id: 'hamilton', name: 'Lewis Hamilton' },
    { id: 'alonso', name: 'Fernando Alonso' }
  ]; // Agrega más pilotos según sea necesario

  const fetchLapTimes = async () => {
    if (!year || !grandPrix || !session || !driver) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://ergast.com/api/f1/${year}/${grandPrix}/drivers/${driver}/${session}.json`);
      const lapsData = response.data.MRData.RaceTable.Races[0]?.Laps || [];

      const lapData = lapsData.map(lap => ({
        lap: parseInt(lap.number, 10),
        time: parseFloat(lap.Timings.find(timing => timing.driverId === driver)?.time.replace(':', '.'))
      }));

      setLapTimes(lapData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLapTimes();
  }, [year, grandPrix, session, driver]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap justify-between mb-4">
        <select value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={grandPrix} onChange={e => setGrandPrix(e.target.value)}>
          <option value="">Selecciona Gran Premio</option>
          {grandPrixOptions.map(gp => (
            <option key={gp.round} value={gp.round}>{gp.name}</option>
          ))}
        </select>
        <select value={driver} onChange={e => setDriver(e.target.value)}>
          <option value="">Selecciona Piloto</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="loader"></div>
      ) : error ? (
        <div>Error loading data: {error.message}</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={lapTimes}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="lap"
                label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} 
                ticks={[1, 10, 20]}
            />
            <YAxis 
                label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }} 
                domain={[1, 2]} // 1:20 (80 segundos) a 1:50 (110 segundos)
                tickFormatter={(value) => {
                    const minutes = Math.floor(value / 60);
                    const seconds = value % 60;
                    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                }}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="time" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LapTimesChart;

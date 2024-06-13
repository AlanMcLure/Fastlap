import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DriverStandings = ({ round = null }) => {
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [season, setSeason] = useState('current');
  const [classificationType, setClassificationType] = useState('driver');

  useEffect(() => {
    const fetchStandings = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/ergast/standings?season=${season}&classificationType=${classificationType}${round ? `&round=${round}` : ''}`);
        const standingsList = response.data.MRData.StandingsTable.StandingsLists[0];
        let newStandings;
        if (classificationType === 'driver') {
          newStandings = standingsList.DriverStandings.map((driverStanding) => {
            const driver = driverStanding.Driver;
            const constructor = driverStanding.Constructors[0];
            return {
              pos: driverStanding.position,
              driver: `${driver.givenName} ${driver.familyName}`,
              nationality: driver.nationality,
              car: constructor.name,
              pts: driverStanding.points,
            };
          });
        } else {
          newStandings = standingsList.ConstructorStandings.map((constructorStanding) => {
            const constructor = constructorStanding.Constructor;
            return {
              pos: constructorStanding.position,
              team: constructor.name,
              nationality: constructor.nationality,
              pts: constructorStanding.points,
            };
          });
        }
        setStandings(newStandings);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [season, classificationType, round]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 md:mb-0">{classificationType === 'driver' ? 'Clasificación de Pilotos' : 'Clasificación de Constructores'}</h2>
        <div className="flex space-x-4">
          {!round && (
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="border border-gray-300 rounded p-2"
            >
              {/* Lista de opciones de temporada */}
              {Array.from({ length: 75 }, (_, i) => {
                const year = 2024 - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          )}
          <select
            value={classificationType}
            onChange={(e) => setClassificationType(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="driver">Pilotos</option>
            <option value="constructor">Equipos</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="loader"></div>
      ) : error ? (
        <div>Error loading data: {error.message}</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full bg-white table-auto overflow-scroll">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">POS</th>
                {classificationType === 'driver' ? (
                  <>
                    <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Piloto</th>
                    <th className="hidden sm:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nacionalidad</th>
                    <th className="hidden md:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipo</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipo</th>
                    <th className="hidden sm:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nacionalidad</th>
                  </>
                )}
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200">{standing.pos}</td>
                  {classificationType === 'driver' ? (
                    <>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {standing.driver}
                        <dl className='lg:hidden font-light'>
                          <dt className='sr-only sm:hidden'>Equipo:</dt>
                          <dd className='md:hidden text-gray-500'>
                            {standing.car}
                          </dd>
                        </dl>
                      </td>
                      <td className="hidden sm:table-cell py-2 px-4 border-b border-gray-200">{standing.nationality}</td>
                      <td className="hidden md:table-cell py-2 px-4 border-b border-gray-200">{standing.car}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-4 border-b border-gray-200">{standing.team}</td>
                      <td className="hidden sm:table-cell py-2 px-4 border-b border-gray-200">{standing.nationality}</td>
                    </>
                  )}
                  <td className="py-2 px-4 border-b border-gray-200">{standing.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverStandings;

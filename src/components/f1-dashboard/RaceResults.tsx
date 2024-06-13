import React from 'react';

const RaceResults = ({ raceData }) => {
  if (!raceData || raceData.length === 0) {
    return <p>No se encontraron resultados para esta carrera.</p>;
  }

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Resultados de la Carrera</h2>
      {/* <ul>
        {raceData.map((result, index) => (
          <li key={index}>
            <p>{result.position}: {result.Driver.givenName} {result.Driver.familyName}</p>
          </li>
          
        ))}
      </ul> */}
      <div className="overflow-auto">
          <table className="min-w-full bg-white table-auto overflow-scroll">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">POS</th>                
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Piloto</th>
                <th className="hidden lg:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipo</th>
                <th className="hidden md:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vueltas</th>
                <th className="hidden md:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vuelta rápida</th>
                <th className="hidden sm:table-cell py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiempo</th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PTS</th>
              </tr>
            </thead>
            <tbody>
              {raceData.map((standing, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200">{standing.position}</td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    {standing.Driver.givenName} {standing.Driver.familyName}
                    <dl className='lg:hidden font-light'>
                      <dt className='sr-only sm:hidden'>Equipo:</dt>
                      <dd className='lg:hidden text-gray-500'>
                        {standing.Constructor.name}
                      </dd>
                    </dl>  
                  </td>
                  <td className="hidden lg:table-cell py-2 px-4 border-b border-gray-200">{standing.Constructor.name}</td>
                  <td className="hidden md:table-cell py-2 px-4 border-b border-gray-200">{standing.laps}</td>
                  <td className="hidden md:table-cell py-2 px-4 border-b border-gray-200">{standing.FastestLap ? standing.FastestLap.Time.time : 'No marcada'}</td>
                  <td className="hidden sm:table-cell py-2 px-4 border-b border-gray-200">{standing.Time ? standing.Time.time : 'Doblado'}</td>
                  <td className="py-2 px-4 border-b border-gray-200">{standing.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default RaceResults;

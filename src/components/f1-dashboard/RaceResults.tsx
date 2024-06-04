import React from 'react';

const RaceResults = ({ raceData }) => {
  if (!raceData || raceData.length === 0) {
    return <p>No se encontraron resultados para esta carrera.</p>;
  }

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Resultados de la Carrera</h2>
      <ul>
        {raceData.map((result, index) => (
          <li key={index}>
            <p>{result.position}: {result.Driver.givenName} {result.Driver.familyName}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RaceResults;

import React from 'react';
import RaceCalendar from '@/components/f1-dashboard/RaceCalendar';

const RacesPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl md:text-4xl mb-2">Calendario de Carreras</h1>
      <RaceCalendar />
    </div>
  );
};

export default RacesPage;

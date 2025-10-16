import React, { useState } from 'react';
import type { SafeHouse, UserLocation } from '../types';
import { ChevronUpIcon, NavigationIcon } from './icons';

interface SafeHouseListProps {
  safeHouses: SafeHouse[];
  userLocation: UserLocation;
  onNavigate: (safeHouse: SafeHouse) => void;
  selectedSafeHouseId?: string | null;
}

const SafeHouseItem: React.FC<{ house: SafeHouse; onNavigate: (safeHouse: SafeHouse) => void; isSelected: boolean }> = ({ house, onNavigate, isSelected }) => {
  return (
    <li className={`p-3 rounded-lg transition-colors ${isSelected ? 'bg-blue-900/50' : 'hover:bg-gray-700/50'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-white">{house.name}</h4>
          <p className="text-sm text-gray-400">{house.address}</p>
          <p className="text-sm text-yellow-400">{(house.distance_m / 1000).toFixed(1)} km away</p>
        </div>
        <button
          onClick={() => onNavigate(house)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-transform transform hover:scale-105"
        >
          <NavigationIcon className="w-4 h-4" />
          <span>Navigate</span>
        </button>
      </div>
    </li>
  );
};


export const SafeHouseList: React.FC<SafeHouseListProps> = ({ safeHouses, onNavigate, selectedSafeHouseId }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center">
      <div className="w-full max-w-4xl bg-gray-800/80 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 flex justify-center items-center text-gray-400 hover:text-white"
        >
          <span className="font-semibold mr-2">Nearby Healthcare Facilities ({safeHouses.length})</span>
          <ChevronUpIcon className={`w-6 h-6 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-64' : 'max-h-0'}`}>
          <ul className="h-full p-2 space-y-2 overflow-y-auto">
            {safeHouses.map(house => (
              <SafeHouseItem 
                key={house.id} 
                house={house} 
                onNavigate={onNavigate} 
                isSelected={house.id === selectedSafeHouseId}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
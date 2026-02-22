import React from 'react';
import { Filter, DollarSign, Flame } from 'lucide-react';
import { cuisineOptions, ketoScoreOptions, dietaryOptions } from '../constants';
import { getPriceSymbol } from '../utils';

const FiltersPanel = ({ filters, setFilters, toggleFilter }) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-yellow-200">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Filter Your Hunt</h3>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
           Max Distance: <span className="text-orange-600">{filters.maxDistance} miles</span>
        </label>
        <input
          type="range"
          min="1"
          max="25"
          value={filters.maxDistance}
          onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
          className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
        />
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2"><DollarSign className="inline w-4 h-4 text-yellow-600" /> Price Range</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(level => (
            <button
              key={level}
              onClick={() => toggleFilter('priceRange', level)}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 rounded-xl font-bold transition active:scale-95 ${
                filters.priceRange.includes(level)
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getPriceSymbol(level)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2"> Cuisine Type</label>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => toggleFilter('cuisineTypes', cuisine)}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
                filters.cuisineTypes.includes(cuisine)
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2"> Dietary Preferences</label>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map(diet => (
            <button
              key={diet}
              onClick={() => toggleFilter('dietaryPreferences', diet)}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
                filters.dietaryPreferences.includes(diet)
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {diet}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2"><Flame className="inline w-4 h-4 text-orange-600" /> Min Keto Score</label>
        <div className="flex gap-2">
          {ketoScoreOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, minKetoScore: opt.value })}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 rounded-xl font-bold transition active:scale-95 ${
                filters.minKetoScore === opt.value
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          setFilters({
            maxDistance: 2,
            priceRange: [1, 2, 3, 4],
            cuisineTypes: [],
            dietaryPreferences: [],
            minKetoScore: 0
          });
        }}
        className="text-sm text-orange-600 hover:text-orange-700 font-bold underline"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FiltersPanel;

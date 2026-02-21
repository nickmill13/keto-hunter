import React, { useState } from 'react';
import { Search, MapPin, Navigation, Filter, Loader } from 'lucide-react';

const SearchCard = ({
  location, setLocation, restaurantQuery, setRestaurantQuery,
  loading, error, showFilters, setShowFilters, filters,
  onSearch, onGetCurrentLocation, onNearMe
}) => {
  const [showMobileRestaurantSearch, setShowMobileRestaurantSearch] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 sm:p-6 mb-4 sm:mb-6 border-2 border-orange-300">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
            <input
              type="text"
              placeholder="City, zip, or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-gray-800 font-medium text-base"
            />
          </div>

          <button
            onClick={onGetCurrentLocation}
            disabled={loading}
            className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl active:scale-95 transition border-2 border-orange-200 disabled:opacity-50 flex items-center justify-center"
            title="Use My Location"
          >
            <Navigation className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-yellow-100 hover:bg-yellow-200 text-orange-800 rounded-xl active:scale-95 transition border-2 border-yellow-200 relative flex items-center justify-center"
            title="Filters"
          >
            <Filter className="w-5 h-5" />
            {(filters.cuisineTypes.length > 0 || filters.minKetoScore > 0) && (
              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1.5 min-w-[18px] text-center font-semibold">
                {filters.cuisineTypes.length + (filters.minKetoScore > 0 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:block relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a specific restaurant (optional)"
            value={restaurantQuery}
            onChange={(e) => setRestaurantQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-gray-800 font-medium text-base"
          />
        </div>

        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileRestaurantSearch(!showMobileRestaurantSearch)}
            className="text-orange-600 text-sm font-semibold flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            {showMobileRestaurantSearch ? 'Hide restaurant search' : 'Search specific restaurant'}
          </button>
          {showMobileRestaurantSearch && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 w-4 h-4" />
              <input
                type="text"
                placeholder="Restaurant name"
                value={restaurantQuery}
                onChange={(e) => setRestaurantQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-gray-800 font-medium text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSearch}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-base shadow-lg"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Start Hunt</span>
              </>
            )}
          </button>

          <button
            onClick={onNearMe}
            disabled={loading}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-base shadow-lg whitespace-nowrap"
          >
            <Navigation className="w-5 h-5" />
            <span>Near Me</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium text-sm sm:text-base">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCard;

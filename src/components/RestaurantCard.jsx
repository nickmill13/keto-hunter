import React from 'react';
import { MapPin, Star, Navigation, Flame } from 'lucide-react';
import { getPriceSymbol } from '../utils';

const RestaurantCard = ({ restaurant, onViewDetails }) => {
  return (
    <div
      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-6 border-2 border-orange-100 active:scale-[0.98] transition-transform cursor-pointer sm:cursor-default"
    >
      <div
        className="sm:contents"
        onClick={onViewDetails}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-2xl font-bold text-gray-800 mb-0.5 truncate">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-sm font-semibold">{restaurant.cuisine}</p>
              <span className="text-gray-400">•</span>
              <p className="text-orange-600 text-sm font-bold">
                {getPriceSymbol(restaurant.priceLevel)}
              </p>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">{restaurant.distance} mi</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-2 py-1 rounded-lg shadow-lg shrink-0 text-center">
            <div className="text-xs font-bold text-orange-200 leading-none">KETO</div>
            <div className="text-base font-black leading-tight">{Math.round(restaurant.ketoScore * 100)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm mb-1.5">
          <div className="flex items-center gap-1 text-gray-600">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span className="font-medium">{restaurant.rating}</span>
          </div>
          {restaurant.ketoReviews > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-xs inline-flex items-center gap-1"><Flame className="w-3 h-3" /></span>
              <span className="font-medium text-xs">{restaurant.ketoReviews} keto reviews</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs sm:text-sm truncate">{restaurant.address}</p>
      </div>

      <div className="hidden sm:flex gap-3 mt-3">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-[0.98] transition font-bold text-base shadow-lg"
        >
          View Details
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`, '_blank');
          }}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition active:scale-95"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      <div className="flex sm:hidden items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 italic">Tap for details</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`, '_blank');
          }}
          className="flex items-center gap-1 text-orange-600 text-xs font-semibold"
        >
          <Navigation className="w-3.5 h-3.5" /> Directions
        </button>
      </div>
    </div>
  );
};

export default RestaurantCard;

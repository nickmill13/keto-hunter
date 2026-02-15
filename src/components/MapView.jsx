import React from 'react';
import { Map } from 'lucide-react';

const MapView = ({ restaurants, center, onRestaurantClick, mapsReady }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const infoWindowRef = React.useRef(null);

  React.useEffect(() => {
    if (!mapRef.current || !center || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      new window.google.maps.Marker({
        position: { lat: center.lat, lng: center.lng },
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4A90E2',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    restaurants.forEach(restaurant => {
      const position = {
        lat: parseFloat(restaurant.lat) || center.lat,
        lng: parseFloat(restaurant.lng) || center.lng
      };

      let pinColor;
      if (restaurant.ketoScore >= 0.8) {
        pinColor = '#10B981';
      } else if (restaurant.ketoScore >= 0.6) {
        pinColor = '#F59E0B';
      } else {
        pinColor = '#EF4444';
      }

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: restaurant.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: pinColor,
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      const infoContent = `
        <div style="padding: 12px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; gap: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937; line-height: 1.3;">${restaurant.name}</h3>
            <div style="background: linear-gradient(135deg, #f97316, #ef4444); color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; white-space: nowrap; flex-shrink: 0;">
              ${Math.round(restaurant.ketoScore * 100)}%
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #6b7280; flex-wrap: wrap;">
            <span style="font-weight: 600;">${restaurant.cuisine}</span>
            <span>•</span>
            <span style="color: #f97316; font-weight: bold;">${'$'.repeat(restaurant.priceLevel)}</span>
            <span>•</span>
            <span>${restaurant.distance} mi</span>
          </div>
          ${restaurant.ketoReviews > 0 ? `
          <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; background: #d1fae5; padding: 3px 8px; border-radius: 6px; font-size: 12px;">
                <span style="font-weight: 600; color: #065f46;">${restaurant.ketoReviews} keto reviews</span>
              </div>
          </div>
          ` : ''}
          <button
            onclick="window.viewRestaurantDetails('${restaurant.id}')"
            style="width: 100%; padding: 10px 16px; background: linear-gradient(135deg, #f97316, #ef4444); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
            onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
          >
            View Details
          </button>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    window.viewRestaurantDetails = (restaurantId) => {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (restaurant) {
        infoWindowRef.current.close();
        onRestaurantClick(restaurant);
      }
    };

  }, [restaurants, center, onRestaurantClick, mapsReady]);

  if (!mapsReady) {
    return (
      <div className="w-full h-[350px] sm:h-[600px] rounded-2xl shadow-xl border-2 border-orange-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Map className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="font-semibold">Map loading...</p>
          <p className="text-sm">If this persists, Google Maps may not be configured</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[350px] sm:h-[600px] rounded-2xl shadow-xl border-2 border-orange-200"
    />
  );
};

export default MapView;

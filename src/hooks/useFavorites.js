import { useState, useEffect, useCallback } from 'react';
import { BASE_URL } from '../api/client';

export default function useFavorites({ isSignedIn, getToken }) {
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesList, setFavoritesList] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingFavorites(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFavoritesList(data.favorites);
        setFavorites(new Set(data.favorites.map(f => f.restaurant_id)));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, [isSignedIn, getToken]);

  // Load favorites when user signs in
  useEffect(() => {
    if (isSignedIn) {
      loadFavorites();
    } else {
      setFavorites(new Set());
      setFavoritesList([]);
    }
  }, [isSignedIn, loadFavorites]);

  const toggleFavorite = async (restaurant) => {
    if (!isSignedIn) return;

    const restaurantId = restaurant.id;
    const isFav = favorites.has(restaurantId);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(restaurantId);
      } else {
        next.add(restaurantId);
      }
      return next;
    });

    if (isFav) {
      setFavoritesList(prev => prev.filter(f => f.restaurant_id !== restaurantId));
    } else {
      setFavoritesList(prev => [{
        restaurant_id: restaurantId,
        restaurant_name: restaurant.name,
        restaurant_data: {
          address: restaurant.address,
          cuisine: restaurant.cuisine,
          ketoScore: restaurant.ketoScore,
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          location: restaurant.location,
          distance: restaurant.distance
        },
        created_at: new Date().toISOString()
      }, ...prev]);
    }

    try {
      const token = await getToken();
      if (isFav) {
        await fetch(`${BASE_URL}/api/favorites/${restaurantId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await fetch(`${BASE_URL}/api/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            restaurantId,
            restaurantName: restaurant.name,
            restaurantData: {
              address: restaurant.address,
              cuisine: restaurant.cuisine,
              ketoScore: restaurant.ketoScore,
              rating: restaurant.rating,
              priceLevel: restaurant.priceLevel,
              location: restaurant.location,
              distance: restaurant.distance
            }
          })
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      loadFavorites();
    }
  };

  return {
    favorites,
    favoritesList,
    loadingFavorites,
    toggleFavorite,
    loadFavorites
  };
}

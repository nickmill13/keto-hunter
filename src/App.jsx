import React, { useState, useEffect, useRef } from 'react';
import {
  Utensils, Star, Loader, TrendingUp, User, Flame,
  Map, FileText, DollarSign, Hand, Award, Download, X, Heart
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth
} from '@clerk/clerk-react';

import { BASE_URL, SEARCH_URL } from './api/client';
import { GOOGLE_MAPS_KEY, DEMO_RESTAURANTS } from './constants';
import { getPriceSymbol } from './utils';
import useRestaurantData from './hooks/useRestaurantData';
import useReviews from './hooks/useReviews';
import useFavorites from './hooks/useFavorites';

import MapView from './components/MapView';
import SearchCard from './components/SearchCard';
import FiltersPanel from './components/FiltersPanel';
import RestaurantCard from './components/RestaurantCard';
import DetailsModal from './components/DetailsModal';
import ReviewModal from './components/ReviewModal';
import EditReviewModal from './components/EditReviewModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function App() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // Search & location state
  const [location, setLocation] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [viewMode, setViewMode] = useState('list');
  const [mapCenter, setMapCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(!!window.google?.maps);

  const [filters, setFilters] = useState({
    maxDistance: 2,
    priceRange: [1, 2, 3, 4],
    cuisineTypes: [],
    minKetoScore: 0
  });

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show if user hasn't dismissed before
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Favorites view state
  const [showFavorites, setShowFavorites] = useState(false);

  // Hooks
  const favoriteActions = useFavorites({ isSignedIn, getToken });
  const restaurantData = useRestaurantData();
  const reviewActions = useReviews({
    isSignedIn, user, getToken, selectedRestaurant,
    loadReviews: restaurantData.loadReviews,
    setShowDetailsModal
  });

  // Dynamically load Google Maps JS API
  React.useEffect(() => {
    if (window.google?.maps || !GOOGLE_MAPS_KEY) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  const applyFilters = (restaurantList) => {
    return restaurantList.filter(restaurant => {
      const distanceValue = parseFloat(restaurant.distance);
      if (distanceValue > filters.maxDistance) return false;
      if (!filters.priceRange.includes(restaurant.priceLevel)) return false;
      if (filters.cuisineTypes.length > 0 && !filters.cuisineTypes.includes(restaurant.cuisine)) {
        return false;
      }
      if (filters.minKetoScore > 0 && restaurant.ketoScore < filters.minKetoScore) {
        return false;
      }
      return true;
    });
  };

  const searchByCoordinates = async (lat, lng) => {
    setLoading(true);
    setError(null);
    setMapCenter({ lat, lng });

    try {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: filters.maxDistance * 1609.34,
          searchQuery: restaurantQuery,
          filters: filters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();

      console.log(`[FRONTEND] Backend returned ${data.restaurants?.length || 0} restaurants`);
      console.log(`[FRONTEND] Search radius: ${filters.maxDistance} miles`);

      const filtered = applyFilters(data.restaurants || []);
      console.log(`[FRONTEND] After filtering: ${filtered.length} restaurants`);

      if (filtered.length > 0) {
        const distances = filtered.map(r => parseFloat(r.distance)).sort((a, b) => a - b);
        console.log(`[FRONTEND] Distance range: ${distances[0].toFixed(1)} - ${distances[distances.length - 1].toFixed(1)} miles`);
      }

      setAllRestaurants(filtered);
      setRestaurants(filtered.slice(0, 30));
      setDisplayCount(30);

      if (filtered.length === 0) {
        setError('No restaurants found matching your criteria. Try adjusting your filters.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to search for restaurants. Please try again.');
      const demoData = DEMO_RESTAURANTS;
      setRestaurants(applyFilters(demoData));
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation('Current Location');
          setCurrentCoordinates(coords);
          searchByCoordinates(coords.latitude, coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Unable to get your location. Please enter a location manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    if (location === 'Current Location' && currentCoordinates) {
      await searchByCoordinates(currentCoordinates.latitude, currentCoordinates.longitude);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const geocodeResponse = await fetch(`${BASE_URL}/api/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: location })
      });

      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.success) {
        setError(geocodeData.error || 'Could not find that location. Try a more specific address.');
        setLoading(false);
        return;
      }

      setLocation(geocodeData.formattedAddress);
      setCurrentCoordinates(null);
      await searchByCoordinates(geocodeData.latitude, geocodeData.longitude);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Unable to find that location. Please try again.');
      setLoading(false);
    }
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType];
      if (Array.isArray(current)) {
        const newArray = current.includes(value)
          ? current.filter(item => item !== value)
          : [...current, value];
        return { ...prev, [filterType]: newArray };
      }
      return prev;
    });
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
    restaurantData.loadReviews(restaurant);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 pb-safe">
      <style>{`
        :root {
          --sat: env(safe-area-inset-top);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
          --sar: env(safe-area-inset-right);
        }
        @supports (-webkit-touch-callout: none) {
          input, textarea, select { font-size: 16px !important; }
          .min-h-screen { min-height: -webkit-fill-available; }
          .safe-area-inset {
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
          .pb-safe { padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem)); }
        }
        button, a, input[type="checkbox"], input[type="radio"] { min-height: 44px; }
        html { -webkit-text-size-adjust: 100%; }
      `}</style>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-2 border-orange-200 p-4 flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-2.5 flex-shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Install Keto Hunter</p>
              <p className="text-gray-500 text-xs">Add to home screen for the best experience</p>
            </div>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm shadow-md hover:from-orange-600 hover:to-red-600 active:scale-95 transition flex-shrink-0"
            >
              Install
            </button>
            <button
              onClick={dismissInstallBanner}
              className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Decorative background */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 text-8xl flex items-center justify-center"><Flame className="w-16 h-16 text-orange-600" /></div>
        <div className="absolute top-40 right-20 text-7xl flex items-center justify-center"><Flame className="w-14 h-14 text-orange-600" /></div>
        <div className="absolute bottom-20 left-1/4 text-6xl flex items-center justify-center"><Utensils className="w-12 h-12 text-orange-600" /></div>
        <div className="absolute top-1/3 right-1/3 text-5xl flex items-center justify-center"><Flame className="w-10 h-10 text-green-600" /></div>
        <div className="absolute bottom-40 right-10 text-7xl flex items-center justify-center"><DollarSign className="w-14 h-14 text-yellow-600" /></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6 relative z-10 safe-area-inset">

        {/* Auth Header */}
        <div className="flex justify-end mb-4">
          <SignedOut>
            <div className="flex gap-2">
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-white/90 hover:bg-white text-orange-600 rounded-xl font-semibold text-sm transition shadow-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold text-sm transition shadow-lg">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition shadow-lg flex items-center gap-1.5 ${
                  showFavorites
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 hover:bg-white text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
              </button>
              <span className="text-white/90 text-sm font-medium hidden sm:block">
                Hey, {user?.firstName || 'Keto Hunter'}! <Hand className="inline w-4 h-4 ml-1" />
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-white/50"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-0 mb-2 sm:mb-4">
            <div className="relative sm:mb-3">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full blur opacity-75"></div>
              <div className="relative bg-white rounded-full p-2 sm:p-4 shadow-xl">
                <Utensils className="w-8 h-8 sm:w-12 sm:h-12 text-orange-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              KETO HUNTER
            </h1>
          </div>
          <div className="hidden sm:flex items-center justify-center gap-2 mb-3">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded"></div>
            <Award className="w-5 h-5 text-yellow-400" />
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded"></div>
          </div>
          <p className="text-yellow-100 text-sm sm:text-xl font-medium px-4 hidden sm:block">
            Hunt down the best keto-friendly spots near you
          </p>
        </div>

        {/* Map/List Toggle */}
        {(restaurants.length > 0 || allRestaurants.length > 0) && (
          <div className="mb-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-2 border-2 border-orange-200 inline-flex">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition flex items-center gap-2 ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Map className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <SearchCard
          location={location}
          setLocation={setLocation}
          restaurantQuery={restaurantQuery}
          setRestaurantQuery={setRestaurantQuery}
          loading={loading}
          error={error}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          onSearch={handleSearch}
          onGetCurrentLocation={getCurrentLocation}
        />

        {/* Filters */}
        {showFilters && (
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            toggleFilter={toggleFilter}
          />
        )}

        {/* Favorites View */}
        {showFavorites && isSignedIn && (
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-red-300 fill-current" />
              <h2 className="text-lg sm:text-3xl font-black text-white drop-shadow-lg">
                My Favorites ({favoriteActions.favoritesList.length})
              </h2>
            </div>

            {favoriteActions.loadingFavorites ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto text-white" />
                <p className="text-white/80 mt-2">Loading favorites...</p>
              </div>
            ) : favoriteActions.favoritesList.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
                <p className="text-white/80">Search for restaurants and tap the heart to save your favorites!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {favoriteActions.favoritesList.map((fav) => {
                  const restaurant = {
                    id: fav.restaurant_id,
                    name: fav.restaurant_name,
                    ...(fav.restaurant_data || {})
                  };
                  return (
                    <RestaurantCard
                      key={fav.restaurant_id}
                      restaurant={restaurant}
                      onViewDetails={() => handleRestaurantClick(restaurant)}
                      isFavorited={true}
                      onToggleFavorite={favoriteActions.toggleFavorite}
                      isSignedIn={isSignedIn}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!showFavorites && restaurants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-300" />
              <h2 className="text-lg sm:text-3xl font-black text-white drop-shadow-lg">
                Found {allRestaurants.length} Keto Spot{allRestaurants.length !== 1 ? 's' : ''} <Flame className="inline w-6 h-6 ml-1 text-orange-600" />
              </h2>
            </div>

            {/* Map Legend */}
            {viewMode === 'map' && (
              <div className="bg-white/90 rounded-xl p-4 mb-4 shadow-lg">
                <p className="text-sm font-bold text-gray-700 mb-2">Keto Score Legend:</p>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">High (80%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">Medium (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Lower (40-59%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Your Location</span>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'map' ? (
              <MapView
                restaurants={restaurants}
                center={mapCenter}
                mapsReady={googleMapsLoaded}
                onRestaurantClick={handleRestaurantClick}
              />
            ) : (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onViewDetails={() => handleRestaurantClick(restaurant)}
                    isFavorited={favoriteActions.favorites.has(restaurant.id)}
                    onToggleFavorite={favoriteActions.toggleFavorite}
                    isSignedIn={isSignedIn}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {allRestaurants.length > displayCount && (
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    const newCount = displayCount + 10;
                    setRestaurants(allRestaurants.slice(0, newCount));
                    setDisplayCount(newCount);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-95 transition font-bold text-lg shadow-lg"
                >
                  Load More ({allRestaurants.length - displayCount} more nearby)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!showFavorites && !loading && restaurants.length === 0 && !error && (
          <div className="text-center py-8 sm:py-16">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="absolute -inset-3 bg-white/20 rounded-full blur-lg"></div>
              <div className="relative bg-white/90 rounded-full p-4 sm:p-6 shadow-xl">
                <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">Ready to Hunt?</h3>
            <p className="text-white/90 font-medium text-base sm:text-lg max-w-md mx-auto px-4">
              Enter your location above to discover keto-friendly restaurants near you!
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewActions.showReviewModal && selectedRestaurant && (
        <ReviewModal
          selectedRestaurant={selectedRestaurant}
          user={user}
          reviewForm={reviewActions.reviewForm}
          setReviewForm={reviewActions.setReviewForm}
          submitReview={reviewActions.submitReview}
          onClose={() => reviewActions.setShowReviewModal(false)}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRestaurant && (
        <DetailsModal
          selectedRestaurant={selectedRestaurant}
          restaurantSignals={restaurantData.restaurantSignals}
          loadingSignals={restaurantData.loadingSignals}
          foundKetoFoods={restaurantData.foundKetoFoods}
          foundCustomizations={restaurantData.foundCustomizations}
          chainMenuData={restaurantData.chainMenuData}
          loadingChainMenu={restaurantData.loadingChainMenu}
          localMenuData={restaurantData.localMenuData}
          loadingLocalMenu={restaurantData.loadingLocalMenu}
          ketoItems={restaurantData.ketoItems}
          aiSuggestions={restaurantData.aiSuggestions}
          loadingAiSuggestions={restaurantData.loadingAiSuggestions}
          reviews={restaurantData.reviews}
          loadingReviews={restaurantData.loadingReviews}
          isSignedIn={isSignedIn}
          user={user}
          isFavorited={favoriteActions.favorites.has(selectedRestaurant.id)}
          onToggleFavorite={favoriteActions.toggleFavorite}
          onClose={() => {
            setShowDetailsModal(false);
            restaurantData.clearRestaurantData();
          }}
          onAddReview={() => {
            setShowDetailsModal(false);
            reviewActions.setShowReviewModal(true);
          }}
          onEditReview={reviewActions.handleEditReview}
          onDeleteReview={reviewActions.handleDeleteReview}
        />
      )}

      {/* Edit Review Modal */}
      {reviewActions.showEditReviewModal && reviewActions.editingReview && (
        <EditReviewModal
          selectedRestaurant={selectedRestaurant}
          editingReviewForm={reviewActions.editingReviewForm}
          setEditingReviewForm={reviewActions.setEditingReviewForm}
          submitEditedReview={reviewActions.submitEditedReview}
          onClose={() => reviewActions.setShowEditReviewModal(false)}
        />
      )}

      {/* Delete Confirm Modal */}
      {reviewActions.showDeleteConfirm && reviewActions.reviewToDelete && (
        <DeleteConfirmModal
          selectedRestaurant={selectedRestaurant}
          deletingReviewId={reviewActions.deletingReviewId}
          onCancel={reviewActions.cancelDelete}
          onConfirm={reviewActions.confirmDeleteReview}
        />
      )}
    </div>
  );
}

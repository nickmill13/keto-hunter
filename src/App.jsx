import React, { useState } from 'react';
import { Search, MapPin, Utensils, Star, Navigation, Loader, Filter, X, MessageSquare, Send, Award, TrendingUp } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ketoItems, setKetoItems] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [filters, setFilters] = useState({
    maxDistance: 10,
    priceRange: [1, 2, 3, 4],
    cuisineTypes: [],
    diningOptions: []
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    ketoRating: 5,
    comment: '',
    menuItems: '',
    userName: ''
  });

  const API_URL = 'https://keto-hunter-backend-production.up.railway.app/api/search-keto-restaurants';

  const cuisineOptions = [
    'American', 'Mediterranean', 'Mexican', 'Italian', 
    'Asian', 'Steakhouse', 'Seafood', 'BBQ', 'Indian', 'Thai'
  ];

  const diningOptionsData = [
    'Dine-in', 'Takeout', 'Delivery', 'Drive-through', 'Outdoor Seating'
  ];

  const searchByCoordinates = async (lat, lng) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: filters.maxDistance * 1609.34,
          filters: filters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      const filtered = applyFilters(data.restaurants || []);
      setRestaurants(filtered);
      
      if (filtered.length === 0) {
        setError('No restaurants found matching your criteria. Try adjusting your filters.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to search for restaurants. Please try again.');
      const demoData = getDemoRestaurants();
      setRestaurants(applyFilters(demoData));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (restaurantList) => {
    return restaurantList.filter(restaurant => {
      const distanceValue = parseFloat(restaurant.distance);
      if (distanceValue > filters.maxDistance) return false;
      if (!filters.priceRange.includes(restaurant.priceLevel)) return false;
      if (filters.cuisineTypes.length > 0 && !filters.cuisineTypes.includes(restaurant.cuisine)) {
        return false;
      }
      if (filters.diningOptions.length > 0) {
        const hasOption = filters.diningOptions.some(option => 
          restaurant.diningOptions?.includes(option)
        );
        if (!hasOption) return false;
      }
      return true;
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation('Current Location');
          searchByCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
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
    
    setLoading(true);
    setError(null);
    
    try {
      // First, geocode the address to get coordinates
      const geocodeResponse = await fetch('https://keto-hunter-backend-production.up.railway.app/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: location })
      });
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.success) {
        setError(geocodeData.error || 'Could not find that location. Try a more specific address.');
        setLoading(false);
        return;
      }
      
      // Update the location field with the formatted address
      setLocation(geocodeData.formattedAddress);
      
      // Now search with the coordinates
      await searchByCoordinates(geocodeData.latitude, geocodeData.longitude);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Unable to find that location. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  const getPriceSymbol = (level) => {
    return '$'.repeat(level);
  };

  const loadReviews = async (restaurant) => {
    setLoadingReviews(true);
    setShowDetailsModal(true);
    setAiSuggestions([]);
    
    try {
      const response = await fetch(
        `https://keto-hunter-backend-production.up.railway.app/api/reviews/${restaurant.id}`
      );
      const data = await response.json();
      setReviews(data.reviews || []);
      setKetoItems(data.ketoItems || []);
      
      // If no user-submitted keto items, fetch AI suggestions
      if (!data.ketoItems || data.ketoItems.length === 0) {
        fetchAiSuggestions(restaurant);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      setKetoItems([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchAiSuggestions = async (restaurant) => {
    if (!restaurant) return;
    
    setLoadingAiSuggestions(true);
    try {
      const response = await fetch(
        'https://keto-hunter-backend-production.up.railway.app/api/ai-suggestions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantName: restaurant.name,
            cuisine: restaurant.cuisine
          })
        }
      );
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const submitReview = async () => {
    if (!reviewForm.userName.trim() || !reviewForm.comment.trim()) {
      alert('Please fill in your name and review');
      return;
    }

    try {
      const response = await fetch('https://keto-hunter-backend-production.up.railway.app/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          restaurantName: selectedRestaurant.name,
          ...reviewForm
        })
      });

      if (response.ok) {
        alert('Thank you for your keto review!');
        setShowReviewModal(false);
        setReviewForm({
          rating: 5,
          ketoRating: 5,
          comment: '',
          menuItems: '',
          userName: ''
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
      setShowReviewModal(false);
    }
  };

  const getDemoRestaurants = () => [
    {
      id: 1,
      name: "The Protein Kitchen",
      cuisine: "American",
      distance: "0.3",
      rating: 4.8,
      ketoScore: 0.9,
      priceLevel: 2,
      ketoOptions: ["Grilled Salmon", "Bunless Burgers", "Cauliflower Rice Bowls"],
      address: "123 Main St",
      diningOptions: ["Dine-in", "Takeout", "Delivery"],
      ketoReviews: 45
    },
    {
      id: 2,
      name: "Green Leaf Bistro",
      cuisine: "Mediterranean",
      distance: "0.5",
      rating: 4.6,
      ketoScore: 0.85,
      priceLevel: 3,
      ketoOptions: ["Greek Salad (no pita)", "Grilled Chicken", "Lamb Kebabs"],
      address: "456 Oak Ave",
      diningOptions: ["Dine-in", "Outdoor Seating"],
      ketoReviews: 32
    },
    {
      id: 3,
      name: "Steakhouse Prime",
      cuisine: "Steakhouse",
      distance: "0.7",
      rating: 4.9,
      ketoScore: 0.95,
      priceLevel: 4,
      ketoOptions: ["Ribeye Steak", "Caesar Salad", "Grilled Vegetables"],
      address: "789 Elm Street",
      diningOptions: ["Dine-in"],
      ketoReviews: 78
    },
    {
      id: 4,
      name: "Ocean's Catch",
      cuisine: "Seafood",
      distance: "1.1",
      rating: 4.7,
      ketoScore: 0.88,
      priceLevel: 3,
      ketoOptions: ["Grilled Fish", "Shrimp Cocktail", "Lobster Tail"],
      address: "321 Beach Blvd",
      diningOptions: ["Dine-in", "Takeout"],
      ketoReviews: 56
    },
    {
      id: 5,
      name: "Taco Express",
      cuisine: "Mexican",
      distance: "1.5",
      rating: 4.4,
      ketoScore: 0.75,
      priceLevel: 1,
      ketoOptions: ["Burrito Bowl", "Carnitas Salad", "Guacamole"],
      address: "555 Sunset Blvd",
      diningOptions: ["Dine-in", "Takeout", "Drive-through"],
      ketoReviews: 23
    },
    {
      id: 6,
      name: "Curry House",
      cuisine: "Indian",
      distance: "2.3",
      rating: 4.5,
      ketoScore: 0.7,
      priceLevel: 2,
      ketoOptions: ["Tandoori Chicken", "Paneer Tikka", "Saag"],
      address: "888 Market St",
      diningOptions: ["Dine-in", "Delivery", "Takeout"],
      ketoReviews: 18
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500">
      {/* Decorative emojis - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 text-8xl">🥑</div>
        <div className="absolute top-40 right-20 text-7xl">🥩</div>
        <div className="absolute bottom-20 left-1/4 text-6xl">🍳</div>
        <div className="absolute top-1/3 right-1/3 text-5xl">🥓</div>
        <div className="absolute bottom-40 right-10 text-7xl">🧀</div>
      </div>

      {/* Main container - responsive padding */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6 relative z-10 safe-area-inset">
        {/* Header - responsive sizing */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full blur opacity-75"></div>
              <div className="relative bg-white rounded-full p-3 sm:p-4 shadow-xl">
                <span className="text-4xl sm:text-5xl">🍖</span>
              </div>
            </div>
          </div>
          {/* Responsive title - much smaller on mobile */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
            KETO HUNTER
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded"></div>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded"></div>
          </div>
          <p className="text-yellow-100 text-base sm:text-xl font-medium px-4">
            Hunt down the best keto-friendly spots near you 🎯
          </p>
        </div>

        {/* Search Card - responsive padding and layout */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-orange-300">
          <div className="space-y-3 sm:space-y-4">
            {/* Search input row - stacks on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter location (city, zip, address)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-gray-800 font-medium text-base"
                />
              </div>
              {/* Location button - full width on mobile, icon-only option */}
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-xl hover:from-orange-200 hover:to-yellow-200 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 font-semibold border-2 border-orange-200"
              >
                <Navigation className="w-5 h-5" />
                <span>Use My Location</span>
              </button>
            </div>
            
            {/* Action buttons - stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-[0.98] transition font-bold text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    Hunting...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    Start The Hunt 🔍
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto px-6 py-3 sm:py-3 bg-gradient-to-r from-yellow-100 to-amber-100 text-orange-800 rounded-xl hover:from-yellow-200 hover:to-amber-200 active:scale-95 transition flex items-center justify-center gap-2 font-semibold border-2 border-yellow-200"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {(filters.cuisineTypes.length > 0 || filters.diningOptions.length > 0) && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {filters.cuisineTypes.length + filters.diningOptions.length}
                  </span>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium text-sm sm:text-base">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel - responsive */}
        {showFilters && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-yellow-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Filter Your Hunt</h3>
            </div>
            
            {/* Distance slider */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🎯 Max Distance: <span className="text-orange-600">{filters.maxDistance} miles</span>
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

            {/* Price range - larger touch targets */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                💰 Price Range
              </label>
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

            {/* Cuisine types - scrollable on mobile */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🍽️ Cuisine Type
              </label>
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

            {/* Dining options */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📍 Dining Options
              </label>
              <div className="flex flex-wrap gap-2">
                {diningOptionsData.map(option => (
                  <button
                    key={option}
                    onClick={() => toggleFilter('diningOptions', option)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
                      filters.diningOptions.includes(option)
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setFilters({
                  maxDistance: 10,
                  priceRange: [1, 2, 3, 4],
                  cuisineTypes: [],
                  diningOptions: []
                });
              }}
              className="text-sm text-orange-600 hover:text-orange-700 font-bold underline"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results section */}
        {restaurants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-300" />
              <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-lg">
                Found {restaurants.length} Keto Spot{restaurants.length !== 1 ? 's' : ''} 🎉
              </h2>
            </div>
            {/* Restaurant cards - single column on mobile, 2 cols on large screens */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-orange-100 active:scale-[0.99] transition-transform"
                >
                  {/* Card header */}
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 truncate">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-gray-600 text-sm font-semibold">{restaurant.cuisine}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-orange-600 text-sm font-bold">
                          {getPriceSymbol(restaurant.priceLevel)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center bg-gradient-to-r from-yellow-100 to-amber-100 px-2 sm:px-3 py-1 rounded-full border-2 border-yellow-200 shrink-0">
                      <Star className="w-4 h-4 text-yellow-600 fill-current mr-1" />
                      <span className="font-bold text-yellow-700">{restaurant.rating}</span>
                    </div>
                  </div>

                  {/* Keto score bar */}
                  <div className="mb-3 sm:mb-4 bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl border-2 border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <span>🥑</span> KETO SCORE
                      </span>
                      <span className="text-sm font-black text-orange-600">
                        {Math.round(restaurant.ketoScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2.5 sm:h-3 rounded-full transition-all shadow-md"
                        style={{ width: `${restaurant.ketoScore * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2 text-orange-600 shrink-0" />
                    <span className="text-sm font-medium truncate">{restaurant.address} • {restaurant.distance} mi</span>
                  </div>

                  {/* Dining options badges */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex flex-wrap gap-1">
                      {restaurant.diningOptions?.map((option, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold border border-blue-200"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keto options - now user-submitted */}
                  <div className="border-t-2 border-gray-200 pt-3 sm:pt-4">
                    <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span>🍴</span> Keto Menu Items:
                    </p>
                    <p className="text-sm text-gray-500 italic">
                      Tap "View Details" to see keto items shared by the community, or be the first to share!
                    </p>
                  </div>

                  {/* Action buttons - stack on mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button 
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        loadReviews(restaurant);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-[0.98] transition font-bold shadow-md text-sm sm:text-base"
                    >
                      View Details & Reviews
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowReviewModal(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 rounded-xl hover:from-gray-200 hover:to-gray-300 active:scale-[0.98] transition font-bold flex items-center justify-center gap-2 border-2 border-gray-300 text-sm sm:text-base"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Review ({restaurant.ketoReviews})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {restaurants.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-orange-200">
            <div className="text-5xl sm:text-7xl mb-4">🔍</div>
            <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-orange-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg sm:text-xl font-semibold px-4">
              Ready to hunt? Enter a location above! 🎯
            </p>
          </div>
        )}
      </div>

      {/* Review Modal - Full screen on mobile */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-orange-200">
            {/* Modal header - sticky on mobile */}
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                <span>✍️</span> Add Keto Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 pb-8">
              <p className="text-gray-600 mb-6 font-semibold">{selectedRestaurant?.name}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewForm.userName}
                    onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none font-medium text-base"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewForm({ ...reviewForm, rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= reviewForm.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🥑 Keto-Friendliness Rating
                  </label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewForm({ ...reviewForm, ketoRating: rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= reviewForm.ketoRating
                              ? 'text-orange-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🍖 Keto Menu Items You Tried
                  </label>
                  <input
                    type="text"
                    value={reviewForm.menuItems}
                    onChange={(e) => setReviewForm({ ...reviewForm, menuItems: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none font-medium text-base"
                    placeholder="e.g., Bunless burger, Caesar salad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none h-28 sm:h-32 resize-none font-medium text-base"
                    placeholder="Share your keto dining experience..."
                  />
                </div>

                <button
                  onClick={submitReview}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-[0.98] transition font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Details & Reviews Modal - Full screen on mobile */}
      {showDetailsModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-orange-200">
            {/* Modal header - sticky */}
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
              <h3 className="text-lg sm:text-2xl font-black text-gray-800 truncate pr-2">
                {selectedRestaurant.name}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setReviews([]);
                  setKetoItems([]);
                  setAiSuggestions([]);
                }}
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 pb-8">
              {/* Restaurant info */}
              <div className="mb-6 space-y-2">
                <p className="text-gray-600 text-sm sm:text-base">
                  <strong>Address:</strong> {selectedRestaurant.address}
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  <strong>Distance:</strong> {selectedRestaurant.distance} miles
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  <strong>Cuisine:</strong> {selectedRestaurant.cuisine}
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  <strong>Price:</strong> {getPriceSymbol(selectedRestaurant.priceLevel)}
                </p>

                {/* Keto score */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl border-2 border-orange-200 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <span>🥑</span> KETO SCORE
                    </span>
                    <span className="text-sm font-black text-orange-600">
                      {Math.round(selectedRestaurant.ketoScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all shadow-md"
                      style={{ width: `${selectedRestaurant.ketoScore * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* User-submitted Keto Items */}
              <div className="mb-6">
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🍴</span> Community Keto Picks
                </h4>
                {loadingReviews ? (
                  <div className="text-center py-4">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  </div>
                ) : ketoItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ketoItems.map((item, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-orange-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-3 text-center">
                      No community picks yet. Be the first to share what you ordered!
                    </p>
                    
                    {/* AI Suggestions Section */}
                    {loadingAiSuggestions ? (
                      <div className="text-center py-2">
                        <Loader className="w-5 h-5 animate-spin mx-auto text-purple-500" />
                        <p className="text-gray-400 text-xs mt-1">Getting suggestions...</p>
                      </div>
                    ) : aiSuggestions.length > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-purple-600 text-xs font-bold uppercase tracking-wide">
                            🤖 AI-Suggested Keto Options
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2 italic">
                          These are possible keto-friendly items based on the cuisine type. Actual menu may vary.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map((item, index) => (
                            <span
                              key={index}
                              className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-purple-200 border-dashed"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reviews section */}
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800">
                    Keto Reviews ({reviews.length})
                  </h4>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowReviewModal(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 active:scale-95 transition font-semibold text-sm whitespace-nowrap"
                  >
                    Add Review
                  </button>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 truncate">{review.user_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 sm:gap-2 shrink-0">
                            <div className="flex items-center bg-yellow-100 px-2 py-1 rounded">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 fill-current mr-1" />
                              <span className="text-xs sm:text-sm font-bold text-yellow-700">
                                {review.overall_rating}
                              </span>
                            </div>
                            <div className="flex items-center bg-green-100 px-2 py-1 rounded">
                              <span className="text-xs sm:text-sm mr-1">🥑</span>
                              <span className="text-xs sm:text-sm font-bold text-green-700">
                                {review.keto_rating}
                              </span>
                            </div>
                          </div>
                        </div>

                        {review.menu_items && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Tried:</strong> {review.menu_items}
                          </p>
                        )}

                        <p className="text-gray-700 text-sm sm:text-base">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
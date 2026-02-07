import React, { useState } from 'react';
import { 
  Search, MapPin, Utensils, Star, Navigation, Loader, Filter, X, 
  MessageSquare, Send, Award, TrendingUp, User, Target, Sparkles,
  Map, Flame, Pencil, AlertTriangle, CheckCircle, DollarSign, Hand,
  Lightbulb, FileText, UtensilsCrossed
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


export default function App() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  
  const [location, setLocation] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState(null); // Store coords when using "Current Location"
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [viewMode, setViewMode] = useState('list'); // NEW: 'list' or 'map'
  const [mapCenter, setMapCenter] = useState(null); // NEW: Store user's location
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
  const [restaurantSignals, setRestaurantSignals] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [foundKetoFoods, setFoundKetoFoods] = useState([]);
  const [foundCustomizations, setFoundCustomizations] = useState([]);
  const [foundCookingMethods, setFoundCookingMethods] = useState([]);
  const [chainMenuData, setChainMenuData] = useState(null);
  const [loadingChainMenu, setLoadingChainMenu] = useState(false);
  const [showMobileRestaurantSearch, setShowMobileRestaurantSearch] = useState(false);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editingReviewForm, setEditingReviewForm] = useState({
    rating: 5,
    ketoRating: 5,
    comment: '',
    menuItems: ''
  });
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const confidenceLabel = (conf) => {
  if (conf == null) return 'Unknown';
  const n = Number(conf);
  if (n >= 0.75) return 'High';
  if (n >= 0.45) return 'Medium';
  return 'Low';
};


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
    menuItems: ''
  });


const BASE_URL = (import.meta.env.VITE_API_URL || 'https://keto-hunter-backend-production.up.railway.app').replace(/\/$/, '');

  const SEARCH_URL = `${BASE_URL}/api/search-keto-restaurants`;

  const cuisineOptions = [
    'American', 'Mediterranean', 'Greek', 'Mexican', 'Italian', 
    'Chinese', 'Japanese', 'Thai', 'Indian', 'Vietnamese', 'Korean',
    'Steakhouse', 'Seafood', 'BBQ', 'Brazilian', 'Middle Eastern',
    'Bar & Grill', 'Fast Food', 'Burgers', 'Sandwiches'
  ];

  const diningOptionsData = [
    'Dine-in', 'Takeout', 'Delivery', 'Drive-through', 'Outdoor Seating'
  ];

  const searchByCoordinates = async (lat, lng) => {
    setLoading(true);
    setError(null);
    setMapCenter({ lat, lng }); // NEW: Save location for map

    try {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      // Log distance range
      if (filtered.length > 0) {
        const distances = filtered.map(r => parseFloat(r.distance)).sort((a, b) => a - b);
        console.log(`[FRONTEND] Distance range: ${distances[0].toFixed(1)} - ${distances[distances.length - 1].toFixed(1)} miles`);
      }
      
      setAllRestaurants(filtered); // Store all results for pagination
      setRestaurants(filtered.slice(0, 30)); // Show first 30 (was 20)
      setDisplayCount(30); // Reset display count

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
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          setLocation('Current Location');
          setCurrentCoordinates(coords); // Save coordinates for future searches
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
    
    // If location is "Current Location" and we have stored coordinates, use them directly
    if (location === 'Current Location' && currentCoordinates) {
      await searchByCoordinates(currentCoordinates.latitude, currentCoordinates.longitude);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const geocodeResponse = await fetch(`${BASE_URL}/api/geocode`, {
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
      
      setLocation(geocodeData.formattedAddress);
      setCurrentCoordinates(null); // Clear current location coords when using typed address
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

  // Signals UI state
  setLoadingSignals(true);
  setRestaurantSignals(null);

  // Reset per-restaurant UI state
  setAiSuggestions([]);
  setReviews([]);
  setKetoItems([]);
  setFoundKetoFoods([]);
  setFoundCustomizations([]);
  setFoundCookingMethods([]);
  setChainMenuData(null);

  try {
    // --- A) Load signals (or create them once, then reload) ---
    const getSignals = async () => {
      const res = await fetch(`${BASE_URL}/api/restaurant-signals/${restaurant.id}`);
      if (!res.ok) throw new Error(`Signals fetch failed (${res.status})`);
      return res.json();
    };

    let signalsPayload = await getSignals();

    // Always analyze to get the found items (they're not stored in DB)
    const analyzeRes = await fetch(`${BASE_URL}/api/analyze-google-reviews/${restaurant.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantName: restaurant.name })
    });

    if (analyzeRes.ok) {
      const analysisData = await analyzeRes.json();
      
      // Store the found items
      setFoundKetoFoods(analysisData.foundKetoFoods || []);
      setFoundCustomizations(analysisData.foundCustomizations || []);
      setFoundCookingMethods(analysisData.foundCookingMethods || []);
      
      // Refresh signals
      signalsPayload = await getSignals();
    }

    setRestaurantSignals(signalsPayload?.signals || null);
  } catch (err) {
    console.error('Error loading/analyzing restaurant signals:', err);
    setRestaurantSignals(null);
  } finally {
    setLoadingSignals(false);
  }

  // --- B) Check for verified chain menu data ---
  try {
    setLoadingChainMenu(true);
    const chainResponse = await fetch(
      `${BASE_URL}/api/chain-menu/${restaurant.id}?restaurantName=${encodeURIComponent(restaurant.name)}`
    );
    if (chainResponse.ok) {
      const chainData = await chainResponse.json();
      if (chainData.isChain && chainData.items.length > 0) {
        setChainMenuData(chainData);
      }
    }
  } catch (err) {
  } finally {
    setLoadingChainMenu(false);
  }

  // --- C) Load community reviews ---
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${restaurant.id}`);
    if (!response.ok) throw new Error(`Reviews fetch failed (${response.status})`);

    const data = await response.json();
    setReviews(data.reviews || []);
    setKetoItems(data.ketoItems || []);

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
        `${BASE_URL}/api/ai-suggestions`,
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
    if (!isSignedIn) {
      alert('Please sign in to submit a review');
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a review');
      return;
    }

    // Get the auth token from Clerk
    const token = await getToken();

    // Get user's name from Clerk
    const userName = user?.firstName 
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : user?.username || 'Anonymous';

    try {
      const response = await fetch(`${BASE_URL}/api/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // Send the auth token!
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          restaurantName: selectedRestaurant.name,
          userName: userName,
          ...reviewForm
        })
      });

      if (response.status === 401) {
        alert('Your session has expired. Please sign in again.');
        return;
      }

      if (response.ok) {
        alert('Thank you for your keto review!');
        setShowReviewModal(false);
        setReviewForm({
          rating: 5,
          ketoRating: 5,
          comment: '',
          menuItems: ''
        });
        // Reload reviews to show the new one
        if (selectedRestaurant) {
          loadReviews(selectedRestaurant);
          setShowDetailsModal(true);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
      setShowReviewModal(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditingReviewForm({
      rating: review.overall_rating,
      ketoRating: review.keto_rating,
      comment: review.comment,
      menuItems: review.menu_items || ''
    });
    setShowEditReviewModal(true);
  };

  const submitEditedReview = async () => {
    if (!editingReview) return;
    if (!editingReviewForm.comment.trim()) {
      alert('Please write a review');
      return;
    }

    const token = await getToken();

    try {
      const response = await fetch(`${BASE_URL}/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingReviewForm)
      });

      if (response.status === 401) {
        alert('Your session has expired. Please sign in again.');
        return;
      }

      if (response.ok) {
        alert('Review updated!');
        setShowEditReviewModal(false);
        setEditingReview(null);
        // Reload reviews
        if (selectedRestaurant) {
          loadReviews(selectedRestaurant);
          setShowDetailsModal(true);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update review. Please try again.');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Failed to update review. Please try again.');
    }
  };

  const handleDeleteReview = async (review) => {
    setReviewToDelete(review);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    setDeletingReviewId(reviewToDelete.id);
    const token = await getToken();

    try {
      const response = await fetch(`${BASE_URL}/api/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        alert('Your session has expired. Please sign in again.');
        return;
      }

      if (response.ok) {
        alert('Review deleted!');
        setShowDeleteConfirm(false);
        setReviewToDelete(null);
        setDeletingReviewId(null);
        // Reload reviews
        if (selectedRestaurant) {
          loadReviews(selectedRestaurant);
          setShowDetailsModal(true);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete review. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    } finally {
      setDeletingReviewId(null);
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

  // Map component
  const MapView = ({ restaurants, center, onRestaurantClick }) => {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);
    const markersRef = React.useRef([]);
    const infoWindowRef = React.useRef(null);

    React.useEffect(() => {
      if (!mapRef.current || !center || !window.google) return;

      // Initialize map
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

        // Add user location marker (blue)
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

        // Initialize info window (reuse single instance)
        infoWindowRef.current = new window.google.maps.InfoWindow();
      }

      // Clear old markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add restaurant markers
      restaurants.forEach(restaurant => {
        const position = { 
          lat: parseFloat(restaurant.lat) || center.lat, 
          lng: parseFloat(restaurant.lng) || center.lng 
        };

        // Color based on keto score
        let pinColor;
        if (restaurant.ketoScore >= 0.8) {
          pinColor = '#10B981'; // Green
        } else if (restaurant.ketoScore >= 0.6) {
          pinColor = '#F59E0B'; // Yellow
        } else {
          pinColor = '#EF4444'; // Red
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

        // Create info window content
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
              <span>â€¢</span>
              <span style="color: #f97316; font-weight: bold;">${'$'.repeat(restaurant.priceLevel)}</span>
              <span>â€¢</span>
              <span>${restaurant.distance} mi</span>
            </div>
            <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; background: #fef3c7; padding: 3px 8px; border-radius: 6px; font-size: 12px;">
                <span style="margin-right: 4px;">â­</span>
                <span style="font-weight: 600; color: #92400e;">${restaurant.rating}</span>
              </div>
              ${restaurant.ketoReviews > 0 ? `
                <div style="display: flex; align-items: center; background: #d1fae5; padding: 3px 8px; border-radius: 6px; font-size: 12px;">
                  <span style="margin-right: 4px;">ðŸ”¥</span>
                  <span style="font-weight: 600; color: #065f46;">${restaurant.ketoReviews} reviews</span>
                </div>
              ` : ''}
            </div>
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

        // Click handler - show info window
        marker.addListener('click', () => {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      });

      // Global function to handle "View Details" button click from info window
      window.viewRestaurantDetails = (restaurantId) => {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        if (restaurant) {
          infoWindowRef.current.close();
          onRestaurantClick(restaurant);
        }
      };

    }, [restaurants, center, onRestaurantClick]);

    return (
      <div 
        ref={mapRef} 
        className="w-full h-[350px] sm:h-[600px] rounded-2xl shadow-xl border-2 border-orange-200"
      />
    );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500">
      {/* Decorative emojis - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 text-8xl flex items-center justify-center"><Flame className="w-16 h-16 text-orange-600" /></div>
        <div className="absolute top-40 right-20 text-7xl flex items-center justify-center"><Flame className="w-14 h-14 text-orange-600" /></div>
        <div className="absolute bottom-20 left-1/4 text-6xl flex items-center justify-center"><Utensils className="w-12 h-12 text-orange-600" /></div>
        <div className="absolute top-1/3 right-1/3 text-5xl flex items-center justify-center"><Flame className="w-10 h-10 text-green-600" /></div>
        <div className="absolute bottom-40 right-10 text-7xl flex items-center justify-center"><DollarSign className="w-14 h-14 text-yellow-600" /></div>
      </div>

      {/* Main container - responsive padding */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6 relative z-10 safe-area-inset">
        
        {/* Auth Header Bar */}
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

        {/* Header - compact on mobile, full on desktop */}
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

        {/* Map/List View Toggle - At top, always visible after first search */}
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

        {/* Search Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 sm:p-6 mb-4 sm:mb-6 border-2 border-orange-300">
          <div className="space-y-3">
            {/* Location input with buttons on the right */}
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
              
              {/* Right side buttons */}
              <button
                onClick={getCurrentLocation}
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
                {(filters.cuisineTypes.length > 0 || filters.diningOptions.length > 0) && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1.5 min-w-[18px] text-center font-semibold">
                    {filters.cuisineTypes.length + filters.diningOptions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Restaurant search - always visible on desktop */}
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

            {/* Mobile: collapsible restaurant search */}
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

            {/* Start Hunt button - smaller, full width */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-base shadow-lg"
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

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium text-sm sm:text-base">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
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

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2"> Dining Options</label>
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

    {/* Conditional Rendering: Map or List */}
    {viewMode === 'map' ? (
      <MapView 
        restaurants={restaurants} 
        center={mapCenter}
        onRestaurantClick={(restaurant) => {
          setSelectedRestaurant(restaurant);
          loadReviews(restaurant);
        }}
      />
    ) : (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-6 border-2 border-orange-100 active:scale-[0.98] transition-transform cursor-pointer sm:cursor-default"
          >
                  <div
                    className="sm:contents"
                    onClick={() => {
                      setSelectedRestaurant(restaurant);
                      loadReviews(restaurant);
                    }}
                  >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base sm:text-2xl font-bold text-gray-800 mb-0.5 truncate">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-600 text-sm font-semibold">{restaurant.cuisine}</p>
                        <span className="text-gray-400">â€¢</span>
                        <p className="text-orange-600 text-sm font-bold">
                          {getPriceSymbol(restaurant.priceLevel)}
                        </p>
                        <span className="text-gray-400">â€¢</span>
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

                  {/* Rating + reviews row */}
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

                  {/* Desktop: action buttons */}
                  <div className="hidden sm:flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        loadReviews(restaurant);
                      }}
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

                  {/* Mobile: hint + directions link */}
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
              ))}
            </div>
          )}

          {/* Load More Button */}
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
        {!loading && restaurants.length === 0 && !error && (
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
      {showReviewModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-orange-200">
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                <span><Pencil className="inline w-5 h-5" /></span> Add Keto Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 pb-8">
              <p className="text-gray-600 mb-4 font-semibold">{selectedRestaurant?.name}</p>
              
              {/* Show who is reviewing */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm text-green-800 font-semibold">
                    Reviewing as {user?.firstName || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-green-600">Your name will appear with your review</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Overall Rating</label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewForm({ ...reviewForm, rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${rating <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2"><Flame className="inline w-4 h-4 mr-1 text-orange-600" /> Keto-Friendliness Rating</label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewForm({ ...reviewForm, ketoRating: rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${rating <= reviewForm.ketoRating ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2"> Keto Menu Items You Tried</label>
                  <input
                    type="text"
                    value={reviewForm.menuItems}
                    onChange={(e) => setReviewForm({ ...reviewForm, menuItems: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none font-medium text-base"
                    placeholder="e.g., Bunless burger, Caesar salad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
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

      {/* Restaurant Details Modal */}
      {showDetailsModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-orange-200">
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
              {/* Mobile: compact quick-info bar with directions CTA */}
              <div className="flex sm:hidden items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-4 border border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-orange-500" />{selectedRestaurant.distance} mi</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />{selectedRestaurant.rating}</span>
                  <span className="font-semibold text-orange-600">{getPriceSymbol(selectedRestaurant.priceLevel)}</span>
                </div>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.name + ' ' + selectedRestaurant.address)}`, '_blank')}
                  className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </button>
              </div>
              {/* Mobile: just the address in small text */}
              <p className="text-gray-500 text-xs sm:hidden truncate mb-4">{selectedRestaurant.address}</p>

              <div className="mb-4 space-y-1.5">
                {/* Desktop: full detail rows */}
                <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Address:</strong> {selectedRestaurant.address}</p>
                <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Distance:</strong> {selectedRestaurant.distance} miles</p>
                <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Cuisine:</strong> {selectedRestaurant.cuisine}</p>
                <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Price:</strong> {getPriceSymbol(selectedRestaurant.priceLevel)}</p>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl border-2 border-orange-200 mt-2 sm:mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Flame className="inline w-5 h-5 mr-1 text-orange-600" /> KETO SCORE
                    </span>
                    <span className="text-sm font-black text-orange-600">
                      {Math.round(selectedRestaurant.ketoScore * 100)}%
                    </span>
                  </div>
 <div className="text-xs font-semibold text-gray-600 mb-2">
  Keto Confidence:{' '}
  {loadingSignals
    ? 'Loading...'
    : confidenceLabel(restaurantSignals?.keto_confidence)}
  {!loadingSignals && restaurantSignals?.keto_confidence != null
    ? ` (${Number(restaurantSignals.keto_confidence).toFixed(2)})`
    : ''}
</div>

{!loadingSignals && restaurantSignals?.reasons && (
  <div className="mt-2 mb-2 text-xs text-gray-700 italic bg-white/50 p-2 rounded border border-orange-200">
    <Lightbulb className="inline w-4 h-4" /> {restaurantSignals.reasons}
  </div>
)}

{/* Display found keto-friendly items */}
{!loadingSignals && foundKetoFoods.length > 0 && (
  <div className="mt-3 mb-2">
    <p className="text-xs font-semibold text-gray-700 mb-1.5">
       Mentioned in reviews:
    </p>
    <div className="flex flex-wrap gap-1.5">
      {foundKetoFoods.map((item, index) => (
        <span 
          key={index} 
          className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium border border-green-300"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
)}

{/* Optional: Show customization options found */}
{!loadingSignals && foundCustomizations.length > 0 && (
  <div className="mt-2 mb-2">
    <p className="text-xs font-semibold text-gray-700 mb-1.5"><Pencil className="inline w-5 h-5" />  Customization options available:
    </p>
    <div className="flex flex-wrap gap-1.5">
      {foundCustomizations.map((item, index) => (
        <span 
          key={index} 
          className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-300"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
)}
<div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
  <div
    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all shadow-md"
    style={{ width: `${selectedRestaurant.ketoScore * 100}%` }}
  ></div>
</div>
              </div>
            </div>


            {/* NEW: Verified Chain Menu Section */}
            {chainMenuData && chainMenuData.items.length > 0 && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-300">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="text-lg font-bold text-emerald-800">
                        Verified Menu - {chainMenuData.chainName}
                      </h4>
                      <p className="text-xs text-emerald-600">
                        Nutrition data from official sources
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {chainMenuData.items.map((item, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-lg p-3 border border-emerald-200 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800 text-sm flex-1">
                            {item.name}
                          </p>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            item.carbs < 10 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.carbs}g carbs
                          </span>
                        </div>
                        
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span> {item.calories} cal</span>
                          <span> {item.protein}g protein</span>
                          <span><Flame className="inline w-4 h-4 text-orange-600" /> {item.fat}g fat</span>
                        </div>
                        {item.orderAs && (
                          <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                            <FileText className="inline w-5 h-5" /> Say: "{item.orderAs}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {chainMenuData.orderTips && chainMenuData.orderTips.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 mb-1.5"><Lightbulb className="inline w-4 h-4" /> Order Tips:</p>
                      {chainMenuData.orderTips.map((tip, i) => (
                        <p key={i} className="text-xs text-gray-600 mb-1">  {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Award className="inline w-5 h-5 mr-2 text-orange-600" /> Community Keto Picks
              </h4>
              
                {loadingReviews ? (
                  <div className="text-center py-4">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  </div>
                ) : ketoItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ketoItems.map((item, index) => (
                      <span key={index} className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-orange-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-3 text-center">
                      No community picks yet. Be the first to share what you ordered!
                    </p>
                    
                    {loadingAiSuggestions ? (
                      <div className="text-center py-2">
                        <Loader className="w-5 h-5 animate-spin mx-auto text-purple-500" />
                        <p className="text-gray-400 text-xs mt-1">Getting suggestions...</p>
                      </div>
                    ) : aiSuggestions.length > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-purple-600 text-xs font-bold uppercase tracking-wide">
                            <Sparkles className="inline w-4 h-4 mr-1 text-purple-600" /> AI-Suggested Keto Options
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2 italic">
                          These are possible keto-friendly items based on the cuisine type. Actual menu may vary.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map((item, index) => (
                            <span key={index} className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-purple-200 border-dashed">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800">
                    Keto Reviews ({reviews.length})
                  </h4>
                  
                  <SignedIn>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowReviewModal(true);
                      }}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 active:scale-95 transition font-semibold text-sm whitespace-nowrap"
                    >
                      Add Review
                    </button>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-gray-500 hover:to-gray-600 active:scale-95 transition font-semibold text-sm whitespace-nowrap flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Sign in to Review
                      </button>
                    </SignInButton>
                  </SignedOut>
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
                              <span className="text-xs sm:text-sm font-bold text-yellow-700">{review.overall_rating}</span>
                            </div>
                            <div className="flex items-center bg-green-100 px-2 py-1 rounded">
                              <span className="text-xs sm:text-sm mr-1"><Flame className="inline w-4 h-4 text-orange-600" /></span>
                              <span className="text-xs sm:text-sm font-bold text-green-700">{review.keto_rating}</span>
                            </div>
                          </div>
                        </div>

                        {review.menu_items && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Tried:</strong> {review.menu_items}
                          </p>
                        )}

                        <p className="text-gray-700 text-sm sm:text-base mb-3">{review.comment}</p>

                        {/* Edit/Delete buttons - only show if user owns the review */}
                        {isSignedIn && user && review.user_id === user.id && (
                          <div className="flex gap-2 pt-3 border-t border-gray-300">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition active:scale-95"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review)}
                              className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition active:scale-95"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditReviewModal && editingReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-blue-200">
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit Keto Review
              </h3>
              <button
                onClick={() => {
                  setShowEditReviewModal(false);
                  setEditingReview(null);
                }}
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 pb-8">
              <p className="text-gray-600 mb-4 font-semibold">{selectedRestaurant?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Overall Rating</label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setEditingReviewForm({ ...editingReviewForm, rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${rating <= editingReviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2"><Flame className="inline w-4 h-4 mr-1 text-orange-600" /> Keto-Friendliness Rating</label>
                  <div className="flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setEditingReviewForm({ ...editingReviewForm, ketoRating: rating })}
                        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-90"
                      >
                        <Star className={`w-8 h-8 ${rating <= editingReviewForm.ketoRating ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2"><UtensilsCrossed className="inline w-4 h-4" /> Keto Menu Items You Tried</label>
                  <input
                    type="text"
                    value={editingReviewForm.menuItems}
                    onChange={(e) => setEditingReviewForm({ ...editingReviewForm, menuItems: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none font-medium text-base"
                    placeholder="e.g., Bunless burger, Caesar salad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={editingReviewForm.comment}
                    onChange={(e) => setEditingReviewForm({ ...editingReviewForm, comment: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none h-28 sm:h-32 resize-none font-medium text-base"
                    placeholder="Share your keto dining experience..."
                  />
                </div>

                <button
                  onClick={submitEditedReview}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 active:scale-[0.98] transition font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && reviewToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm mx-4 border-2 border-red-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 text-center mb-2">
                Delete This Review?
              </h3>
              
              <p className="text-gray-600 text-center mb-2">
                You're about to delete your review for <strong>{selectedRestaurant?.name}</strong>
              </p>
              
              <p className="text-gray-500 text-center text-sm mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setReviewToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteReview}
                  disabled={deletingReviewId !== null}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingReviewId !== null ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Review'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
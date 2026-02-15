import { useState, useRef } from 'react';
import { BASE_URL, fetchWithTimeout } from '../api/client';
import { getCachedData, setCachedData, CHAIN_MENU_TTL, LOCAL_MENU_TTL } from '../api/cache';

export default function useRestaurantData() {
  const [restaurantSignals, setRestaurantSignals] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [foundKetoFoods, setFoundKetoFoods] = useState([]);
  const [foundCustomizations, setFoundCustomizations] = useState([]);
  const [foundCookingMethods, setFoundCookingMethods] = useState([]);
  const [chainMenuData, setChainMenuData] = useState(null);
  const [loadingChainMenu, setLoadingChainMenu] = useState(false);
  const [localMenuData, setLocalMenuData] = useState(null);
  const [loadingLocalMenu, setLoadingLocalMenu] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ketoItems, setKetoItems] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);

  const loadRequestIdRef = useRef(0);

  const fetchAiSuggestions = async (restaurant) => {
    if (!restaurant) return;
    setLoadingAiSuggestions(true);
    try {
      const response = await fetch(`${BASE_URL}/api/ai-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          cuisine: restaurant.cuisine
        })
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const loadReviews = async (restaurant) => {
    const requestId = ++loadRequestIdRef.current;
    const isStale = () => requestId !== loadRequestIdRef.current;

    setLoadingReviews(true);
    setLoadingSignals(true);
    setRestaurantSignals(null);
    setAiSuggestions([]);
    setReviews([]);
    setKetoItems([]);
    setFoundKetoFoods([]);
    setFoundCustomizations([]);
    setFoundCookingMethods([]);
    setChainMenuData(null);
    setLocalMenuData(null);

    const loadSignalsAndMenu = async () => {
      let analysisKetoFoods = [];

      try {
        const getSignals = async () => {
          const res = await fetchWithTimeout(`${BASE_URL}/api/restaurant-signals/${restaurant.id}`);
          if (!res.ok) throw new Error(`Signals fetch failed (${res.status})`);
          return res.json();
        };

        const analyzeRes = await fetchWithTimeout(`${BASE_URL}/api/analyze-google-reviews/${restaurant.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantName: restaurant.name })
        });

        if (analyzeRes.ok) {
          const analysisData = await analyzeRes.json();
          analysisKetoFoods = analysisData.foundKetoFoods || [];

          if (isStale()) return;

          setFoundKetoFoods(analysisKetoFoods);
          setFoundCustomizations(analysisData.foundCustomizations || []);
          setFoundCookingMethods(analysisData.foundCookingMethods || []);
        }

        const signalsPayload = await getSignals();
        if (isStale()) return;
        setRestaurantSignals(signalsPayload?.signals || null);
      } catch (err) {
        console.error('Error loading/analyzing restaurant signals:', err);
        if (!isStale()) setRestaurantSignals(null);
      } finally {
        if (!isStale()) setLoadingSignals(false);
      }

      try {
        if (isStale()) return;
        setLoadingChainMenu(true);
        setLoadingLocalMenu(true);

        const chainCacheKey = `chain-menu:${restaurant.id}`;
        const cachedChain = getCachedData(chainCacheKey);
        if (cachedChain) {
          if (!isStale()) {
            setChainMenuData(cachedChain);
            setLoadingChainMenu(false);
            setLoadingLocalMenu(false);
          }
        } else {
          const localCacheKey = `local-menu:${restaurant.id}`;
          const cachedLocal = getCachedData(localCacheKey);
          if (cachedLocal) {
            if (!isStale()) {
              setLocalMenuData(cachedLocal);
              setLoadingChainMenu(false);
              setLoadingLocalMenu(false);
            }
          } else {
            const chainResponse = await fetchWithTimeout(
              `${BASE_URL}/api/chain-menu/${restaurant.id}?restaurantName=${encodeURIComponent(restaurant.name)}`
            );
            if (chainResponse.ok) {
              const chainData = await chainResponse.json();
              if (isStale()) return;
              if (chainData.isChain && chainData.items.length > 0) {
                setChainMenuData(chainData);
                setCachedData(chainCacheKey, chainData, CHAIN_MENU_TTL);
                setLoadingLocalMenu(false);
              } else {
                setLoadingChainMenu(false);
                try {
                  const localResponse = await fetchWithTimeout(`${BASE_URL}/api/local-menu-analysis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      restaurantName: restaurant.name,
                      cuisine: restaurant.cuisine,
                      reviewSnippets: analysisKetoFoods.length > 0 ? analysisKetoFoods : undefined
                    })
                  });
                  if (localResponse.ok) {
                    const localData = await localResponse.json();
                    if (!isStale() && localData.isLocal && localData.items && localData.items.length > 0) {
                      setLocalMenuData(localData);
                      setCachedData(localCacheKey, localData, LOCAL_MENU_TTL);
                    }
                  }
                } catch (localErr) {
                  console.error('Error fetching local menu analysis:', localErr);
                } finally {
                  if (!isStale()) setLoadingLocalMenu(false);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading chain/local menu data:', err);
      } finally {
        if (!isStale()) {
          setLoadingChainMenu(false);
          setLoadingLocalMenu(false);
        }
      }
    };

    const loadCommunityReviews = async () => {
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/api/reviews/${restaurant.id}`);
        if (!response.ok) throw new Error(`Reviews fetch failed (${response.status})`);

        const data = await response.json();
        if (isStale()) return;
        setReviews(data.reviews || []);
        setKetoItems(data.ketoItems || []);

        if (!data.ketoItems || data.ketoItems.length === 0) {
          fetchAiSuggestions(restaurant);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        if (!isStale()) {
          setReviews([]);
          setKetoItems([]);
        }
      } finally {
        if (!isStale()) setLoadingReviews(false);
      }
    };

    await Promise.all([loadSignalsAndMenu(), loadCommunityReviews()]);
  };

  const clearRestaurantData = () => {
    setReviews([]);
    setKetoItems([]);
    setAiSuggestions([]);
    setLocalMenuData(null);
    setChainMenuData(null);
  };

  return {
    restaurantSignals, loadingSignals,
    foundKetoFoods, foundCustomizations, foundCookingMethods,
    chainMenuData, loadingChainMenu,
    localMenuData, loadingLocalMenu,
    reviews, ketoItems, loadingReviews,
    aiSuggestions, loadingAiSuggestions,
    loadReviews, clearRestaurantData
  };
}

import { useState, useMemo, useCallback } from 'react';

const toId = (name) => name.toLowerCase().trim().replace(/\s+/g, '-');

export default function useMealBuilder() {
  const [mealItems, setMealItems] = useState([]);

  const addItem = useCallback((rawItem, estimated = false) => {
    const id = toId(rawItem.name);
    setMealItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id,
          name: rawItem.name,
          calories: Number(rawItem.calories) || 0,
          carbs: Number(rawItem.carbs) || 0,
          protein: Number(rawItem.protein) || 0,
          fat: Number(rawItem.fat) || 0,
          quantity: 1,
          isEstimated: estimated,
        },
      ];
    });
  }, []);

  const incrementItem = useCallback((id) => {
    setMealItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decrementItem = useCallback((id) => {
    setMealItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const deleteItem = useCallback((id) => {
    setMealItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearMeal = useCallback(() => setMealItems([]), []);

  const isInMeal = useCallback(
    (name) => mealItems.some((i) => i.id === toId(name)),
    [mealItems]
  );

  const getQuantity = useCallback(
    (name) => {
      const item = mealItems.find((i) => i.id === toId(name));
      return item ? item.quantity : 0;
    },
    [mealItems]
  );

  const totals = useMemo(() => {
    return mealItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories * item.quantity,
        carbs: acc.carbs + item.carbs * item.quantity,
        protein: acc.protein + item.protein * item.quantity,
        fat: acc.fat + item.fat * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0, itemCount: 0 }
    );
  }, [mealItems]);

  const isEstimated = useMemo(
    () => mealItems.some((i) => i.isEstimated),
    [mealItems]
  );

  return {
    mealItems,
    totals,
    isEstimated,
    addItem,
    incrementItem,
    decrementItem,
    deleteItem,
    clearMeal,
    isInMeal,
    getQuantity,
  };
}

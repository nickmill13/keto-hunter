import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Minus, Trash2 } from 'lucide-react';

const MealBuilderFooter = ({ meal }) => {
  const [expanded, setExpanded] = useState(false);
  const { mealItems, totals, isEstimated, incrementItem, decrementItem, deleteItem, clearMeal } = meal;

  if (totals.itemCount === 0) return null;

  const p = isEstimated ? '~' : '';
  const carbColor = totals.carbs < 20 ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div className="border-t border-gray-200 bg-white pb-safe">
      {/* Expanded item list */}
      {expanded && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-800">Your Meal</span>
            <button
              onClick={clearMeal}
              className="text-xs font-semibold text-red-500 hover:text-red-700 active:scale-95 transition"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
            {mealItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {p}{item.carbs * item.quantity}g carbs &middot; {p}{item.calories * item.quantity} cal
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => decrementItem(item.id)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center active:scale-90 transition"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => incrementItem(item.id)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center active:scale-90 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center active:scale-90 transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded totals row */}
          <div className="flex items-center justify-center gap-3 text-xs font-semibold text-gray-600 py-2 mt-1 border-t border-gray-100">
            <span>{p}{Math.round(totals.carbs)}g carbs</span>
            <span className="text-gray-300">|</span>
            <span>{p}{Math.round(totals.protein)}g protein</span>
            <span className="text-gray-300">|</span>
            <span>{p}{Math.round(totals.fat)}g fat</span>
            <span className="text-gray-300">|</span>
            <span>{p}{Math.round(totals.calories)} cal</span>
          </div>
        </div>
      )}

      {/* Collapsed bar (always visible) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className={`${carbColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center`}>
            {totals.itemCount}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {p}{Math.round(totals.carbs)}g carbs
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            {p}{Math.round(totals.calories)} cal
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default MealBuilderFooter;

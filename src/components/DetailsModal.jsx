import React from 'react';
import {
  Star, MapPin, Navigation, X, Loader, Award, Sparkles, Flame, Pencil,
  CheckCircle, Lightbulb, FileText, MessageSquare, User, Plus, Minus
} from 'lucide-react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { getPriceSymbol, confidenceLabel } from '../utils';
import useMealBuilder from '../hooks/useMealBuilder';
import MealBuilderFooter from './MealBuilderFooter';

const DetailsModal = ({
  selectedRestaurant,
  restaurantSignals, loadingSignals,
  foundKetoFoods, foundCustomizations,
  chainMenuData, loadingChainMenu,
  localMenuData, loadingLocalMenu,
  ketoItems, aiSuggestions, loadingAiSuggestions,
  reviews, loadingReviews,
  isSignedIn, user,
  onClose, onAddReview, onEditReview, onDeleteReview
}) => {
  const meal = useMealBuilder();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-orange-200">
        <div className="flex-1 overflow-y-auto min-h-0">
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <h3 className="text-lg sm:text-2xl font-black text-gray-800 truncate pr-2">
            {selectedRestaurant.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 pb-8">
          {/* Mobile: compact quick-info bar */}
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
          <p className="text-gray-500 text-xs sm:hidden truncate mb-4">{selectedRestaurant.address}</p>

          <div className="mb-4 space-y-1.5">
            <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Address:</strong> {selectedRestaurant.address}</p>
            <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Distance:</strong> {selectedRestaurant.distance} miles</p>
            <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Cuisine:</strong> {selectedRestaurant.cuisine}</p>
            <p className="text-gray-600 text-sm sm:text-base hidden sm:block"><strong>Price:</strong> {getPriceSymbol(selectedRestaurant.priceLevel)}</p>
            <p
              className="text-gray-400 text-xs hidden sm:block cursor-pointer hover:text-gray-600 transition"
              title="Click to copy Place ID"
              onClick={() => {
                navigator.clipboard.writeText(selectedRestaurant.id);
                alert('Place ID copied: ' + selectedRestaurant.id);
              }}
            >
              Place ID: {selectedRestaurant.id}
            </p>

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

          {/* Verified Chain Menu */}
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

                      <div className="mt-2 pt-2 border-t border-emerald-100">
                        {meal.isInMeal(item.name) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => meal.decrementItem(item.name.toLowerCase().trim().replace(/\s+/g, '-'))}
                              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center active:scale-90 transition"
                            >
                              <Minus className="w-4 h-4 text-emerald-700" />
                            </button>
                            <span className="text-sm font-bold text-emerald-700 w-6 text-center">
                              {meal.getQuantity(item.name)}
                            </span>
                            <button
                              onClick={() => meal.incrementItem(item.name.toLowerCase().trim().replace(/\s+/g, '-'))}
                              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center active:scale-90 transition"
                            >
                              <Plus className="w-4 h-4 text-emerald-700" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => meal.addItem(item, false)}
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add to Meal
                          </button>
                        )}
                      </div>
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

          {/* AI-Estimated Menu for Local Restaurants */}
          {loadingLocalMenu && !chainMenuData && (
            <div className="mb-6 text-center py-4">
              <Loader className="w-6 h-6 animate-spin mx-auto text-purple-500" />
              <p className="text-gray-400 text-xs mt-1">Analyzing menu...</p>
            </div>
          )}
          {localMenuData && localMenuData.items.length > 0 && !chainMenuData && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-300">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-purple-800">
                      AI-Estimated Keto Menu
                    </h4>
                    <p className="text-xs text-purple-500">
                      Estimates based on typical {localMenuData.cuisine || 'restaurant'} dishes
                    </p>
                  </div>
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    AI-Estimated
                  </span>
                </div>

                {localMenuData.ketoFriendliness && (
                  <p className="text-xs text-purple-700 italic mb-3 bg-white/50 p-2 rounded border border-purple-200">
                    <Lightbulb className="inline w-4 h-4" /> {localMenuData.ketoFriendliness}
                  </p>
                )}

                <div className="space-y-2">
                  {localMenuData.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-purple-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          item.carbs < 10
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          ~{item.carbs}g carbs
                        </span>
                      </div>

                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>~{item.calories} cal</span>
                        <span>~{item.protein}g protein</span>
                        <span><Flame className="inline w-3 h-3 text-orange-600" /> ~{item.fat}g fat</span>
                      </div>
                      {item.modification && (
                        <p className="text-xs text-purple-600 mt-1.5 font-medium">
                          <FileText className="inline w-4 h-4" /> Modify: "{item.modification}"
                        </p>
                      )}

                      <div className="mt-2 pt-2 border-t border-purple-100">
                        {meal.isInMeal(item.name) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => meal.decrementItem(item.name.toLowerCase().trim().replace(/\s+/g, '-'))}
                              className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center active:scale-90 transition"
                            >
                              <Minus className="w-4 h-4 text-purple-700" />
                            </button>
                            <span className="text-sm font-bold text-purple-700 w-6 text-center">
                              {meal.getQuantity(item.name)}
                            </span>
                            <button
                              onClick={() => meal.incrementItem(item.name.toLowerCase().trim().replace(/\s+/g, '-'))}
                              className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center active:scale-90 transition"
                            >
                              <Plus className="w-4 h-4 text-purple-700" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => meal.addItem(item, true)}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add to Meal
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {localMenuData.orderTips && localMenuData.orderTips.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs font-bold text-purple-700 mb-1.5"><Lightbulb className="inline w-4 h-4" /> Ordering Tips:</p>
                    {localMenuData.orderTips.map((tip, i) => (
                      <p key={i} className="text-xs text-gray-600 mb-1">  {tip}</p>
                    ))}
                  </div>
                )}

                <p className="text-xs text-purple-400 mt-3 italic text-center">
                  Nutrition values are AI estimates — actual values may vary
                </p>
              </div>
            </div>
          )}

          {/* Community Keto Picks */}
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

          {/* Reviews Section */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h4 className="text-lg sm:text-xl font-bold text-gray-800">
                Keto Reviews ({reviews.length})
              </h4>

              <SignedIn>
                <button
                  onClick={onAddReview}
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

                    {isSignedIn && user && review.user_id === user.id && (
                      <div className="flex gap-2 pt-3 border-t border-gray-300">
                        <button
                          onClick={() => onEditReview(review)}
                          className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteReview(review)}
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
        <MealBuilderFooter meal={meal} />
      </div>
    </div>
  );
};

export default DetailsModal;

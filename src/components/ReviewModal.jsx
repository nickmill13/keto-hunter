import React from 'react';
import { Star, Flame, Pencil, Send, X } from 'lucide-react';

const ReviewModal = ({ selectedRestaurant, user, reviewForm, setReviewForm, submitReview, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-orange-200">
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <span><Pencil className="inline w-5 h-5" /></span> Add Keto Review
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 active:scale-90 transition p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 pb-8">
          <p className="text-gray-600 mb-4 font-semibold">{selectedRestaurant?.name}</p>

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
  );
};

export default ReviewModal;

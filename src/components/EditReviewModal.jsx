import React from 'react';
import { Star, Flame, Pencil, Send, X, UtensilsCrossed } from 'lucide-react';

const EditReviewModal = ({ selectedRestaurant, editingReviewForm, setEditingReviewForm, submitEditedReview, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-2 sm:border-2 border-blue-200">
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" /> Edit Keto Review
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
  );
};

export default EditReviewModal;

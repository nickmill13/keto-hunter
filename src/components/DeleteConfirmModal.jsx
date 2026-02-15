import React from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

const DeleteConfirmModal = ({ selectedRestaurant, deletingReviewId, onCancel, onConfirm }) => {
  return (
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
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
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
  );
};

export default DeleteConfirmModal;

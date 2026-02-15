import { useState } from 'react';
import { BASE_URL } from '../api/client';

export default function useReviews({ isSignedIn, user, getToken, selectedRestaurant, loadReviews, setShowDetailsModal }) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    ketoRating: 5,
    comment: '',
    menuItems: ''
  });

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

  const submitReview = async () => {
    if (!isSignedIn) {
      alert('Please sign in to submit a review');
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a review');
      return;
    }

    const token = await getToken();

    const userName = user?.firstName
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : user?.username || 'Anonymous';

    try {
      const response = await fetch(`${BASE_URL}/api/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        setReviewForm({ rating: 5, ketoRating: 5, comment: '', menuItems: '' });
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

  const handleDeleteReview = (review) => {
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
        headers: { 'Authorization': `Bearer ${token}` }
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

  return {
    showReviewModal, setShowReviewModal,
    reviewForm, setReviewForm,
    showEditReviewModal, setShowEditReviewModal,
    editingReview, editingReviewForm, setEditingReviewForm,
    showDeleteConfirm, reviewToDelete, deletingReviewId,
    submitReview,
    handleEditReview, submitEditedReview,
    handleDeleteReview, confirmDeleteReview,
    cancelDelete: () => {
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    }
  };
}

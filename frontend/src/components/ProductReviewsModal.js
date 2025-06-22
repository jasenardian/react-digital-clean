import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaTimes, FaUser, FaCalendarAlt, FaQuoteLeft } from 'react-icons/fa';
import axios from 'axios';

const ProductReviewsModal = ({ isOpen, onClose, productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching reviews for product ID:', productId);
      const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}`);
      console.log('Reviews response:', response.data);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchReviews();
    }
  }, [isOpen, productId, fetchReviews]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    if (rating >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRatingBg = (rating) => {
    if (rating >= 4) return 'bg-green-100';
    if (rating >= 3) return 'bg-yellow-100';
    if (rating >= 2) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header dengan Gradient - Lebih Kompak */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">💬 Ulasan Produk</h3>
              <p className="text-blue-100 text-sm sm:text-base truncate">{productName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors p-1 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full ml-2 flex-shrink-0"
            >
              <FaTimes size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content - Lebih Kompak */}
        <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[65vh] bg-gray-50">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mb-3 sm:mb-4"></div>
              <div className="text-gray-600 text-sm sm:text-lg">Memuat ulasan...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
              <p className="text-gray-600 text-base sm:text-lg mb-2">Belum ada ulasan untuk produk ini</p>
              <p className="text-gray-500 text-sm sm:text-base">Jadilah yang pertama memberikan ulasan!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Summary Stats - Lebih Kompak */}
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg sm:text-2xl">⭐</span>
                    <span className="text-sm sm:text-lg font-semibold text-gray-700">
                      {reviews.length} Ulasan
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-500">
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Rating Rata-rata</div>
                  </div>
                </div>
              </div>

              {/* Reviews List - Lebih Kompak */}
              {reviews.map((review, index) => (
                <div key={review.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  {/* Review Header - Responsif */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg flex-shrink-0">
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg flex items-center truncate">
                          <FaUser className="mr-1 sm:mr-2 text-gray-500 flex-shrink-0" size={12} />
                          <span className="truncate">{review.username}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                          <FaCalendarAlt className="mr-1 sm:mr-2 flex-shrink-0" size={10} />
                          <span className="truncate">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating Badge - Responsif */}
                    <div className={`px-2 sm:px-3 py-1 rounded-full ${getRatingBg(review.rating)} flex items-center space-x-1 flex-shrink-0`}>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`ml-1 text-xs sm:text-sm font-semibold ${getRatingColor(review.rating)}`}>
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Review Text - Responsif */}
                  {review.review_text && (
                    <div className="relative">
                      <FaQuoteLeft className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2 text-gray-300 text-lg sm:text-2xl" />
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 ml-2 sm:ml-4">
                        <p className="text-gray-700 leading-relaxed italic text-sm sm:text-base break-words">
                          "{review.review_text}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Lebih Kompak */}
        <div className="bg-white border-t border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
              {reviews.length > 0 && `Menampilkan ${reviews.length} ulasan`}
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base order-1 sm:order-2"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsModal;
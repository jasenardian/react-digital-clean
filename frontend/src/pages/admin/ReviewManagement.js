import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FaStar, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaTrash,
  FaUser,
  FaCalendarAlt,
  FaBox
} from 'react-icons/fa';
import './ReviewManagement.css';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    average_rating: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams(filters).toString();
      
      const response = await axios.get(
        `http://localhost:5000/api/admin/reviews?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReviews(response.data.reviews);
      setPagination({
        total: response.data.total,
        totalPages: response.data.totalPages,
        currentPage: response.data.page
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        'http://localhost:5000/api/admin/reviews/stats',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateReviewStatus = async (reviewId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/reviews/${reviewId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchReviews();
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:5000/api/admin/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchReviews();
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: 'status-approved', text: 'Disetujui' },
      pending: { class: 'status-pending', text: 'Menunggu' },
      rejected: { class: 'status-rejected', text: 'Ditolak' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const renderStars = (rating) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={star <= rating ? 'star-filled' : 'star-empty'}
          />
        ))}
        <span className="rating-number">({rating})</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="review-management">
      {/* Header */}
      <div className="page-header">
        <h1>🌟 Manajemen Ulasan Produk</h1>
        <p>Kelola dan moderasi ulasan produk dari pengguna</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-content">
            <h3>{stats.total_reviews || 0}</h3>
            <p>Total Ulasan</p>
          </div>
        </div>
        
        <div className="stat-card approved">
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-content">
            <h3>{stats.approved_reviews || 0}</h3>
            <p>Disetujui</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <FaFilter />
          </div>
          <div className="stat-content">
            <h3>{stats.pending_reviews || 0}</h3>
            <p>Menunggu</p>
          </div>
        </div>
        
        <div className="stat-card rating">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-content">
            <h3>{stats.average_rating && typeof stats.average_rating === 'number' ? stats.average_rating.toFixed(1) : '0.0'}</h3>
            <p>Rating Rata-rata</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Cari ulasan, produk, atau pengguna..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="status-filter"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="reviews-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat ulasan...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <FaStar className="empty-icon" />
            <h3>Tidak ada ulasan ditemukan</h3>
            <p>Belum ada ulasan yang sesuai dengan filter Anda</p>
          </div>
        ) : (
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Pengguna</th>
                <th>Rating</th>
                <th>Ulasan</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="product-info">
                      <img 
                        src={review.product_image || '/placeholder-product.jpg'} 
                        alt={review.product_name}
                        className="product-image"
                      />
                      <span className="product-name">{review.product_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <FaUser className="user-icon" />
                      <span>{review.username}</span>
                    </div>
                  </td>
                  <td>{renderStars(review.rating)}</td>
                  <td>
                    <div className="review-text">
                      {review.review_text ? (
                        review.review_text.length > 100 ? 
                          `${review.review_text.substring(0, 100)}...` : 
                          review.review_text
                      ) : (
                        <em className="no-text">Tidak ada teks ulasan</em>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(review.status)}</td>
                  <td>
                    <div className="date-info">
                      <FaCalendarAlt className="date-icon" />
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowModal(true);
                        }}
                        title="Lihat Detail"
                      >
                        <FaEye />
                      </button>
                      
                      {review.status !== 'approved' && (
                        <button
                          className="btn-approve"
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          title="Setujui"
                        >
                          <FaCheck />
                        </button>
                      )}
                      
                      {review.status !== 'rejected' && (
                        <button
                          className="btn-reject"
                          onClick={() => updateReviewStatus(review.id, 'rejected')}
                          title="Tolak"
                        >
                          <FaTimes />
                        </button>
                      )}
                      
                      <button
                        className="btn-delete"
                        onClick={() => deleteReview(review.id)}
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Ulasan</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="review-detail">
                <div className="product-section">
                  <img 
                    src={selectedReview.product_image || '/placeholder-product.jpg'} 
                    alt={selectedReview.product_name}
                    className="product-image-large"
                  />
                  <div className="product-details">
                    <h4>{selectedReview.product_name}</h4>
                    <p>ID Produk: {selectedReview.product_id}</p>
                  </div>
                </div>
                
                <div className="user-section">
                  <h5>Informasi Pengguna</h5>
                  <p><FaUser /> {selectedReview.username}</p>
                  <p><FaCalendarAlt /> {formatDate(selectedReview.created_at)}</p>
                </div>
                
                <div className="rating-section">
                  <h5>Rating</h5>
                  {renderStars(selectedReview.rating)}
                </div>
                
                <div className="review-section">
                  <h5>Ulasan</h5>
                  <div className="review-text-full">
                    {selectedReview.review_text || <em>Tidak ada teks ulasan</em>}
                  </div>
                </div>
                
                <div className="status-section">
                  <h5>Status</h5>
                  {getStatusBadge(selectedReview.status)}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="modal-actions">
                {selectedReview.status !== 'approved' && (
                  <button
                    className="btn btn-approve"
                    onClick={() => updateReviewStatus(selectedReview.id, 'approved')}
                  >
                    <FaCheck /> Setujui
                  </button>
                )}
                
                {selectedReview.status !== 'rejected' && (
                  <button
                    className="btn btn-reject"
                    onClick={() => updateReviewStatus(selectedReview.id, 'rejected')}
                  >
                    <FaTimes /> Tolak
                  </button>
                )}
                
                <button
                  className="btn btn-delete"
                  onClick={() => deleteReview(selectedReview.id)}
                >
                  <FaTrash /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
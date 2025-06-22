import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';

const MyReviews = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchReviewableProducts();
  }, []);

  const fetchReviewableProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/reviews/user/reviewable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (product) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Produk yang Dapat Diulas</h1>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Belum ada produk yang dapat diulas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.transaction_id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={product.image_url || '/placeholder-product.jpg'} 
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    Dibeli pada {new Date(product.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              
              <div>
                {product.has_review ? (
                  <span className="text-green-600 font-medium">✓ Sudah diulas</span>
                ) : (
                  <button
                    onClick={() => handleReviewClick(product)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Beri Ulasan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedProduct && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          product={selectedProduct}
          transactionId={selectedProduct.transaction_id}
          onReviewAdded={fetchReviewableProducts}
        />
      )}
    </div>
  );
};

export default MyReviews;
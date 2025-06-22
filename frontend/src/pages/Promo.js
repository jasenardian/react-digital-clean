import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGift, FaGamepad, FaCreditCard, FaFire, FaClock, FaTag } from 'react-icons/fa';
import '../styles/Promo.css';

const Promo = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/promotions');
        setPromotions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        setLoading(false);
      }
    };
    
    fetchPromotions();
  }, []);
  
  const getPromoIcon = (type) => {
    switch(type) {
      case 'game': return <FaGamepad />;
      case 'topup': return <FaCreditCard />;
      case 'cashback': return <FaGift />;
      case 'flash': return <FaFire />;
      default: return <FaTag />;
    }
  };
  
  const getPromoColor = (index) => {
    const colors = ['red', 'blue', 'green', 'purple'];
    return colors[index % colors.length];
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat promo...</p>
      </div>
    );
  }
  
  return (
    <div className="promo-container">
      {/* Header Section */}
      <div className="promo-header">
        <h1>Promo Spesial</h1>
        <p>Jangan lewatkan penawaran menarik dari kami! Hemat lebih banyak dengan promo eksklusif.</p>
      </div>
      
      {/* Dynamic Promotions from Database */}
      {promotions.length > 0 && (
        <div className="promo-cards">
          {promotions.map((promo, index) => (
            <div key={promo.id} className={`promo-card ${getPromoColor(index)}`}>
              <div className="promo-icon">
                {getPromoIcon(promo.type)}
              </div>
              <h2>{promo.title}</h2>
              <p>{promo.description}</p>
              
              <div className="promo-details">
                <div className="promo-discount">
                  <FaTag className="discount-icon" />
                  <span>Diskon {promo.discount_percentage}%</span>
                </div>
                
                {promo.min_purchase && (
                  <div className="promo-min-purchase">
                    <span>Min. pembelian: Rp {promo.min_purchase.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <div className="promo-validity">
                  <FaClock className="clock-icon" />
                  <span>
                    Berlaku: {new Date(promo.start_date).toLocaleDateString('id-ID')} - {new Date(promo.end_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
              
              <div className="promo-footer">
                <button className="promo-btn">Gunakan Promo</button>
              </div>
            </div>
          ))}
        </div>
      )}
       
      {/* Call to Action */}
      <div className="promo-cta">
        <h3>Masih ada pertanyaan?</h3>
        <p>Hubungi customer service kami untuk informasi lebih lanjut tentang promo yang tersedia.</p>
        <button className="cta-btn">Hubungi CS</button>
      </div>
    </div>
  );
};

export default Promo;
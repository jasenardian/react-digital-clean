import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/PaymentSimulation.css';

const PaymentSimulation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const merchantRef = queryParams.get('ref');
  const amount = queryParams.get('amount');
  
  const handlePayment = async (status) => {
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/topup/simulate-payment', {
        merchant_ref: merchantRef,
        status
      });
      
      // Redirect to profile page
      navigate('/profile');
    } catch (error) {
      console.error('Error simulating payment:', error);
      setError('Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };
  
  if (!merchantRef || !amount) {
    return (
      <div className="payment-simulation">
        <div className="payment-container error">
          <h2>Error</h2>
          <p>Parameter tidak valid</p>
          <button onClick={() => navigate('/profile')} className="back-button">
            Kembali ke Profil
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-simulation">
      <div className="payment-container">
        <h2>Simulasi Pembayaran Tripay</h2>
        <div className="payment-details">
          <div className="payment-item">
            <span className="payment-label">Referensi:</span>
            <span className="payment-value">{merchantRef}</span>
          </div>
          <div className="payment-item">
            <span className="payment-label">Jumlah:</span>
            <span className="payment-value">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div className="payment-methods">
          <h3>Pilih Metode Pembayaran:</h3>
          <div className="method-list">
            <div className="method-item">
              <input type="radio" id="bca" name="payment" value="bca" defaultChecked />
              <label htmlFor="bca">Bank BCA</label>
            </div>
            <div className="method-item">
              <input type="radio" id="bni" name="payment" value="bni" />
              <label htmlFor="bni">Bank BNI</label>
            </div>
            <div className="method-item">
              <input type="radio" id="mandiri" name="payment" value="mandiri" />
              <label htmlFor="mandiri">Bank Mandiri</label>
            </div>
            <div className="method-item">
              <input type="radio" id="gopay" name="payment" value="gopay" />
              <label htmlFor="gopay">GoPay</label>
            </div>
            <div className="method-item">
              <input type="radio" id="ovo" name="payment" value="ovo" />
              <label htmlFor="ovo">OVO</label>
            </div>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="payment-actions">
          <button 
            onClick={() => handlePayment('success')} 
            className="pay-button"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
          <button 
            onClick={() => handlePayment('failed')} 
            className="cancel-button"
            disabled={loading}
          >
            Batalkan
          </button>
        </div>
        
        <div className="payment-note">
          <p><strong>Catatan:</strong> Ini adalah halaman simulasi pembayaran untuk keperluan pengembangan. Pada implementasi nyata, pengguna akan diarahkan ke halaman pembayaran Tripay.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulation;
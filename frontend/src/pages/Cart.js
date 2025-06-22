import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaShoppingCart } from 'react-icons/fa';
import '../styles/Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [userSaldo, setUserSaldo] = useState(0);
  const navigate = useNavigate();
  const [totalHarga, setTotalHarga] = useState(0);
  const [sisaSaldo, setSisaSaldo] = useState(0);

  useEffect(() => {
    loadCartItems();
    fetchUserSaldo();
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    setTotalHarga(total);
    setSisaSaldo(userSaldo - total);
  }, [cartItems, userSaldo]);

  // Add the updateQuantity function
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const loadCartItems = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Gabungkan produk yang sama (berdasarkan id dan userInput)
    const mergedCart = savedCart.reduce((acc, item) => {
      const existingIndex = acc.findIndex(existing => 
        existing.id === item.id && existing.userInput === item.userInput
      );
      
      if (existingIndex >= 0) {
        // Jika produk sudah ada, tambahkan quantity
        acc[existingIndex].quantity = (acc[existingIndex].quantity || 1) + (item.quantity || 1);
        acc[existingIndex].total = acc[existingIndex].price * acc[existingIndex].quantity;
      } else {
        // Jika produk belum ada, tambahkan ke cart
        acc.push({
          ...item,
          quantity: item.quantity || 1,
          total: item.price * (item.quantity || 1)
        });
      }
      
      return acc;
    }, []);
    
    setCartItems(mergedCart);
    // Update localStorage dengan cart yang sudah digabung
    localStorage.setItem('cart', JSON.stringify(mergedCart));
  };

  const fetchUserSaldo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSaldo(data.balance || 0);
      } else {
        console.error('Failed to fetch user data');
        setUserSaldo(0);
      }
    } catch (error) {
      console.error('Error fetching saldo:', error);
      setUserSaldo(0);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }
  
      // Create transactions for each cart item
      for (const item of cartItems) {
        const transactionData = {
          product_id: item.id,
          quantity: item.quantity || 1,
          notes: item.notes || item.userInput || '' // Use notes if available, fallback to userInput
        };
  
        const response = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData)
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal membuat transaksi');
        }
      }
  
      // Clear cart and update UI
      clearCart();
      await fetchUserSaldo();
      alert('Checkout berhasil! Transaksi Anda sedang diproses.');
      
      // Navigate to transaction history
      navigate('/profile');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(`Terjadi kesalahan saat checkout: ${error.message}`);
    }
  };

  const handleTopUpSaldo = () => {
    navigate('/payment-simulation');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <FaArrowLeft /> Kembali
          </button>
          <h1>Keranjang Belanja</h1>
          <button className="btn-clear-cart" onClick={clearCart}>
            Kosongkan Keranjang
          </button>
        </div>

        <div className="empty-cart">
          <div className="empty-cart-icon">
            <FaShoppingCart />
          </div>
          <h2>Keranjang Belanja Kosong</h2>
          <p>Belum ada item di keranjang Anda</p>
          <button onClick={() => navigate('/katalog')} className="btn-shop-now">
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  // Add function to update notes
  const updateNotes = (itemId, userInput, newNotes) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId && item.userInput === userInput) {
        return {
          ...item,
          notes: newNotes
        };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <FaArrowLeft /> Kembali
        </button>
        <h1>Keranjang Belanja</h1>
        <button className="btn-clear-cart" onClick={clearCart}>
          Kosongkan Keranjang
        </button>
      </div>

      <div className="cart-content">
        {/* Cart Items */}
        <div className="cart-items">
          <h2>Review item di keranjang Anda.</h2>
          {cartItems.map((item) => (
            <div key={`${item.id}-${item.userInput}`} className="cart-item">
              <div className="item-info">
                <h3>{item.name}</h3>
                <p className="item-category">{item.category || 'Social Media → Instagram → Followers Instagram'}</p>
                <p className="item-price">{formatPrice(item.price)}</p>
                <p className="item-input">Tujuan (Link/Email/ID): {item.userInput}</p>
                
                {/* Add Notes Input Field */}
                <div className="notes-section">
                  <label htmlFor={`notes-${item.id}-${item.userInput}`}>Catatan:</label>
                  <textarea
                    id={`notes-${item.id}-${item.userInput}`}
                    className="notes-input"
                    placeholder="Tambahkan catatan untuk pesanan ini..."
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.id, item.userInput, e.target.value)}
                    rows={2}
                  />
                </div>
                
                {/* Quantity control */}
                <div className="quantity-control">
                  <button 
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    className="btn-quantity"
                    disabled={(item.quantity || 1) <= 1}
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity || 1}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    className="btn-quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                className="btn-remove-item" 
                onClick={() => removeFromCart(item.id, item.userInput)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Ringkasan Belanja</h3>
          <div className="summary-row">
            <span>Total Harga:</span>
            <span>{formatPrice(totalHarga)}</span>
          </div>
          <div className="summary-row">
            <span>Saldo Anda:</span>
            <span className={userSaldo >= 0 ? 'positive' : 'negative'}>{formatPrice(userSaldo)}</span>
          </div>
          <div className="summary-row total">
            <span>Sisa Saldo Setelah Checkout:</span>
            <span className={sisaSaldo >= 0 ? 'positive' : 'negative'}>
              {formatPrice(sisaSaldo)} {sisaSaldo < 0 ? '(Kurang)' : ''}
            </span>
          </div>

          {sisaSaldo < 0 && (
            <div className="insufficient-balance">
              <p>Saldo tidak cukup. Silakan top up atau hapus beberapa item.</p>
              <button onClick={handleTopUpSaldo} className="btn-topup">
                Top Up Saldo
              </button>
            </div>
          )}

          <button 
            onClick={handleCheckout}
            className="btn-checkout"
            disabled={sisaSaldo < 0}
          >
            Checkout ({cartItems.length} Item)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
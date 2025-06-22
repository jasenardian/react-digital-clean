import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShoppingCart, FaPlus, FaMinus, FaWhatsapp } from 'react-icons/fa';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [saldoSetelahPembelian, setSaldoSetelahPembelian] = useState(0);

  useEffect(() => {
    fetchProductDetail();
    fetchUserSaldo();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSaldoSetelahPembelian(saldo - (product.price * quantity));
    }
  }, [saldo, product, quantity]);

  // Ambil data produk dari database
  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Produk tidak ditemukan');
      }
      
      const productData = await response.json();
      setProduct(productData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  // Ambil saldo user real dari database
  const fetchUserSaldo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaldo(0);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setSaldo(userData.balance || 0);
      } else {
        setSaldo(0);
      }
    } catch (error) {
      console.error('Error fetching saldo:', error);
      setSaldo(0);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const handleQuantityChange = (type) => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!userInput.trim()) {
      alert('Silakan masukkan data yang diperlukan');
      return;
    }
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      userInput: userInput,
      total: product.price * quantity
    };
    
    // Simpan ke localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
      existingCart[existingItemIndex].total = existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
    } else {
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    navigate('/cart');
  };

  // Checkout langsung ke database
  const handleDirectCheckout = async () => {
    if (!userInput.trim()) {
      alert('Silakan masukkan data yang diperlukan');
      return;
    }

    if (saldoSetelahPembelian < 0) {
      alert('Saldo tidak mencukupi. Silakan top up terlebih dahulu.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    try {
      // Siapkan data transaksi
      const transactionData = {
        product_id: product.id,
        quantity: quantity,
        notes: userInput // Tambahkan notes dari user input
      };

      // Buat transaksi langsung ke backend
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal membuat transaksi');
      }
      
      // Perbarui saldo setelah transaksi
      await fetchUserSaldo();
      
      // Tampilkan pesan sukses
      alert('Pembelian berhasil! Transaksi telah dibuat dengan status pending. Menunggu konfirmasi admin.');
      
      // Reset form
      setUserInput('');
      setQuantity(1);
      
      // Arahkan ke halaman profile untuk melihat riwayat
      navigate('/profile');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(`Terjadi kesalahan saat checkout: ${error.message}`);
    }
  };

      const handleTopUpSaldo = () => {
        navigate('/payment-simulation');
      };

      if (loading) {
        return (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Memuat detail produk...</p>
          </div>
        );
      }

      if (!product) {
        return (
          <div className="error-container">
            <h2>Produk tidak ditemukan</h2>
            <button onClick={() => navigate('/katalog')} className="btn-back">
              Kembali ke Katalog
            </button>
          </div>
        );
      }

      return (
        <div className="product-detail-container">
          {/* Header */}
          <div className="product-detail-header">
            <button onClick={() => navigate(-1)} className="btn-back">
              <FaArrowLeft /> Kembali
            </button>
            <h1>Detail Produk</h1>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>{product.category}</span>
          </div>

          {/* Product Info */}
          <div className="product-info-card">
            <div className="product-image">
              <img src={product.image || '/api/placeholder/400/300'} alt={product.name} />
            </div>
            <div className="product-details">
              <h2 className="product-title">{product.name}</h2>
              <p className="product-description">{product.description}</p>
              <div className="product-price">
                <span className="price">{formatPrice(product.price)}</span>
              </div>
              <div className="product-stock">
                <span>Stok: {product.stock || 'Tersedia'}</span>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="order-form-card">
            <h3>Tujuan Pemesanan (Link/Email/ID)</h3>
            <input
              type="text"
              placeholder="Masukkan link profil, email, atau ID target"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="input-field"
            />
            <small className="input-example">Contoh: https://instagram.com/username atau email@domain.com</small>
          </div>

          {/* Quantity Selector */}
          <div className="quantity-selector">
            <h3>Jumlah</h3>
            <div className="quantity-controls">
              <button 
                onClick={() => handleQuantityChange('decrease')}
                disabled={quantity <= 1}
                className="quantity-btn"
              >
                <FaMinus />
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange('increase')}
                className="quantity-btn"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>Ringkasan Pesanan</h3>
            <div className="summary-row">
              <span>Produk:</span>
              <span>{product.name}</span>
            </div>
            <div className="summary-row">
              <span>Harga Satuan:</span>
              <span>{formatPrice(product.price)}</span>
            </div>
            <div className="summary-row">
              <span>Jumlah:</span>
              <span>{quantity}</span>
            </div>
            <div className="summary-row">
              <span>Total Harga:</span>
              <span>{formatPrice(product.price * quantity)}</span>
            </div>
            <div className="summary-row">
              <span>Saldo Anda:</span>
              <span className={saldo >= 0 ? 'positive' : 'negative'}>{formatPrice(saldo)}</span>
            </div>
            <div className="summary-row total">
              <span>Saldo Setelah Pembelian:</span>
              <span className={saldoSetelahPembelian >= 0 ? 'positive' : 'negative'}>
                {formatPrice(saldoSetelahPembelian)}
              </span>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {saldoSetelahPembelian < 0 && (
            <div className="insufficient-balance-warning">
              <p>Saldo Anda tidak mencukupi. Silakan top up saldo terlebih dahulu.</p>
              <button onClick={handleTopUpSaldo} className="btn-topup">
                Top Up Saldo
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              onClick={handleAddToCart}
              className="btn-add-to-cart"
            >
              <FaShoppingCart /> Tambah ke Keranjang
            </button>
            <button 
              onClick={handleDirectCheckout}
              className="btn-direct-checkout"
              disabled={saldoSetelahPembelian < 0 || !userInput.trim()}
            >
              🛒 Beli Sekarang
            </button>
          </div>
        </div>
      );
    };

    export default ProductDetail;
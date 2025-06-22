import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaBars, FaTimes, FaHome, FaTags, FaInfoCircle, FaWallet, FaPhone, FaStar, FaSearch } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // State untuk search
  const [isSearchOpen, setIsSearchOpen] = useState(false); // State untuk mobile search
  const [userData, setUserData] = useState({
    username: '',
    balance: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Fungsi untuk menghitung total item di cart
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartCount(totalItems);
    } catch (error) {
      console.error('Error reading cart:', error);
      setCartCount(0);
    }
  };

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            username: data.username || data.name || 'User',
            balance: data.balance || 0
          });
        } else {
          console.error('Failed to fetch user data');
          setUserData({
            username: 'tesdigital',
            balance: 0
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData({
          username: 'tesdigital',
          balance: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    updateCartCount(); // Update cart count saat komponen mount
  }, [token]);

  // Listen untuk perubahan localStorage cart
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    // Update cart count saat komponen mount
    updateCartCount();

    // Listen untuk storage events
    window.addEventListener('storage', handleStorageChange);

    // Polling untuk update cart count (fallback jika storage event tidak bekerja)
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserData({ username: '', balance: 0 });
    navigate('/login');
    setIsMenuOpen(false);
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Fungsi untuk handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/katalog?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsSearchOpen(false);
      setIsMenuOpen(false);
    }
  };
  
  // Fungsi untuk toggle search di mobile
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };
  
  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <span>Catalogue Digital</span>
          </Link>
          
          
          {/* Desktop Menu */}
          <ul className="nav-menu desktop-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/promo" className="nav-link">Promo</Link>
            </li>
            <li className="nav-item">
              <Link to="/katalog" className="nav-link">Katalog</Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className="nav-link">Kontak</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">About</Link>
            </li>
            {token && (
              <li className="nav-item">
                <Link to="/my-reviews" className="nav-link">Ulasan Saya</Link>
              </li>
            )}
          </ul>
          
          <div className="nav-icons">
            {/* Mobile Search Icon */}
            <button className="icon-button mobile-search-toggle" onClick={toggleSearch}>
              <FaSearch />
            </button>
            
            {token ? (
              <>
                {/* Desktop User Info */}
                <div className="desktop-user-info">
                  <div className="user-balance">
                    <FaWallet className="balance-icon" />
                    <span className="balance-text">
                      {loading ? 'Loading...' : formatCurrency(userData.balance)}
                    </span>
                  </div>
                  <div className="user-name">
                    <FaUser className="user-icon" />
                    <span className="username-text">
                      {loading ? 'Loading...' : (userData.username || 'User')}
                    </span>
                  </div>
                </div>
                
                <Link to="/profile" className="icon-button desktop-only">
                  <FaUser />
                </Link>
                <Link to="/cart" className="icon-button">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="cart-count">{cartCount}</span>
                  )}
                </Link>
                <button onClick={handleLogout} className="logout-button desktop-only">Logout</button>
              </>
            ) : (
              <Link to="/login" className="login-button-nav desktop-only">Login</Link>
            )}
            
            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={toggleMenu}>
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className={`mobile-search-bar ${isSearchOpen ? 'active' : ''}`}>
          <form onSubmit={handleSearch} className="mobile-search-form">
            <div className="mobile-search-input-container">
              <FaSearch className="mobile-search-icon" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-search-input"
                autoFocus={isSearchOpen}
              />
              <button type="submit" className="mobile-search-button">
                Cari
              </button>
              <button type="button" className="mobile-search-close" onClick={toggleSearch}>
                <FaTimes />
              </button>
            </div>
          </form>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <span className="mobile-logo">Catalogue Digital</span>
            <button className="close-menu" onClick={closeMenu}>
              <FaTimes />
            </button>
          </div>
          
          <ul className="mobile-nav-menu">
            <li className="mobile-nav-item">
              <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                <FaHome className="nav-icon" />
                <span>Home</span>
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/promo" className="mobile-nav-link" onClick={closeMenu}>
                <FaTags className="nav-icon" />
                <span>Promo</span>
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/katalog" className="mobile-nav-link" onClick={closeMenu}>
                <FaShoppingCart className="nav-icon" />
                <span>Katalog</span>
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/contact" className="mobile-nav-link" onClick={closeMenu}>
                <FaPhone className="nav-icon" /> {/* Tambahkan import FaPhone */}
                <span>Kontak</span>
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/about" className="mobile-nav-link" onClick={closeMenu}>
                <FaInfoCircle className="nav-icon" />
                <span>About</span>
              </Link>
            </li>
            
            {token ? (
              <>
                <li className="mobile-nav-item">
                  <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                    <FaUser className="nav-icon" />
                    <span>
                      {loading ? 'Loading...' : (userData.username || 'User')}
                    </span>
                  </Link>
                </li>
                <li className="mobile-nav-item">
                  <div className="mobile-nav-link balance">
                    <FaWallet className="nav-icon" />
                    <span>
                      {loading ? 'Loading...' : formatCurrency(userData.balance)}
                    </span>
                  </div>
                </li>
                <li className="mobile-nav-item">
                  <Link to="/my-reviews" className="mobile-nav-link" onClick={closeMenu}>
                    <FaStar className="nav-icon" />
                    <span>Ulasan Saya</span>
                  </Link>
                </li>
                <li className="mobile-nav-item">
                  <button className="mobile-nav-link logout" onClick={handleLogout}>
                    <span>Logout</span>
                  </button>
                </li>
              </>
            ) : (
              <li className="mobile-nav-item">
                <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                  <FaUser className="nav-icon" />
                  <span>Login</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;
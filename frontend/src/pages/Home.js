import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronDown, FaChevronUp, FaSearch, FaArrowRight, FaStar, FaWhatsapp } from 'react-icons/fa';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom';
import ProductReviewsModal from '../components/ProductReviewsModal';

// Pindahkan defaultCategories ke luar komponen
const defaultCategories = [
  { id: 1, name: 'Game', description: 'Produk gaming terlengkap', status: 'active', hasChildren: false },
  { id: 2, name: 'Pulsa', description: 'Top up pulsa semua operator', status: 'active', hasChildren: false },
  { id: 3, name: 'E-Wallet', description: 'Top up e-wallet favorit Anda', status: 'active', hasChildren: false },
  { id: 4, name: 'Voucher', description: 'Voucher game dan aplikasi', status: 'active', hasChildren: false }
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [siteContent, setSiteContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState(null);
  
  const navigate = useNavigate();
  
  // Default categories as fallback
  const defaultCategories = [
    {
      name: 'Game',
      description: 'Top up game favorit Anda',
      icon: '🎮'
    },
    {
      name: 'Pulsa',
      description: 'Isi pulsa semua operator',
      icon: '📱'
    },
    {
      name: 'E-Wallet',
      description: 'Top up dompet digital',
      icon: '💳'
    },
    {
      name: 'Voucher',
      description: 'Voucher game dan aplikasi',
      icon: '🎫'
    }
  ];
  
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserData(response.data);
        return response;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return { data: null };
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Health check first
        try {
          const healthResponse = await fetch('http://localhost:5000/api/health');
          if (!healthResponse.ok) {
            throw new Error('Backend server tidak tersedia');
          }
        } catch (healthError) {
          console.warn('Backend tidak tersedia, menggunakan data fallback');
          setCategories(defaultCategories);
          setProducts([]);
          setBanners([]);
          setFaqs([]);
          setLoading(false);
          return;
        }
    
        // Fetch data dengan categories/tree untuk mendapatkan struktur hierarki
        const [categoriesResponse, bannersResponse, faqsResponse, promotionsResponse, contentResponse] = await Promise.allSettled([
          fetch('http://localhost:5000/api/admin/categories/tree'),
          axios.get('http://localhost:5000/api/cms/banners/active').catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/cms/faqs').catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/promotions').catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/cms/content').catch(() => ({ data: [] }))
        ]);
    
        // Handle categories dengan struktur tree
        if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.ok) {
          const categoriesData = await categoriesResponse.value.json();
          // Flatten tree structure untuk display di home, tapi simpan info children
          const flatCategories = [];
          const flattenCategories = (cats, level = 0) => {
            cats.forEach(cat => {
              flatCategories.push({ ...cat, level, hasChildren: cat.children && cat.children.length > 0 });
              if (cat.children && cat.children.length > 0) {
                flattenCategories(cat.children, level + 1);
              }
            });
          };
          flattenCategories(categoriesData);
          setCategories(flatCategories.filter(cat => cat.status === 'active'));
        } else {
          setCategories(defaultCategories);
        }
        
        // Fetch user data if not already available
        if (!userData) {
          await fetchUserData();
        }
        
        // Fetch products separately
        const productsRes = await axios.get('http://localhost:5000/api/products').catch(() => ({ data: [] }));
        setProducts(productsRes.data || []);
        
        // Handle other responses
        if (bannersResponse.status === 'fulfilled') {
          setBanners(bannersResponse.value.data || []);
        }
        
        if (faqsResponse.status === 'fulfilled') {
          setFaqs(faqsResponse.value.data || []);
        }
        
        if (promotionsResponse.status === 'fulfilled') {
          setPromotions(promotionsResponse.value.data || []);
        }
        
        if (contentResponse.status === 'fulfilled') {
          const contentObj = {};
          if (contentResponse.value.data) {
            contentResponse.value.data.forEach(item => {
              contentObj[item.key] = item.value;
            });
          }
          setSiteContent(contentObj);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories(defaultCategories);
        setProducts([]);
        setBanners([]);
        setFaqs([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userData]); // defaultCategories sudah di dalam komponen, tidak perlu di dependency array karena sudah di luar komponen

  // Filter products based on category and search term
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);
  
  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [banners.length]);
  
  // Update handleCategoryClick function
  const handleCategoryClick = (categoryId, categoryName, hasChildren) => {
    if (hasChildren) {
      // Jika kategori memiliki subkategori, arahkan ke halaman subkategori
      navigate(`/subcategory/${categoryId}?name=${encodeURIComponent(categoryName)}`);
    } else {
      // Jika tidak memiliki subkategori, langsung ke halaman produk
      navigate(`/katalog?category=${encodeURIComponent(categoryName)}`);
    }
  };
  
  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
  
  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };
  
  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleProductView = (productId) => {
    // Navigate to product detail page
    navigate(`/product/${productId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  // WhatsApp function
  const openWhatsApp = () => {
    const phoneNumber = '6281234567890'; // Replace with your WhatsApp number
    const message = 'Halo! Saya butuh bantuan mengenai produk di website Anda.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Handle reviews click function
  const handleReviewsClick = (product) => {
    setSelectedProductForReviews(product);
    setShowReviewsModal(true);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat konten...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header/Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-red-50 text-black-600 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Platform Digital Terpercaya
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-4">
              Selamat Datang, {userData?.username || 'Pengguna'}!
              <span className="text-red-500"> Temukan Produk Digital Terbaik</span>
            </h1>
            <p className="text-1xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Platform digital terpercaya untuk semua kebutuhan Anda dengan harga terjangkau dan layanan terbaik.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-500">Pengguna Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-500">Produk Digital</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-500">Layanan Support</div>
              </div>
            </div>
            
            {/* Header Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Cari produk digital favorit Anda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 shadow-lg transition-all duration-300 hover:shadow-xl"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-sm text-gray-500 mr-2">Populer:</span>
                {['Mobile Legends', 'PUBG', 'Free Fire', 'Genshin Impact'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchTerm(suggestion)}
                    className="px-3 py-1 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 rounded-full text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Moved here after search bar */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
          
          </div>
          
         
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-orange-200 group">
                  <div className="relative">
                    <img 
                      src={product.image_url || '/placeholder-product.jpg'} 
                      alt={product.name}
                      className="w-full h-32 md:h-48 object-cover"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold">Stok Habis</span>
                      </div>
                    )}
                    {/* Badge Terjual */}
                    {product.sold_count > 0 && (
                      <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-green-500 text-white px-1 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-bold">
                        {product.sold_count} Terjual
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 md:p-6">
                    <div className="text-xs font-medium text-orange-500 bg-orange-50 inline-block px-1 md:px-2 py-0.5 md:py-1 rounded-full mb-1 md:mb-2">{product.category}</div>
                    <div className="text-xs md:text-sm font-medium text-white bg-green-300 inline-block px-2 md:px-5 py-0.5 md:py-1 rounded-full mb-1 md:mb-2">NEW</div>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2 line-clamp-2">{product.name}</h3>
                    
                    {/* Rating dan Reviews */}
                    <div className="flex items-center mb-2 md:mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar 
                            key={star}
                            className={`w-3 h-3 md:w-4 md:h-4 ${
                              star <= Math.round(parseFloat(product.average_rating) || 0) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-gray-600 ml-1 md:ml-2">
                        {product.average_rating ? parseFloat(product.average_rating).toFixed(1) : '0.0'}
                      </span>
                      <button
                        onClick={() => handleReviewsClick(product)}
                        className="text-xs md:text-sm text-blue-600 hover:text-blue-800 ml-1 hover:underline cursor-pointer"
                      >
                        ({product.total_reviews || 0})
                      </button>
                    </div>
                    
                    <div className="mb-2 md:mb-3">
                      <span className="text-sm md:text-xl font-bold text-green-400 block">{formatPrice(product.price)}</span>
                    </div>
                    
                    <button 
                      className={`w-full flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium ${product.stock === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors`}
                      disabled={product.stock === 0}
                      onClick={() => handleProductView(product.id)}
                    >
                      {product.stock === 0 ? 'Habis' : 'Beli Sekarang'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="text-3xl md:text-5xl mb-4">📦</div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
                <p className="text-sm md:text-base text-gray-600">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            )}
          </div>
          
          {filteredProducts.length > 8 && (
            <div className="mt-8 md:mt-12 text-center">
              <button 
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-xl text-sm md:text-base font-medium transition-colors"
                onClick={() => navigate('/katalog')}
              >
                Lihat Semua Produk
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Banner Section - Jika ada banner */}
      {banners.length > 0 && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="banner-container">
                {banners.map((banner, index) => (
                  <div 
                    key={banner.id} 
                    className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                    style={{
                      backgroundImage: `url(${banner.image_url})`,
                    }}
                  >
                    <div className="banner-content bg-gradient-to-r from-gray-900/70 to-transparent p-8 text-white">
                      <h2 className="text-3xl font-bold mb-2">{banner.title}</h2>
                      <p className="text-lg mb-4">{banner.description}</p>
                      {banner.link_url && (
                        <a href={banner.link_url} className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-medium transition-colors" target="_blank" rel="noopener noreferrer">
                          Selengkapnya →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {banners.length > 1 && (
                <>
                  <button className="banner-nav prev absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm" onClick={prevBanner}>‹</button>
                  <button className="banner-nav next absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm" onClick={nextBanner}>›</button>
                  
                  <div className="banner-indicators absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentBannerIndex ? 'bg-white' : 'bg-white/50'}`}
                        onClick={() => setCurrentBannerIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section - Updated */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Kategori Produk</h2>
            <p className="text-sm md:text-base text-gray-600">Pilih kategori yang Anda butuhkan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {(categories.length > 0 ? categories.filter(cat => cat.level === 0) : defaultCategories).map((category, idx) => (
              <div 
                key={category.id || idx} 
                className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-6 hover:shadow-lg transition-all duration-300 hover:border-red-200 group cursor-pointer"
                onClick={() => handleCategoryClick(category.id, category.name, category.hasChildren)}
              >
                <div className="flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-red-100 to-red-100 rounded-xl md:rounded-2xl mb-2 md:mb-4 group-hover:scale-105 transition-transform">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-5 h-5 md:w-8 md:h-8 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <span className="text-sm md:text-2xl text-white font-bold">
                      {category.icon || category.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{category.name}</h3>
                <p className="text-xs md:text-base text-gray-600 mb-2 md:mb-4 line-clamp-2">{category.description}</p>
                
                <div className="flex items-center text-red-500 group-hover:translate-x-2 transition-transform">
                  <span className="text-xs md:text-sm font-medium mr-1 md:mr-2">Lihat Produk</span>
                  <FaArrowRight className="text-xs md:text-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions Section - Jika ada promo */}
      {promotions.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Promo Terbaru</h2>
              <p className="text-gray-600">Jangan lewatkan penawaran menarik kami!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {promotions.slice(0, 3).map((promo) => (
                <div key={promo.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all">
                  {promo.image_url && (
                    <div className="relative">
                      <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
                      <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {promo.discount_percentage}% OFF
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{promo.title}</h3>
                    <p className="text-gray-600 mb-4">{promo.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Berlaku hingga {new Date(promo.end_date).toLocaleDateString('id-ID')}
                      </span>
                      <button className="text-orange-500 font-medium hover:text-orange-600 transition-colors">
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

     


  {/* Video Tutorial */}
  <section className="video-tutorial">
        <div className="section-header">
        
          <p>Pelajari cara menggunakan layanan kami</p>
        </div>
        <div className="video-container">
          <iframe 
            width="100%" 
            height="315" 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
            title="Video Tutorial" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
              <p className="text-gray-600">Temukan jawaban atas pertanyaan Anda</p>
            </div>
            
            <div className="space-y-4">
              {faqs.filter(faq => faq.status === 'active').slice(0, 5).map((faq, index) => (
                <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button 
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <div className="ml-4 flex-shrink-0">
                      {expandedFaq === index ? 
                        <FaChevronUp className="w-5 h-5 text-gray-400" /> : 
                        <FaChevronDown className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floating WhatsApp Button */}
      <div className="floating-whatsapp" onClick={openWhatsApp}>
        <div className="whatsapp-icon">
          <FaWhatsapp />
        </div>
        <div className="whatsapp-tooltip">
          <span>Butuh bantuan? Chat kami!</span>
        </div>
      </div>

      {/* Modal Reviews */}
      {selectedProductForReviews && (
        <ProductReviewsModal
          isOpen={showReviewsModal}
          onClose={() => {
            setShowReviewsModal(false);
            setSelectedProductForReviews(null);
          }}
          productId={selectedProductForReviews.id}
          productName={selectedProductForReviews.name}
        />
      )}
    </div>
  );
};

export default Home;
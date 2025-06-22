import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaShoppingCart, FaEye, FaStar, FaCheck } from 'react-icons/fa';
import '../styles/Katalog.css';

const Katalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  // Default categories sebagai fallback
  const defaultCategories = [
    { id: 1, name: 'Game', status: 'active', icon: '🎮', description: 'Top up game favorit' },
    { id: 2, name: 'Pulsa', status: 'active', icon: '📱', description: 'Isi pulsa semua operator' },
    { id: 3, name: 'E-Wallet', status: 'active', icon: '💳', description: 'Top up dompet digital' },
    { id: 4, name: 'Voucher', status: 'active', icon: '🎫', description: 'Voucher game dan aplikasi' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
          setLoading(false);
          return;
        }

        // Fetch categories dan products secara bersamaan
        const [categoriesResponse, productsResponse] = await Promise.allSettled([
          fetch('http://localhost:5000/api/admin/categories'),
          fetch('http://localhost:5000/api/products')
        ]);

        // Handle categories
        if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.ok) {
          const categoriesData = await categoriesResponse.value.json();
          setCategories(categoriesData.filter(cat => cat.status === 'active'));
        } else {
          setCategories(defaultCategories);
        }

        // Handle products
        if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
          const productsData = await productsResponse.value.json();
          setProducts(productsData);
        } else {
          setProducts([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data. Silakan coba lagi.');
        setCategories(defaultCategories);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchData();
    
    // Check if category is passed via URL params
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || 
                           product.category_id?.toString() === selectedCategory ||
                           product.category === selectedCategory;
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  // Tambahkan fungsi handleAddToCart di sini (setelah formatPrice function)
  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      alert('Produk ini sedang habis stok');
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
      total: product.price
    };

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += 1;
      existingCart[existingItemIndex].total = existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    alert('Produk berhasil ditambahkan ke keranjang!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Katalog Produk Digital
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Temukan Produk
              <span className="text-red-500"> Digital Terbaik</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Jelajahi koleksi lengkap produk digital dengan harga terjangkau dan kualitas terpercaya.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk digital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-lg focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <FaFilter className="text-gray-400 mr-2" />
            <span className="text-gray-600 font-medium">Filter berdasarkan kategori:</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-red-500 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:text-red-500'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              Semua Kategori
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id.toString() || selectedCategory === category.name
                    ? 'bg-red-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:text-red-500'
                }`}
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                <span>{category.icon || '📦'}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8">
              <p>⚠️ {error}</p>
            </div>
          )}
          
          {filteredProducts.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  Menampilkan <span className="font-semibold text-red-500">{filteredProducts.length}</span> produk
                  {selectedCategory !== 'all' && (
                    <span> dalam kategori <span className="font-semibold text-red-500">
                      {categories.find(cat => cat.id.toString() === selectedCategory || cat.name === selectedCategory)?.name || selectedCategory}
                    </span></span>
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative h-48 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">

                        <button 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="bg-white text-red-500 px-4 py-2 rounded-full font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
                        >
                          <FaEye /> Lihat Detail
                        </button>
                      </div>
                      
                      {/* Stock Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.stock > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok Habis'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      
                   
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-red-500">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" />
                          <span className="text-sm text-gray-600">4.8</span>
                        </div>
                      </div>
                      
                      
                      <button 
                        className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                          product.stock > 0
                            ? 'bg-red-500 hover:bg-red-600 text-white transform hover:scale-105'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={product.stock === 0}
                        onClick={() => handleAddToCart(product)}
                      >
                        {product.stock > 0 ? (
                          <>
                            <FaShoppingCart /> Tambah ke Keranjang
                          </>
                        ) : (
                          'Stok Habis'
                        )}
                      </button>
                      
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
              <p className="text-gray-600 mb-6">Coba ubah filter atau kata kunci pencarian Anda</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Katalog;
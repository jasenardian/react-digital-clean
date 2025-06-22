import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaBox, FaEye } from 'react-icons/fa';
import '../styles/SubCategory.css';

const SubCategory = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const categoryName = searchParams.get('name');

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/admin/categories/tree`);
        
        if (response.ok) {
          const categoriesTree = await response.json();
          
          // Cari kategori yang dipilih
          const findCategory = (cats) => {
            for (const cat of cats) {
              if (cat.id.toString() === categoryId) {
                return cat;
              }
              if (cat.children && cat.children.length > 0) {
                const found = findCategory(cat.children);
                if (found) return found;
              }
            }
            return null;
          };
          
          const selectedCategory = findCategory(categoriesTree);
          if (selectedCategory) {
            setCategory(selectedCategory);
            setSubcategories(selectedCategory.children || []);
          } else {
            setError('Kategori tidak ditemukan');
          }
        } else {
          setError('Gagal memuat subkategori');
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  const handleSubcategoryClick = (subcategoryName) => {
    navigate(`/katalog?category=${encodeURIComponent(subcategoryName)}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat subkategori...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <button 
            onClick={handleBackToHome} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft /> Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Back Button */}
            <div className="mb-6">
              <button 
                onClick={handleBackToHome}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors"
              >
                <FaArrowLeft /> Kembali ke Beranda
              </button>
            </div>
            
            <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Subkategori Produk
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Subkategori
              <span className="text-red-500"> {categoryName || category?.name}</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Pilih subkategori yang sesuai dengan kebutuhan Anda untuk menemukan produk yang tepat.
            </p>
            
            {/* Breadcrumb */}
            <nav className="flex justify-center items-center space-x-2 text-sm text-gray-500">
              <button onClick={handleBackToHome} className="hover:text-red-500 transition-colors">
                Beranda
              </button>
              <span>/</span>
              <span className="text-red-500 font-medium">{categoryName || category?.name}</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Subcategories Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {subcategories.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  Tersedia <span className="font-semibold text-red-500">{subcategories.length}</span> subkategori
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {subcategories.map(subcategory => (
                  <div 
                    key={subcategory.id} 
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                    onClick={() => handleSubcategoryClick(subcategory.name)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {subcategory.image_url ? (
                        <img 
                          src={subcategory.image_url} 
                          alt={subcategory.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      <div 
                        className={`w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center ${
                          subcategory.image_url ? 'hidden' : 'flex'
                        }`}
                      >
                        <span className="text-6xl">
                          {subcategory.icon || '📦'}
                        </span>
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <button className="bg-white text-red-500 px-4 py-2 rounded-full font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                          <FaEye /> Lihat Produk
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {subcategory.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {subcategory.description || 'Temukan berbagai produk berkualitas dalam kategori ini'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Lihat produk
                        </span>
                        <FaArrowRight className="text-red-500 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBox className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak ada subkategori</h3>
              <p className="text-gray-600 mb-6">Kategori ini tidak memiliki subkategori, tetapi Anda dapat langsung melihat produknya.</p>
              <button 
                onClick={() => navigate(`/katalog?category=${encodeURIComponent(categoryName)}`)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <FaEye /> Lihat Produk Langsung
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SubCategory;
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total_categories: 0,
    active_categories: 0,
    inactive_categories: 0,
    total_products_with_category: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  // Tambahkan state untuk parent categories dan tree view
  const [parentCategories, setParentCategories] = useState([]);
  const [showTreeView, setShowTreeView] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  
  // Update formData state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    parent_id: null,
    icon: '',
    image_url: ''
  });

  // Add missing fetchCategories function
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  // Add missing fetchStats function
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/categories/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // Fetch parent categories (level 0 only)
  const fetchParentCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/categories?parent_id=null', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setParentCategories(data);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
    }
  };
  
  // Update useEffect
  useEffect(() => {
    fetchCategories();
    fetchParentCategories();
    fetchStats();
  }, []);
  
  // Update form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || null
      };
      
      const url = editingCategory 
        ? `http://localhost:5000/api/admin/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(submitData)
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ 
          name: '', 
          description: '', 
          status: 'active', 
          parent_id: null,
          icon: '',
          image_url: ''
        });
        fetchCategories();
        fetchParentCategories();
        alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error saving category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status,
      parent_id: category.parent_id || null
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5000/api/admin/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchCategories();
          fetchStats();
          alert('Category deleted successfully!');
        } else {
          const error = await response.json();
          alert(error.error || 'Error deleting category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select categories to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} selected categories?`)) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/admin/categories', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ categoryIds: selectedCategories })
        });

        const result = await response.json();
        if (response.ok) {
          fetchCategories();
          fetchStats();
          setSelectedCategories([]);
          alert(result.message);
        } else {
          alert(result.error || 'Error deleting categories');
        }
      } catch (error) {
        console.error('Error bulk deleting categories:', error);
        alert('Error deleting categories');
      }
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(cat => cat.id));
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="category-management">
      <div className="page-header">
        <h1>Category Management</h1>
        <p>Kelola semua kategori produk dalam sistem</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaEye />
          </div>
          <div className="stat-content">
            <h3>{stats.total_categories}</h3>
            <p>TOTAL CATEGORIES</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FaEye />
          </div>
          <div className="stat-content">
            <h3>{stats.active_categories}</h3>
            <p>ACTIVE</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <FaEye />
          </div>
          <div className="stat-content">
            <h3>{stats.inactive_categories}</h3>
            <p>INACTIVE</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon products">
            <FaEye />
          </div>
          <div className="stat-content">
            <h3>{stats.total_products_with_category}</h3>
            <p>PRODUCTS WITH CATEGORY</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="left-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="right-controls">
          {selectedCategories.length > 0 && (
            <button 
              className="bulk-delete-btn"
              onClick={handleBulkDelete}
            >
              <FaTrash /> Delete Selected ({selectedCategories.length})
            </button>
          )}
  
          <button 
            className="add-btn"
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', status: 'active', parent_id: null });
              setShowModal(true);
            }}
          >
            <FaPlus /> Add Category
          </button>
          
       
     
        </div>
      </div>

      {/* Categories Table */}
      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>NAME</th>
              <th>DESCRIPTION</th>
              <th>PARENT</th>
              <th>STATUS</th>
              <th>PRODUCTS</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map(category => (
            <tr key={category.id}>
            <td>
            <input
            type="checkbox"
            checked={selectedCategories.includes(category.id)}
            onChange={() => handleSelectCategory(category.id)}
            />
            </td>
         
            <td>
              <div className="category-display">
                {category.icon && <span className="category-emoji">{category.icon}</span>}
                {category.image_url && (
                  <img 
                    src={category.image_url} 
                    alt={category.name} 
                    className="category-thumbnail"
                  />
                )}
                <span className="category-name">
                  {category.level > 0 && '└── '}
                  {category.name}
                </span>
                {category.level === 0 && <span className="badge badge-primary ml-2">Main</span>}
                {category.level > 0 && <span className="badge badge-secondary ml-2">Sub</span>}
              </div>
            </td>
            <td>{category.description}</td>
            <td>{category.parent_name || '-'}</td>
            <td>
            <span className={`status ${category.status}`}>
            {category.status}
            </span>
            </td>
            <td>{category.product_count}</td>
            <td>{new Date(category.created_at).toLocaleDateString()}</td>
            <td>
            <button
            onClick={() => handleEdit(category)}
            className="btn btn-sm btn-primary mr-2"
            >
            <FaEdit />
            </button>
            <button
            onClick={() => handleDelete(category.id)}
            className="btn btn-sm btn-danger"
            >
            <FaTrash />
            </button>
            </td>
            </tr>
            ))}
          </tbody>
        </table>

        {filteredCategories.length === 0 && (
          <div className="no-data">
            <p>No categories found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '', status: 'active' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter category description (optional)"
                  rows="3"
                />
              </div>
              {/* Dalam modal form, tambahkan setelah field description */}
              <div className="form-group">
                <label>Parent Category (Optional)</label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value || null})}
                  className="form-control"
                >
                  <option value="">-- Main Category --</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category Icon (Emoji)</label>
                <div className="icon-selector">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="Pilih emoji: 🎮 📱 💳 🎫 📦"
                    maxLength="2"
                  />
                  <div className="emoji-suggestions">
                    {['🎮', '📱', '💳', '🎫', '📦', '🛒', '💻', '🎵', '📺', '🎯'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className="emoji-btn"
                        onClick={() => setFormData({...formData, icon: emoji})}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Category Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/category-image.jpg"
                />
                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover'}} />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', status: 'active' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
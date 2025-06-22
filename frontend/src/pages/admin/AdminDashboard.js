import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaBoxes, FaShoppingCart, FaDollarSign, FaEye, FaFilter, FaSearch, FaChartLine, FaBell, FaCog, FaEdit, FaTrash } from 'react-icons/fa';
import StatsCard from '../../components/admin/StatsCard';
import '../../styles/admin/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [statsRes, transactionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/recent-transactions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats(statsRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleEditTransaction = (transactionId) => {
    // Implementasi edit transaction
    console.log('Edit transaction:', transactionId);
    // Redirect ke halaman edit atau buka modal edit
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5000/api/admin/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh data setelah delete
        fetchDashboardData();
        alert('Transaksi berhasil dihapus');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus transaksi');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
          
            <p>Selamat datang kembali! Berikut ringkasan aktivitas bisnis Anda.</p>
          </div>
          <div className="header-actions">
           
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Stats Grid */}
        <div className="stats-section">
          <div className="section-header">
            <div className="header-info">
              <h2>Statistik Overview</h2>
              <p>Performa bisnis dalam periode ini</p>
            </div>
            <div className="period-selector">
              <select className="period-select">
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>
          </div>
          <div className="stats-grid">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={FaUsers}
              color="blue"
              trend="+12%"
            />
            <StatsCard
              title="Total Products"
              value={stats.totalProducts}
              icon={FaBoxes}
              color="green"
              trend="+8%"
            />
            <StatsCard
              title="Transactions"
              value={stats.totalTransactions}
              icon={FaShoppingCart}
              color="orange"
              trend="+24%"
            />
            <StatsCard
              title="Revenue"
              value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
              icon={FaDollarSign}
              color="purple"
              trend="+18%"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <div className="section-header">
            <div className="header-info">
              <h2>Quick Actions</h2>
              <p>Akses cepat ke fitur utama</p>
            </div>
          </div>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => window.location.href = '/admin/users'}>
              <div className="action-icon blue">
                <FaUsers />
              </div>
              <div className="action-content">
                <h3>Kelola Users</h3>
                <p>Tambah, edit, atau hapus pengguna</p>
              </div>
            </div>
            <div className="action-card" onClick={() => window.location.href = '/admin/products'}>
              <div className="action-icon green">
                <FaBoxes />
              </div>
              <div className="action-content">
                <h3>Kelola Produk</h3>
                <p>Atur katalog produk digital</p>
              </div>
            </div>
            <div className="action-card" onClick={() => window.location.href = '/admin/analytics'}>
              <div className="action-icon orange">
                <FaChartLine />
              </div>
              <div className="action-content">
                <h3>Analytics</h3>
                <p>Lihat laporan dan analisis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <div className="section-header">
            <div className="header-info">
              <h2>Transaksi Terbaru</h2>
              <p>Aktivitas transaksi terkini</p>
            </div>
            <div className="search-filter">
              <div className="search-input-container">
               
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
             
            </div>
          </div>
          <div className="transactions-card">
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th className="hide-mobile">Product</th>
                    <th>Amount</th>
                    <th className="hide-mobile">Status</th>
                    <th className="hide-mobile">Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions
                    .filter(transaction => 
                      transaction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="transaction-id">#{transaction.id}</span>
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {transaction.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <span className="username">{transaction.username}</span>
                            <span className="mobile-product">{transaction.product_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile">
                        <span className="product-name">{transaction.product_name}</span>
                      </td>
                      <td>
                        <div className="amount-info">
                          <span className="amount">Rp {transaction.amount.toLocaleString('id-ID')}</span>
                          <span className="mobile-status status ${transaction.status}">{transaction.status}</span>
                        </div>
                      </td>
                      <td className="hide-mobile">
                        <span className={`status ${transaction.status}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        <span className="date">{new Date(transaction.created_at).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view" 
                            title="View Details"
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="action-btn edit" 
                            title="Edit Transaction"
                            onClick={() => handleEditTransaction(transaction.id)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete Transaction"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal untuk View Transaction */}
      {showModal && selectedTransaction && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Transaksi #{selectedTransaction.id}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">User:</span>
                <span className="value">{selectedTransaction.username}</span>
              </div>
              <div className="detail-row">
                <span className="label">Product:</span>
                <span className="value">{selectedTransaction.product_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">Rp {selectedTransaction.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status ${selectedTransaction.status}`}>{selectedTransaction.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{new Date(selectedTransaction.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
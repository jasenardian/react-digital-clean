import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TransactionManagement.css';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total_transactions: 0,
    success_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
    total_revenue: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1,
    limit: 10
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Use useCallback to memoize fetchTransactions function
  // Tambahkan loading state untuk berbagai aksi
  const [loadingStates, setLoadingStates] = useState({
    fetching: false,
    updating: false,
    searching: false
  });
  
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(
        `http://localhost:5000/api/admin/transactions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Add filters as dependency since fetchTransactions uses it

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]); // Now include fetchTransactions in dependency array

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const openTransactionModal = async (transactionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/admin/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSelectedTransaction(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/transactions/${transactionId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh data
      fetchTransactions();
      setShowModal(false);
      alert('Status transaksi berhasil diupdate!');
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Gagal mengupdate status transaksi!');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { class: 'success', text: 'Berhasil' },
      pending: { class: 'pending', text: 'Pending' },
      failed: { class: 'failed', text: 'Gagal' }
    };
    
    const config = statusConfig[status] || { class: 'unknown', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="transaction-management">
      <div className="page-header">
        <h1>Transaction Management</h1>
        <p>Kelola semua transaksi dalam sistem</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Transaksi</h3>
          <div className="stat-value">{statistics.total_transactions}</div>
        </div>
        <div className="stat-card success">
          <h3>Berhasil</h3>
          <div className="stat-value">{statistics.success_transactions}</div>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <div className="stat-value">{statistics.pending_transactions}</div>
        </div>
        <div className="stat-card failed">
          <h3>Gagal</h3>
          <div className="stat-value">{statistics.failed_transactions}</div>
        </div>
        <div className="stat-card revenue">
          <h3>Total Revenue</h3>
          <div className="stat-value">{formatCurrency(statistics.total_revenue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="success">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Dari Tanggal:</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Search:</label>
            <input 
              type="text" 
              placeholder="Cari username atau produk..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Produk</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>#{transaction.id}</td>
                <td>{transaction.username}</td>
                <td>{transaction.product_name}</td>
                <td>1</td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td>{getStatusBadge(transaction.status)}</td>
                <td>{formatDate(transaction.created_at)}</td>
                <td>
                  <button 
                    className="btn-view"
                    onClick={() => openTransactionModal(transaction.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div className="no-data">
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Transaksi #{selectedTransaction.id}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Username:</label>
                  <span>{selectedTransaction.username}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedTransaction.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Produk:</label>
                  <span>{selectedTransaction.product_name}</span>
                </div>
                <div className="detail-item">
                  <label>Kategori:</label>
                  <span>{selectedTransaction.product_category}</span>
                </div>
                <div className="detail-item">
                  <label>Quantity:</label>
                  <span>{selectedTransaction.quantity}</span>
                </div>
                <div className="detail-item">
                  <label>Harga Satuan:</label>
                  <span>{formatCurrency(selectedTransaction.product_price)}</span>
                </div>
                <div className="detail-item">
                  <label>Total Harga:</label>
                  <span>{formatCurrency(selectedTransaction.amount)}</span> {/* Ganti dari total_price ke amount */}
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedTransaction.status)}</span>
                </div>
                <div className="detail-item">
                  <label>Tanggal:</label>
                  <span>{formatDate(selectedTransaction.created_at)}</span>
                </div>
              </div>
              
              <div className="status-actions">
                <h3>Update Status:</h3>
                <div className="status-buttons">
                  <button 
                    className="btn-success"
                    onClick={() => updateTransactionStatus(selectedTransaction.id, 'success')}
                    disabled={selectedTransaction.status === 'success'}
                  >
                    Mark as Success
                  </button>
                  <button 
                    className="btn-pending"
                    onClick={() => updateTransactionStatus(selectedTransaction.id, 'pending')}
                    disabled={selectedTransaction.status === 'pending'}
                  >
                    Mark as Pending
                  </button>
                  <button 
                    className="btn-failed"
                    onClick={() => updateTransactionStatus(selectedTransaction.id, 'failed')}
                    disabled={selectedTransaction.status === 'failed'}
                  >
                    Mark as Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;

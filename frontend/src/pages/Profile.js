import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('saldo');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  // Tambahkan state baru untuk payment channels
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [topUpHistory, setTopUpHistory] = useState([]);
  
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Tambahkan fungsi helper untuk format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';
    return `Rp ${parseInt(amount).toLocaleString('id-ID')}`;
  };
  
  // Fungsi helper untuk format date yang lebih robust
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'NULL') return 'Belum tersedia';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Belum tersedia';
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Belum tersedia';
    }
  };
  
  // Fungsi untuk filter dan sort transaksi
  const getFilteredAndSortedTransactions = () => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (transactionFilter === 'all') return matchesSearch;
      if (transactionFilter === 'success') return matchesSearch && transaction.status === 'success';
      if (transactionFilter === 'pending') return matchesSearch && transaction.status === 'pending';
      if (transactionFilter === 'failed') return matchesSearch && transaction.status === 'failed';
      
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'product':
          aValue = a.product_name?.toLowerCase() || '';
          bValue = b.product_name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  // Pagination
  const filteredTransactions = getFilteredAndSortedTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Fungsi untuk mendapatkan statistik transaksi
  const getTransactionStats = () => {
    const total = transactions.length;
    const success = transactions.filter(t => t.status === 'success').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const failed = transactions.filter(t => t.status === 'failed').length;
    const totalAmount = transactions
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return { total, success, pending, failed, totalAmount };
  };

  const stats = getTransactionStats();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchUserData(token),
          fetchTransactions(token),
          fetchTopUpHistory(token),
          fetchPaymentChannels()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [navigate]);

  // Set active tab berdasarkan URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []); // Empty dependency array since this should only run once

  // Tambahkan definisi fungsi yang hilang
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cek apakah response memiliki struktur success/data atau langsung data
      if (response.data.success) {
        setUserData(response.data.data);
      } else if (response.data.id) {
        // Fallback jika response langsung berupa data user
        setUserData(response.data);
      } else {
        console.error('Failed to fetch user data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchTransactions = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTransactions(response.data.data);
      } else {
        console.error('Failed to fetch transactions:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchTopUpHistory = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/topup/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Periksa format response dan handle kedua kemungkinan
      if (response.data.success) {
        setTopUpHistory(response.data.data);
      } else if (Array.isArray(response.data)) {
        // Jika response langsung berupa array
        setTopUpHistory(response.data);
      } else {
        console.error('Failed to fetch top up history:', response.data.message);
        setTopUpHistory([]);
      }
    } catch (error) {
      console.error('Error fetching top up history:', error);
      setTopUpHistory([]);
    }
  };

  const fetchPaymentChannels = async () => {
    setLoadingChannels(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/topup/payment-channels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPaymentChannels(response.data.data);
      } else {
        console.error('Failed to fetch payment channels:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching payment channels:', error);
      // Jika gagal, set default channels untuk fallback
      setPaymentChannels([
        { code: 'QRIS', name: 'QRIS', total_fee: 2500 },
        { code: 'ALFAMART', name: 'Alfamart', total_fee: 2500 },
        { code: 'INDOMARET', name: 'Indomaret', total_fee: 2500 }
      ]);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Hapus baris ini karena stats sudah dideklarasikan sebelumnya
  // const stats = getTransactionStats();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchUserData(token),
          fetchTransactions(token),
          fetchTopUpHistory(token),
          fetchPaymentChannels()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [navigate]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    
    if (!topUpAmount || parseInt(topUpAmount) < 10000) {
      alert('Jumlah top up minimal Rp 10.000');
      return;
    }
    
    if (!paymentMethod) {
      alert('Silakan pilih metode pembayaran');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/topup/request', 
        { 
          amount: topUpAmount,
          paymentMethod: paymentMethod // Tambahkan payment method
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        alert('Berhasil membuat permintaan top up');
        // Refresh data
        fetchTopUpHistory(token);
        setTopUpAmount('');
        setPaymentMethod('');
      }
    } catch (error) {
      console.error('Error creating top up request:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal membuat permintaan top up');
      }
    }
  };

  const handleResetPin = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/reset-pin',
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert('PIN berhasil direset. Silakan cek email Anda untuk PIN baru.');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      alert('Gagal mereset PIN');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Profil Pengguna</h1>
      <p className="profile-subtitle">Kelola akun dan riwayat transaksi Anda</p>
      
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'saldo' ? 'active' : ''}`}
          onClick={() => setActiveTab('saldo')}
        >
          💰 Saldo
        </button>
        <button 
          className={`tab-button ${activeTab === 'topup' ? 'active' : ''}`}
          onClick={() => setActiveTab('topup')}
        >
          📦 Top Up
        </button>
        <button 
          className={`tab-button ${activeTab === 'riwayat-topup' ? 'active' : ''}`}
          onClick={() => setActiveTab('riwayat-topup')}
        >
          📋 Riwayat Top Up
        </button>
        <button 
          className={`tab-button ${activeTab === 'riwayat-transaksi' ? 'active' : ''}`}
          onClick={() => setActiveTab('riwayat-transaksi')}
        >
          📊 Riwayat Transaksi
        </button>
        <button 
          className={`tab-button ${activeTab === 'reset-pin' ? 'active' : ''}`}
          onClick={() => setActiveTab('reset-pin')}
        >
          🔒 Reset PIN
        </button>
      </div>
      
      <div className="tab-content">
        {loading && <p>Loading...</p>}
        
        {!loading && activeTab === 'saldo' && (
          <div className="saldo-container">
            <div className="saldo-card">
              <h3>Saldo Anda</h3>
              <p className="saldo-info">Informasi saldo akun Anda saat ini</p>
              <div className="saldo-amount">
                <h2>{formatCurrency(userData?.balance)}</h2>
                <p>Saldo tersedia</p>
              </div>
            </div>
            
            <div className="user-info">
              <h3>Informasi Akun</h3>
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">{userData?.username || 'Belum tersedia'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Bergabung:</span>
                <span className="info-value">{formatDate(userData?.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Login Terakhir:</span>
                <span className="info-value">{formatDate(userData?.last_login)}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'topup' && (
          <div className="topup-container">
            <h3>Top Up Saldo</h3>
            <p>Isi saldo Anda menggunakan Tripay. Pilih metode pembayaran yang tersedia.</p>
            
            <form onSubmit={handleTopUp} className="topup-form">
              <div className="form-group">
                <label>Jumlah Top Up (Minimal Rp 10.000):</label>
                <input 
                  type="number" 
                  value={topUpAmount} 
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  min="10000"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Metode Pembayaran:</label>
                {loadingChannels ? (
                  <div className="loading-channels">Memuat metode pembayaran...</div>
                ) : (
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="payment-select"
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    {paymentChannels.map(channel => (
                      <option key={channel.code} value={channel.code}>
                        {channel.name} - Fee: Rp {channel.total_fee?.toLocaleString('id-ID') || '0'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {paymentChannels.length === 0 && !loadingChannels && (
                <div className="payment-warning">
                  <p>⚠️ Tidak ada metode pembayaran yang aktif. Silakan hubungi administrator.</p>
                </div>
              )}
              
              <div className="payment-info">
                <h4>Informasi Pembayaran:</h4>
                <ul>
                  <li>Pembayaran diproses melalui Tripay Payment Gateway</li>
                  <li>Saldo akan otomatis bertambah setelah pembayaran berhasil</li>
                  <li>Transaksi akan expired dalam 24 jam</li>
                  <li>Fee pembayaran sudah termasuk dalam total yang harus dibayar</li>
                </ul>
              </div>
              
              <button 
                type="submit" 
                className="topup-button"
                disabled={loadingChannels || paymentChannels.length === 0}
              >
                {loadingChannels ? 'Memuat...' : 'Proses Top Up'}
              </button>
            </form>
          </div>
        )}
        
        {activeTab === 'riwayat-topup' && (
          <div className="history-container">
            <h3>Riwayat Pengisian Saldo</h3>
            <p>Daftar semua pengisian saldo yang pernah dilakukan. Status ditampilkan via callback (simulasi).</p>
            
            {topUpHistory.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jumlah</th>
                    <th>Metode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topUpHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>Rp {item.amount.toLocaleString('id-ID')}</td>
                      <td>{item.payment_method}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'success' ? 'Berhasil' : 
                           item.status === 'pending' ? 'Menunggu' : 'Gagal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Belum ada riwayat pengisian saldo.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'riwayat-transaksi' && (
          <div className="history-container">
            <div className="transaction-header">
              <h3>Riwayat Transaksi Produk</h3>
              <p>Daftar lengkap semua pembelian produk yang pernah dilakukan.</p>
            </div>
            
            {/* Statistik Transaksi */}
            <div className="transaction-stats">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h4>{stats.total}</h4>
                  <p>Total Transaksi</p>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h4>{stats.success}</h4>
                  <p>Berhasil</p>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h4>{stats.pending}</h4>
                  <p>Menunggu</p>
                </div>
              </div>
              <div className="stat-card failed">
                <div className="stat-icon">❌</div>
                <div className="stat-info">
                  <h4>{stats.failed}</h4>
                  <p>Gagal</p>
                </div>
              </div>
              
            </div>
            
            {/* Filter dan Search */}
            <div className="transaction-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Cari produk atau ID transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="filter-controls">
                <select 
                  value={transactionFilter} 
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Semua Status</option>
                  <option value="success">Berhasil</option>
                  <option value="pending">Menunggu</option>
                  <option value="failed">Gagal</option>
                </select>
                
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="date">Urutkan: Tanggal</option>
                  <option value="amount">Urutkan: Jumlah</option>
                  <option value="product">Urutkan: Produk</option>
                </select>
                
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="sort-order-btn"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            
            {filteredTransactions.length > 0 ? (
              <>
                <div className="table-container">
                  <table className="history-table enhanced">
                    <thead>
                      <tr>
                        <th>ID Transaksi</th>
                        <th>Tanggal & Waktu</th>
                        <th>Produk</th>
                        <th>Kategori</th>
                        <th>Metode Bayar</th>
                        <th>Status</th>
                        <th>Total</th>
                       
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((item) => (
                        <tr key={item.id} className={`transaction-row ${item.status || 'pending'}`}>
                          <td>
                            <div className="transaction-id">
                              <span className="id-text">{item.transaction_id || `TRX-${item.id}`}</span>
                              <span className="id-copy" onClick={() => navigator.clipboard.writeText(item.transaction_id || `TRX-${item.id}`)}>📋</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-time">
                              <span className="date">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                              <span className="time">{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td>
                            <div className="product-info">
                              <span className="product-name">{item.product_name}</span>
                                
                            </div>
                          </td>
                          <td>
                            <span className="category-badge">{item.category || 'Digital'}</span>
                          </td>
                          <td>
                            <div className="payment-method">
                              <span className="method-icon">{item.payment_method === 'saldo' ? '💳' : '🏦'}</span>
                              <span className="method-text">{item.payment_method || 'Saldo'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge enhanced ${item.status || 'pending'}`}>
                              <span className="status-icon">
                                {(item.status || 'pending') === 'success' ? '✅' : 
                                 (item.status || 'pending') === 'pending' ? '⏳' : '❌'}
                              </span>
                              {(item.status || 'pending') === 'success' ? 'Berhasil' : 
                               (item.status || 'pending') === 'pending' ? 'Menunggu' : 'Gagal'}
                            </span>
                          </td>
                          <td>
                            <div className="amount-info">
                              <span className="amount">{formatCurrency(item.amount)}</span>
                              {item.discount && <span className="discount">-{formatCurrency(item.discount)}</span>}
                            </div>
                          </td>
                      
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Sebelumnya
                    </button>
                    
                    <div className="pagination-info">
                      <span>Halaman {currentPage} dari {totalPages}</span>
                      <span className="total-items">({filteredTransactions.length} transaksi)</span>
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state enhanced">
                <div className="empty-icon">📋</div>
                <h4>Tidak ada transaksi ditemukan</h4>
                <p>Belum ada riwayat transaksi atau tidak ada yang sesuai dengan filter Anda.</p>
                {searchTerm && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setTransactionFilter('all');
                    }}
                    className="clear-filter-btn"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'reset-pin' && (
          <div className="reset-pin-container">
            <h3>Reset PIN</h3>
            <p>Ubah PIN akun Anda untuk keamanan yang lebih baik.</p>
            
            <div className="reset-pin-card">
              <p>Klik tombol di bawah untuk mengubah PIN Anda.</p>
              <button onClick={handleResetPin} className="reset-pin-button">Ubah PIN Saya</button>
            </div>
          </div>
        )}
      </div>
    </div>
  // Hapus tag penutup </div> berlebih ini
  // </div>
);
};

export default Profile;
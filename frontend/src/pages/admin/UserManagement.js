import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaEye, FaUserShield, FaHistory, FaDownload, FaKey, FaLock, FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import './UserManagement.css';
// ... existing code ...

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy] = useState('created_at');
  const [sortOrder] = useState('DESC');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });
  const [statistics, setStatistics] = useState({
    total_users: 0,
    active_users: 0,
    blocked_users: 0,
    regular_users: 0,
    moderators: 0
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  
  // Remove these unused lines:
  // const [showResetModal, setShowResetModal] = useState(false);
  // const [resetType, setResetType] = useState(''); // 'password' atau 'pin'
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceFormData, setBalanceFormData] = useState({
    amount: '',
    type: 'add', // 'add' atau 'subtract'
    description: ''
  });
  
  // Add User state - move these inside the component
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
    status: 'active',
    balance: 0
  });
  
  // Add User functions
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!addFormData.username || !addFormData.email || !addFormData.password || !addFormData.role_id) {
      alert('Semua field wajib diisi');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/admin/users',
        addFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User berhasil ditambahkan');
      setShowAddModal(false);
      setAddFormData({
        username: '',
        email: '',
        password: '',
        role_id: '',
        status: 'active',
        balance: 0
      });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || 'Error menambahkan user');
      }
    }
  };

  const openAddModal = () => {
    setAddFormData({
      username: '',
      email: '',
      password: '',
      role_id: '',
      status: 'active',
      balance: 0
    });
    setShowAddModal(true);
  };

  // Fungsi untuk reset password
  const handleResetPassword = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin mereset password user ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Password berhasil direset. Password baru: ${response.data.newPassword}`);
      fetchUsers();
    } catch (error) {
      console.error('Error resetting password:', error);
      if (!handleAuthError(error)) {
        alert('Error mereset password');
      }
    }
  };

  // Fungsi untuk reset PIN
  const handleResetPin = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin mereset PIN user ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/reset-pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`PIN berhasil direset. PIN baru: ${response.data.newPin}`);
      fetchUsers();
    } catch (error) {
      console.error('Error resetting PIN:', error);
      if (!handleAuthError(error)) {
        alert('Error mereset PIN');
      }
    }
  };

  // Fungsi untuk update saldo
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `http://localhost:5000/api/admin/users/${selectedUser.id}/balance`,
        {
          amount: parseFloat(balanceFormData.amount),
          type: balanceFormData.type,
          description: balanceFormData.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Saldo berhasil diupdate');
      setShowBalanceModal(false);
      setBalanceFormData({ amount: '', type: 'add', description: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      if (!handleAuthError(error)) {
        alert('Error mengupdate saldo');
      }
    }
  };

  const handleAuthError = useCallback((error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : '',
        role: filterRole !== 'all' ? filterRole : '',
        sortBy,
        sortOrder
      });

      const response = await axios.get(
        `http://localhost:5000/api/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.users) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setStatistics(response.data.statistics);
      } else {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!handleAuthError(error)) {
        alert('Error fetching users');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, filterStatus, filterRole, sortBy, sortOrder, navigate, handleAuthError]);

  const fetchRoles = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      handleAuthError(error);
    }
  }, [navigate, handleAuthError]);

  const fetchUserActivity = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}/activity`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Ensure we always set an array
      setActivityLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      // Set empty array on error
      setActivityLogs([]);
      handleAuthError(error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          search: '',
          status: '',
          role: '',
          sortBy: 'created_at',
          sortOrder: 'DESC'
        });

        const response = await axios.get(
          `http://localhost:5000/api/admin/users?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          if (Array.isArray(response.data)) {
            setUsers(response.data);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              limit: 10
            });
            setStatistics({
              total_users: response.data.length,
              active_users: response.data.filter(u => u.status === 'active').length,
              blocked_users: response.data.filter(u => u.status === 'blocked').length,
              regular_users: response.data.filter(u => u.role_name === 'user').length,
              moderators: response.data.filter(u => u.role_name === 'moderator').length
            });
          } else if (response.data && Array.isArray(response.data.users)) {
            setUsers(response.data.users);
            setPagination(response.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              limit: 10
            });
            setStatistics(response.data.statistics || {
              total_users: 0,
              active_users: 0,
              blocked_users: 0,
              regular_users: 0,
              moderators: 0
            });
          }
        }
      } catch (error) {
        console.error('Error in initial fetch:', error);
        if (isMounted && !handleAuthError(error)) {
          alert('Error loading user data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [handleAuthError, navigate]);
  
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  
  useEffect(() => {
    if (pagination.currentPage !== 1 || searchTerm || filterStatus !== 'all' || filterRole !== 'all') {
      fetchUsers();
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, filterStatus, filterRole, fetchUsers]);

  const handleBulkAction = async (action, data = {}) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/admin/users/bulk-action',
        {
          action,
          userIds: selectedUsers,
          data
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Bulk ${action} completed successfully`);
      setSelectedUsers([]);
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const openActivityModal = async (user) => {
    setSelectedUser(user);
    setShowActivityModal(true);
    await fetchUserActivity(user.id);
  };

  const openModal = (type, user) => {
    setSelectedUser(user);
    
    switch(type) {
      case 'view':
        setShowViewModal(true);
        break;
      case 'edit':
        setEditFormData({
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          status: user.status
        });
        setShowEditModal(true);
        break;
      case 'block':
        handleBlockUser(user);
        break;
      default:
        console.log('Unknown modal type:', type);
    }
  };

  const handleBlockUser = async (user) => {
    const action = user.status === 'blocked' ? 'unblock' : 'block';
    const confirmMessage = `Are you sure you want to ${action} ${user.username}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/users/${user.id}/status`,
        { status: user.status === 'blocked' ? 'active' : 'blocked' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`User ${action}ed successfully`);
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      if (!handleAuthError(error)) {
        alert(`Error ${action}ing user`);
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      if (!handleAuthError(error)) {
        alert('Error updating user');
      }
    }
  };

  const exportUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        'http://localhost:5000/api/admin/users/export',
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error exporting users');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button onClick={openAddModal} className="btn-add-user">
            <FaPlus /> Add User
          </button>
          <button onClick={exportUsers} className="btn-export">
            <FaDownload /> Export
          </button>
          {selectedUsers.length > 0 && (
            <button 
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="btn-bulk"
            >
              Bulk Actions ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <span className="stat-number">{statistics?.total_users || 0}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statistics?.active_users || 0}</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statistics?.blocked_users || 0}</span>
          <span className="stat-label">Blocked Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statistics?.regular_users || 0}</span>
          <span className="stat-label">Regular Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statistics?.moderators || 0}</span>
          <span className="stat-label">Moderators</span>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="bulk-actions-panel">
          <h3>Bulk Actions</h3>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkAction('block')} className="btn-bulk-block">
              Block Selected
            </button>
            <button onClick={() => handleBulkAction('unblock')} className="btn-bulk-unblock">
              Unblock Selected
            </button>
            <select 
              onChange={(e) => e.target.value && handleBulkAction('change_role', { roleId: e.target.value })}
              className="bulk-role-select"
            >
              <option value="">Change Role...</option>
              {(roles || []).filter(role => role.name !== 'admin').map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <button 
              onClick={() => handleBulkAction('delete')} 
              className="btn-bulk-delete"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="user-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            {(roles || []).filter(role => role.name !== 'admin').map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={(selectedUsers || []).length === (users || []).length && (users || []).length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map(user => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={(selectedUsers || []).includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role_name || ''}`}>
                    {user.role_name || 'N/A'}
                  </span>
                </td>
                <td>Rp {user.balance?.toLocaleString() || '0'}</td>
                <td>
                  <span className={`status ${user.status || ''}`}>
                    {user.status || 'N/A'}
                  </span>
                </td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => openModal('view', user)}
                        className="btn-view"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => openActivityModal(user)}
                        className="btn-activity"
                        title="View Activity"
                      >
                        <FaHistory />
                      </button>
                      <button 
                        onClick={() => openModal('edit', user)}
                        className="btn-edit"
                        title="Edit User"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => openModal('block', user)}
                        className={user.status === 'blocked' ? 'btn-unblock' : 'btn-block'}
                        title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                      >
                        <FaUserShield />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.id)}
                        className="btn-reset-password"
                        title="Reset Password"
                      >
                        <FaKey />
                      </button>
                      <button 
                        onClick={() => handleResetPin(user.id)}
                        className="btn-reset-pin"
                        title="Reset PIN"
                      >
                        <FaLock />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBalanceModal(true);
                        }}
                        className="btn-balance"
                        title="Kelola Saldo"
                      >
                        <FaMoneyBillWave />
                      </button>
                    </div>
                  </td>
                </td> 
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Balance Management Modal - Moved outside the table */}
      {showBalanceModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div className="modal balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kelola Saldo - {selectedUser?.username}</h3>
              <button onClick={() => setShowBalanceModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="current-balance">
                <p>Saldo Saat Ini: <strong>Rp {selectedUser?.balance?.toLocaleString() || '0'}</strong></p>
              </div>
              <form onSubmit={handleUpdateBalance}>
                <div className="form-group">
                  <label>Tipe Transaksi:</label>
                  <select
                    value={balanceFormData.type}
                    onChange={(e) => setBalanceFormData({...balanceFormData, type: e.target.value})}
                    required
                  >
                    <option value="add">Tambah Saldo</option>
                    <option value="subtract">Kurangi Saldo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah:</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={balanceFormData.amount}
                    onChange={(e) => setBalanceFormData({...balanceFormData, amount: e.target.value})}
                    placeholder="Masukkan jumlah"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Keterangan:</label>
                  <textarea
                    value={balanceFormData.description}
                    onChange={(e) => setBalanceFormData({...balanceFormData, description: e.target.value})}
                    placeholder="Keterangan transaksi (opsional)"
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowBalanceModal(false)} className="btn-cancel">
                    Batal
                  </button>
                  <button type="submit" className="btn-save">
                    {balanceFormData.type === 'add' ? 'Tambah' : 'Kurangi'} Saldo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button 
          onClick={() => setPagination(prev => ({ ...prev, currentPage: (prev?.currentPage || 1) - 1 }))}
          disabled={(pagination?.currentPage || 1) === 1}
        >
          Previous
        </button>
        <span>Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}</span>
        <button 
          onClick={() => setPagination(prev => ({ ...prev, currentPage: (prev?.currentPage || 1) + 1 }))}
          disabled={(pagination?.currentPage || 1) === (pagination?.totalPages || 1)}
        >
          Next
        </button>
      </div>

      {/* View Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details - {selectedUser?.username}</h3>
              <button onClick={() => setShowViewModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="detail-row">
                  <label>ID:</label>
                  <span>{selectedUser?.id}</span>
                </div>
                <div className="detail-row">
                  <label>Username:</label>
                  <span>{selectedUser?.username}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedUser?.email}</span>
                </div>
                <div className="detail-row">
                  <label>Role:</label>
                  <span className={`role-badge ${selectedUser?.role_name}`}>
                    {selectedUser?.role_name}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Balance:</label>
                  <span>Rp {selectedUser?.balance?.toLocaleString() || '0'}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status ${selectedUser?.status}`}>
                    {selectedUser?.status}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Joined:</label>
                  <span>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Last Login:</label>
                  <span>{selectedUser?.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User - {selectedUser?.username}</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateUser}>
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    value={editFormData.username || ''}
                    onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role:</label>
                  <select
                    value={editFormData.role_id || ''}
                    onChange={(e) => setEditFormData({...editFormData, role_id: e.target.value})}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah User Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    value={addFormData.username}
                    onChange={(e) => setAddFormData({...addFormData, username: e.target.value})}
                    placeholder="Masukkan username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    placeholder="Masukkan email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    placeholder="Masukkan password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role:</label>
                  <select
                    value={addFormData.role_id}
                    onChange={(e) => setAddFormData({...addFormData, role_id: e.target.value})}
                    required
                  >
                    <option value="">Pilih Role</option>
                    {(roles || []).filter(role => role.name !== 'admin').map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={addFormData.status}
                    onChange={(e) => setAddFormData({...addFormData, status: e.target.value})}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Saldo Awal:</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={addFormData.balance}
                    onChange={(e) => setAddFormData({...addFormData, balance: parseFloat(e.target.value) || 0})}
                    placeholder="Masukkan saldo awal (opsional)"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                    Batal
                  </button>
                  <button type="submit" className="btn-save">
                    Tambah User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Activity Log - {selectedUser?.username}</h3>
              <button onClick={() => setShowActivityModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="activity-logs">
                {Array.isArray(activityLogs) && activityLogs.length > 0 ? (
                  activityLogs.map(log => (
                    <div key={log.id} className="activity-item">
                      <div className="activity-action">{log.action}</div>
                      <div className="activity-admin">by {log.admin_username}</div>
                      <div className="activity-date">{new Date(log.created_at).toLocaleString()}</div>
                      {log.details && (
                        <div className="activity-details">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-activity">No activity logs found for this user.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

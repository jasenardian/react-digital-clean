import React from 'react';
import { FaBars, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';

const AdminHeader = ({ onToggleSidebar, onLogout }) => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <FaBars />
        </button>
        <h1>Dashboard Admin</h1>
      </div>
      
      <div className="header-right">
        <button className="header-btn">
          <FaBell />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="admin-profile">
          <FaUser className="profile-icon" />
          <span className="admin-name">{adminUser.username || 'Admin'}</span>
        </div>
        
        <button className="header-btn logout-btn" onClick={onLogout}>
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
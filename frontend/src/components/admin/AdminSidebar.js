import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBoxes, 
  FaTags, 
  FaShoppingCart, 
  FaFileAlt,
  FaCog,
  FaChevronDown,
  FaChevronRight,
  FaImage,
  FaQuestionCircle,
  FaEdit,
  FaBullhorn,
  FaStar // Tambahkan icon untuk reviews
} from 'react-icons/fa';

const AdminSidebar = ({ isOpen, onClose, isMobile }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/products', icon: FaBoxes, label: 'Products' },
    { path: '/admin/categories', icon: FaTags, label: 'Categories' },
    { path: '/admin/transactions', icon: FaShoppingCart, label: 'Transactions' },
    { path: '/admin/reviews', icon: FaStar, label: 'Product Reviews' }, // Menu baru
    {
      key: 'content',
      icon: FaFileAlt,
      label: 'Content Management',
      submenu: [
        { path: '/admin/content', icon: FaFileAlt, label: 'CMS Dashboard' },
        { path: '/admin/content/banners', icon: FaImage, label: 'Banner Management' },
        { path: '/admin/content/faqs', icon: FaQuestionCircle, label: 'FAQ Management' },
        { path: '/admin/content/editor', icon: FaEdit, label: 'Content Editor' },
        { path: '/admin/promotions', icon: FaBullhorn, label: 'Promotions' }
      ]
    },
    { path: '/admin/settings', icon: FaCog, label: 'Settings' }
  ];

  const renderMenuItem = (item) => {
    if (item.submenu) {
      const isExpanded = expandedMenus[item.key];
      const IconComponent = item.icon;
      
      return (
        <div key={item.key}>
          <div 
            className="sidebar-link submenu-toggle"
            onClick={() => toggleMenu(item.key)}
          >
            <IconComponent className="sidebar-icon" />
            <span className="sidebar-label">{item.label}</span>
            {isExpanded ? 
              <FaChevronDown className="submenu-arrow" /> : 
              <FaChevronRight className="submenu-arrow" />
            }
          </div>
          
          {isExpanded && (
            <div className="submenu">
              {item.submenu.map((subItem) => {
                const SubIconComponent = subItem.icon;
                return (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    className={({ isActive }) => 
                      `sidebar-link submenu-item ${isActive ? 'active' : ''}`
                    }
                    onClick={handleLinkClick}
                  >
                    <SubIconComponent className="sidebar-icon" />
                    <span className="sidebar-label">{subItem.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const IconComponent = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => 
          `sidebar-link ${isActive ? 'active' : ''}`
        }
        onClick={handleLinkClick}
      >
        <IconComponent className="sidebar-icon" />
        <span className="sidebar-label">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(renderMenuItem)}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
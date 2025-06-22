import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaImage, 
  FaQuestionCircle, 
  FaFileAlt, 
  FaBullhorn,
  FaChartLine,
  FaCog
} from 'react-icons/fa';
import '../../styles/CMSManagement.css';

const CMSManagement = () => {
  const cmsModules = [
    {
      title: 'Banner Management',
      description: 'Kelola banner promosi dan iklan di website',
      icon: FaImage,
      path: '/admin/content/banners',
      color: 'primary',
      stats: 'Aktif: 5 Banner'
    },
    {
      title: 'FAQ Management', 
      description: 'Kelola pertanyaan yang sering ditanyakan',
      icon: FaQuestionCircle,
      path: '/admin/content/faqs',
      color: 'success',
      stats: 'Total: 12 FAQ'
    },
    {
      title: 'Content Editor',
      description: 'Edit konten statis seperti Terms & Conditions',
      icon: FaFileAlt,
      path: '/admin/content/editor',
      color: 'info',
      stats: '5 Halaman Konten'
    },
    {
      title: 'Promotional Content',
      description: 'Kelola konten promosi dan penawaran khusus',
      icon: FaBullhorn,
      path: '/admin/promotions',
      color: 'warning',
      stats: 'Aktif: 3 Promo'
    }
  ];

  return (
    <div className="cms-container">
      <div className="cms-header">
        <h1 className="cms-title">Content Management System</h1>
        <p className="cms-subtitle">Kelola semua konten website dari satu tempat</p>
      </div>

      <div className="cms-modules">
        {cmsModules.map((module, index) => {
          const IconComponent = module.icon;
          return (
            <div key={index} className="cms-module-card">
              <div className="cms-module-header">
                <div className={`cms-module-icon ${module.color}`}>
                  <IconComponent />
                </div>
                <div>
                  <h3 className="cms-module-title">{module.title}</h3>
                  <p className="cms-module-stats">{module.stats}</p>
                </div>
              </div>
              
              <p className="cms-module-description">
                {module.description}
              </p>
              
              <Link 
                to={module.path} 
                className={`cms-module-button ${module.color}`}
              >
                Kelola {module.title.split(' ')[0]}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <div className="cms-stats">
        <h5 className="cms-stats-header">Statistik Konten</h5>
        <div className="cms-stats-grid">
          <div className="cms-stat-item">
            <h3 className="cms-stat-number primary">5</h3>
            <p className="cms-stat-label">Banner Aktif</p>
          </div>
          <div className="cms-stat-item">
            <h3 className="cms-stat-number success">12</h3>
            <p className="cms-stat-label">FAQ Tersedia</p>
          </div>
          <div className="cms-stat-item">
            <h3 className="cms-stat-number info">5</h3>
            <p className="cms-stat-label">Halaman Konten</p>
          </div>
          <div className="cms-stat-item">
            <h3 className="cms-stat-number warning">3</h3>
            <p className="cms-stat-label">Promo Aktif</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="cms-activity">
        <h5 className="cms-activity-header">Aktivitas Terbaru</h5>
        <div className="cms-activity-list">
          <div className="cms-activity-item">
            <div className="cms-activity-icon primary">
              <FaImage />
            </div>
            <div className="cms-activity-content">
              <h6 className="cms-activity-title">Banner "Promo Akhir Tahun" diperbarui</h6>
              <p className="cms-activity-time">2 jam yang lalu</p>
            </div>
            <span className="cms-activity-badge primary">Banner</span>
          </div>
          
          <div className="cms-activity-item">
            <div className="cms-activity-icon success">
              <FaQuestionCircle />
            </div>
            <div className="cms-activity-content">
              <h6 className="cms-activity-title">FAQ baru ditambahkan: "Cara top up saldo"</h6>
              <p className="cms-activity-time">5 jam yang lalu</p>
            </div>
            <span className="cms-activity-badge success">FAQ</span>
          </div>
          
          <div className="cms-activity-item">
            <div className="cms-activity-icon info">
              <FaFileAlt />
            </div>
            <div className="cms-activity-content">
              <h6 className="cms-activity-title">Syarat & Ketentuan diperbarui</h6>
              <p className="cms-activity-time">1 hari yang lalu</p>
            </div>
            <span className="cms-activity-badge info">Content</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSManagement;
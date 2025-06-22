import React from 'react';
import { FaCheckCircle, FaClock, FaShieldAlt, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      {/* Header */}
      <div className="about-header">
        <h1>Tentang Catalogue Digital</h1>
      </div>

      {/* Siapa Kami Section */}
      <section className="about-section">
        <h2>Siapa Kami?</h2>
        <p>
          Catalogue Digital adalah platform terpercaya yang menyediakan berbagai layanan digital dengan fokus pada kualitas, 
          kecepatan, dan kepuasan pelanggan. Kami telah melayani ribuan pelanggan di seluruh Indonesia sejak tahun 2020.
        </p>
      </section>

      {/* Visi & Misi Section */}
      <section className="vision-mission-section">
        <h2>Visi & Misi</h2>
        <div className="vision-mission-grid">
          <div className="vision-box">
            <h3>Visi</h3>
            <p>
              Menjadi platform digital terdepan di Indonesia yang memberikan solusi terbaik untuk kebutuhan digital masyarakat modern.
            </p>
          </div>
          
          <div className="mission-box">
            <h3>Misi</h3>
            <ul>
              <li><FaCheckCircle className="check-icon" /> Memberikan layanan berkualitas tinggi</li>
              <li><FaCheckCircle className="check-icon" /> Menjaga kepercayaan pelanggan</li>
              <li><FaCheckCircle className="check-icon" /> Inovasi berkelanjutan</li>
              <li><FaCheckCircle className="check-icon" /> Harga yang kompetitif</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Layanan Kami Section */}
      <section className="services-section">
        <h2>Layanan Kami</h2>
        <div className="services-grid">
          <div className="service-item">
            <div className="service-icon">
              👥
            </div>
            <h3>Social Media</h3>
            <p>Followers, Likes, Views</p>
          </div>
          
          <div className="service-item">
            <div className="service-icon">
              💻
            </div>
            <h3>Jasa Digital</h3>
            <p>Design, Development</p>
          </div>
          
          <div className="service-item">
            <div className="service-icon">
              🛒
            </div>
            <h3>Software</h3>
            <p>Lisensi Premium</p>
          </div>
          
          <div className="service-item">
            <div className="service-icon">
              🎮
            </div>
            <h3>Gaming</h3>
            <p>Top Up Game</p>
          </div>
        </div>
      </section>

      {/* Mengapa Memilih Kami Section */}
      <section className="why-choose-section">
        <h2>Mengapa Memilih Kami?</h2>
        <div className="reasons-list">
          <div className="reason-item">
            <div className="reason-icon">
              <FaCheckCircle />
            </div>
            <div className="reason-content">
              <h3>Proses Cepat</h3>
              <p>Pesanan diproses dalam hitungan menit, tidak perlu menunggu lama</p>
            </div>
          </div>
          
          <div className="reason-item">
            <div className="reason-icon">
              <FaCheckCircle />
            </div>
            <div className="reason-content">
              <h3>Harga Terjangkau</h3>
              <p>Harga kompetitif tanpa mengurangi kualitas layanan</p>
            </div>
          </div>
          
          <div className="reason-item">
            <div className="reason-icon">
              <FaCheckCircle />
            </div>
            <div className="reason-content">
              <h3>Customer Service 24/7</h3>
              <p>Tim support siap membantu kapan saja Anda membutuhkan</p>
            </div>
          </div>
          
          <div className="reason-item">
            <div className="reason-icon">
              <FaCheckCircle />
            </div>
            <div className="reason-content">
              <h3>Garansi Kualitas</h3>
              <p>Jaminan kualitas dan garansi refill untuk produk tertentu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontak Kami Section - Versi Responsif */}
      <section className="contact-section">
        <h2>Kontak Kami</h2>
        <div className="contact-grid">
          <div className="contact-item">
            <div className="contact-icon">
              <FaWhatsapp />
            </div>
            <h3>Customer Service</h3>
            <div className="contact-details">
              <p className="contact-number">+62 857-8380-6901</p>
              <p className="contact-hours">Jam Operasional: 24/7</p>
            </div>
          </div>
          
          <div className="contact-item">
            <div className="contact-icon">
              <FaEnvelope />
            </div>
            <h3>Email</h3>
            <div className="contact-details">
              <p className="contact-email">support@cataloguedigital.com</p>
              <p className="contact-email">info@cataloguedigital.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
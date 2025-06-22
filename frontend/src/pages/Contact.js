import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaTelegram, FaInstagram, FaFacebook, FaClock, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import '../styles/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulasi pengiriman form
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      setTimeout(() => {
        setSubmitStatus('');
      }, 3000);
    }, 1000);
  };

  const openWhatsApp = () => {
    const phoneNumber = '6281234567890'; // Ganti dengan nomor WhatsApp Anda
    const message = 'Halo! Saya ingin bertanya tentang layanan Catalogue Digital.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="contact-container">
      {/* Header */}
      <div className="contact-header">
        <h1>Hubungi Kami</h1>
        <p>Kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami!</p>
      </div>

      <div className="contact-content">
        {/* Contact Info */}
        <div className="contact-info">
          <h2>Informasi Kontak</h2>
          
          <div className="contact-item">
            <div className="contact-icon">
              <FaPhone />
            </div>
            <div className="contact-details">
              <h3>Telepon</h3>
              <p>+62 812-3456-7890</p>
              <p>+62 821-9876-5432</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <FaEnvelope />
            </div>
            <div className="contact-details">
              <h3>Email</h3>
              <p>info@cataloguedigital.com</p>
              <p>support@cataloguedigital.com</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <FaMapMarkerAlt />
            </div>
            <div className="contact-details">
              <h3>Alamat</h3>
              <p>Jl. Digital Raya No. 123</p>
              <p>Jakarta Selatan, DKI Jakarta 12345</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <FaClock />
            </div>
            <div className="contact-details">
              <h3>Jam Operasional</h3>
              <p>Senin - Jumat: 08:00 - 22:00</p>
              <p>Sabtu - Minggu: 09:00 - 21:00</p>
            </div>
          </div>

          {/* Social Media */}
          <div className="social-media">
            <h3>Media Sosial</h3>
            <div className="social-links">
              <button className="social-btn whatsapp" onClick={openWhatsApp}>
                <FaWhatsapp />
                <span>WhatsApp</span>
              </button>
              <a href="https://t.me/cataloguedigital" target="_blank" rel="noopener noreferrer" className="social-btn telegram">
                <FaTelegram />
                <span>Telegram</span>
              </a>
              <a href="https://instagram.com/cataloguedigital" target="_blank" rel="noopener noreferrer" className="social-btn instagram">
                <FaInstagram />
                <span>Instagram</span>
              </a>
              <a href="https://facebook.com/cataloguedigital" target="_blank" rel="noopener noreferrer" className="social-btn facebook">
                <FaFacebook />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form">
          <h2>Kirim Pesan</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nama Lengkap</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Masukkan email Anda"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subjek</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="Subjek pesan Anda"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Pesan</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows="5"
                placeholder="Tulis pesan Anda di sini..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Kirim Pesan
                </>
              )}
            </button>

            {submitStatus === 'success' && (
              <div className="success-message">
                <FaCheckCircle />
                Pesan berhasil dikirim! Kami akan segera merespons.
              </div>
            )}
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="contact-faq">
        <h2>Pertanyaan yang Sering Diajukan</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Bagaimana cara melakukan top up?</h3>
            <p>Anda dapat melakukan top up melalui halaman Profile dengan berbagai metode pembayaran yang tersedia.</p>
          </div>
          <div className="faq-item">
            <h3>Berapa lama proses transaksi?</h3>
            <p>Proses transaksi biasanya berlangsung 1-5 menit setelah pembayaran berhasil dikonfirmasi.</p>
          </div>
          <div className="faq-item">
            <h3>Apakah ada biaya admin?</h3>
            <p>Tidak ada biaya admin untuk transaksi. Harga yang tertera sudah final.</p>
          </div>
          <div className="faq-item">
            <h3>Bagaimana jika transaksi gagal?</h3>
            <p>Jika transaksi gagal, saldo akan otomatis dikembalikan ke akun Anda dalam 1x24 jam.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
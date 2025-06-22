import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaSave, FaKey, FaLink, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    tripay_api_key: '',
    tripay_private_key: '',
    tripay_merchant_code: '',
    tripay_callback_url: '',
    tripay_environment: 'sandbox' // sandbox atau production
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/settings/tripay', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('http://localhost:5000/api/admin/settings/tripay', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Pengaturan Tripay berhasil disimpan!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan. Silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('http://localhost:5000/api/admin/settings/tripay/test', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Koneksi ke Tripay berhasil!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Koneksi ke Tripay gagal. Periksa konfigurasi Anda.' });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1><FaCog /> Pengaturan Sistem</h1>
        <p>Konfigurasi integrasi pembayaran dan pengaturan sistem</p>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="card-header">
            <h2>Konfigurasi Tripay</h2>
            <p>Pengaturan untuk integrasi gateway pembayaran Tripay</p>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>Environment</label>
              <select
                name="tripay_environment"
                value={settings.tripay_environment}
                onChange={handleInputChange}
                required
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Merchant Code</label>
              <input
                type="text"
                name="tripay_merchant_code"
                value={settings.tripay_merchant_code}
                onChange={handleInputChange}
                placeholder="Masukkan Merchant Code Tripay"
                required
              />
            </div>

            <div className="form-group">
              <label>API Key</label>
              <div className="input-with-icon">
                <FaKey className="input-icon" />
                <input
                  type="text"
                  name="tripay_api_key"
                  value={settings.tripay_api_key}
                  onChange={handleInputChange}
                  placeholder="Masukkan API Key Tripay"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Private Key</label>
              <div className="input-with-icon">
                <FaKey className="input-icon" />
                <input
                  type={showPrivateKey ? "text" : "password"}
                  name="tripay_private_key"
                  value={settings.tripay_private_key}
                  onChange={handleInputChange}
                  placeholder="Masukkan Private Key Tripay"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Callback URL</label>
              <div className="input-with-icon">
                <FaLink className="input-icon" />
                <input
                  type="url"
                  name="tripay_callback_url"
                  value={settings.tripay_callback_url}
                  onChange={handleInputChange}
                  placeholder="https://yourdomain.com/api/topup/callback"
                  required
                />
              </div>
              <small className="form-help">
                URL ini akan digunakan Tripay untuk mengirim notifikasi status pembayaran
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={testConnection}
                className="btn btn-test"
                disabled={saving}
              >
                Test Koneksi
              </button>
              <button
                type="submit"
                className="btn btn-save"
                disabled={saving}
              >
                <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>

        <div className="info-card">
          <h3>Informasi Integrasi</h3>
          <div className="info-item">
            <strong>Dokumentasi Tripay:</strong>
            <a href="https://tripay.co.id/developer" target="_blank" rel="noopener noreferrer">
              https://tripay.co.id/developer
            </a>
          </div>
          <div className="info-item">
            <strong>Callback URL yang harus didaftarkan di Tripay:</strong>
            <code>{settings.tripay_callback_url || 'Belum dikonfigurasi'}</code>
          </div>
          <div className="info-item">
            <strong>Environment saat ini:</strong>
            <span className={`env-badge ${settings.tripay_environment}`}>
              {settings.tripay_environment === 'sandbox' ? 'Sandbox (Testing)' : 'Production (Live)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
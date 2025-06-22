import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';
// Gunakan logo dari React sebagai pengganti sementara
import catalogueLogo from '../logo.svg';

const Register = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePinChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      // Auto focus to next input
      if (value && index < 3) {
        document.getElementById(`pin-${index + 1}`).focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pinValue = pin.join('');
    
    if (!username) {
      setError('Username harus diisi');
      return;
    }
    
    if (pinValue.length !== 4) {
      setError('PIN harus 4 digit');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        pin: pinValue
      });
      
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src={catalogueLogo} alt="Catalogue Digital" className="auth-logo" />
        </div>
        <h2>Catalogue Digital</h2>
        <p className="tagline">Proses Cepat · Harga Murah · Pelayanan Ramah</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>PIN (4 Digit)</label>
            <div className="pin-container">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                />
              ))}
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">Daftar</button>
        </form>
        
        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
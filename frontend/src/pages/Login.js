import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/Auth.css';
import catalogueLogo from '../logo.svg';

const Login = () => {
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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        pin: pinValue
      });
      
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      console.log('Token saved:', localStorage.getItem('token'));
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Login gagal');
    }
  };

  // Handler untuk Google Login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/google-login', {
        credential: credentialResponse.credential
      });
      
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      setError('Login dengan Google gagal');
    }
  };

  const handleGoogleError = () => {
    setError('Login dengan Google dibatalkan');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src={catalogueLogo} alt="Catalogue Digital" className="auth-logo" />
        </div>
        <h2>Catalogue Digital</h2>
        <p className="tagline">Proses Cepat · Harga Murah · Pelayanan Ramah</p>
        
        {/* Google Login Button */}
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        </div>
        
        <div className="divider">
          <span>atau</span>
        </div>
        
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
          
          <button type="submit" className="login-button">Login</button>
        </form>
        
        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
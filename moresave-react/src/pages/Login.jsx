import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (['admin', 'manager', 'loan_officer', 'cashier'].includes(data.user.role)) {
          navigate('/admin');
        } else {
          navigate('/member');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4E3526 0%, #8B6B4A 100%)',
      padding: '20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '440px',
        borderRadius: '16px',
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{
          backgroundColor: 'var(--dark-brown)',
          padding: '30px 20px',
          textAlign: 'center',
          color: 'white'
        }}>
          <img
            src="/icon-512.png.png"
            alt="Moresave SACCO Logo"
            style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', marginBottom: '12px' }}
          />
          <h1 style={{ color: 'white', fontSize: '26px', marginBottom: '6px', margin: '0 0 6px' }}>MORESAVE SACCO</h1>
          <p style={{ opacity: 0.75, fontStyle: 'italic', fontSize: '12px', margin: 0 }}>Savings & Credit Cooperative — Mubende, Uganda</p>
        </div>

        <form onSubmit={handleLogin} style={{ padding: '40px 30px', backgroundColor: 'var(--warm-white)' }}>
          <h2 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: 'bold' }}>Sign In to Your Account</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Username / Member Number</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. admin or MRS0001"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--accent-red)',
              marginBottom: '15px',
              fontSize: '13px',
              padding: '10px',
              backgroundColor: '#fee2e2',
              borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '15px', fontSize: '15px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/register" style={{ fontSize: '13px', color: 'var(--mid-brown)', fontWeight: '600' }}>New member? Register here</Link>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default Login;

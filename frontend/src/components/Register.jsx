import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Mail, Key, User } from 'lucide-react';

const Register = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '40px' }}>🤝</span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '12px', fontFamily: 'var(--font-heading)' }}>
            Create Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Join Scheme Sathi to track scheme applications</p>
        </div>

        {error && (
          <div style={{ padding: '10px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Full Name</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <User size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                style={{ border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Email Address</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Password</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <Key size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={{ border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ borderRadius: '8px', height: '44px', marginTop: '8px' }}>
            <UserPlus size={16} />
            <span>{loading ? 'Signing up...' : t('register')}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')}
            style={{ color: 'var(--accent-color)', fontWeight: 600 }}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default Register;

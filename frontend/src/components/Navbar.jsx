import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Globe, LogIn, LogOut, User } from 'lucide-react';

const Navbar = ({ onToggleSidebar, onNavigate, activeView }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '20px',
      borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)',
      boxShadow: 'var(--shadow-sm)',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="no-print" onClick={onToggleSidebar} style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'none', // Shown on mobile via CSS media query override if needed
        }} id="mobile-sidebar-toggle">
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <span style={{ fontSize: '28px' }}>🤝</span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '22px',
            background: 'linear-gradient(135deg, var(--accent-color), #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            {t('appName')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          <Globe size={18} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="English">English</option>
            <option value="Telugu">తెలుగు (Telugu)</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Authentication Indicators */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="no-print">
            <button 
              onClick={() => onNavigate('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-color)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <User size={16} />
              <span>{user.name.split(' ')[0]}</span>
            </button>
            <button 
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: '50%' }}
              title={t('logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('login')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', borderRadius: '20px' }}
          >
            <LogIn size={16} />
            <span>{t('login')}</span>
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-sidebar-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;

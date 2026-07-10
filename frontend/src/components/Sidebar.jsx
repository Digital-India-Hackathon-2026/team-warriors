import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  GitCompare, 
  Scan, 
  MapPin, 
  User, 
  BarChart3, 
  MessageSquare, 
  LogOut,
  X,
  Phone
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, onNavigate, activeView }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'call-agent', label: 'Call Helpline', icon: Phone },
    { id: 'compare', label: t('compare'), icon: GitCompare },
    { id: 'ocr', label: t('ocrReader'), icon: Scan },
    { id: 'offices', label: t('officeLocator'), icon: MapPin },
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'feedback', label: t('feedback'), icon: MessageSquare }
  ];

  // If user is admin (or for hackathon demo we can show it to everyone, or if logged in), add Admin Dashboard
  // Let's show it to everyone for demo completeness.
  menuItems.push({ id: 'admin', label: t('admin'), icon: BarChart3 });

  return (
    <aside 
      className={`glass-panel no-print ${isOpen ? 'open' : ''}`}
      style={{
        width: '260px',
        height: 'calc(100vh - 40px)',
        position: 'fixed',
        left: '20px',
        top: '20px',
        bottom: '20px',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        borderRadius: 'var(--border-radius-md)',
        transition: 'transform var(--transition-normal), left var(--transition-normal)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        overflowY: 'auto'
      }}
    >
      {/* Mobile Close Button */}
      <div style={{ display: 'none', justifyContent: 'flex-end', marginBottom: '16px' }} className="mobile-close">
        <button onClick={onClose} style={{ padding: '8px', color: 'var(--text-primary)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Mini Profile Summary */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingBottom: '24px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '12px',
          fontWeight: 'bold',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {user ? user.name[0].toUpperCase() : '?'}
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {user ? user.name : 'Guest User'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {user ? user.email : 'Login for recommendations'}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-sm)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                textAlign: 'left',
                width: '100%',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout / Login Footer */}
      {user && (
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--danger)',
            textAlign: 'left',
            width: '100%',
            fontWeight: 500,
            fontSize: '14px',
            marginTop: 'auto',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px'
          }}
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </button>
      )}

      <style>{`
        @media (max-width: 1024px) {
          aside {
            transform: translateX(-300px);
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: var(--shadow-lg) !important;
          }
          aside.open {
            transform: translateX(0);
          }
          .mobile-close {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;

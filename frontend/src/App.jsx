import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SchemeDetails from './components/SchemeDetails';
import CompareSchemes from './components/CompareSchemes';
import OCRReader from './components/OCRReader';
import OfficeLocator from './components/OfficeLocator';
import ProfileSetup from './components/ProfileSetup';
import FeedbackForm from './components/FeedbackForm';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';
import ChatBot from './components/ChatBot';
import VoiceOnlyMode from './components/VoiceOnlyMode';
import CallAgent from './components/CallAgent';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Mic } from 'lucide-react';

const App = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  const [comparedIds, setComparedIds] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVoiceOnly, setShowVoiceOnly] = useState(false);

  const handleSelectScheme = (schemeId) => {
    setSelectedSchemeId(schemeId);
    setActiveView('dashboard'); // detail page is shown inside dashboard view
  };

  const handleCompareChange = (schemeId) => {
    setComparedIds(prev => {
      if (prev.includes(schemeId)) {
        return prev.filter(id => id !== schemeId);
      } else {
        if (prev.length >= 3) {
          alert('You can compare a maximum of 3 schemes.');
          return prev;
        }
        return [...prev, schemeId];
      }
    });
  };

  const handleRemoveCompare = (schemeId) => {
    setComparedIds(prev => prev.filter(id => id !== schemeId));
  };

  const handleNavigate = (view) => {
    setActiveView(view);
    if (view !== 'dashboard') {
      setSelectedSchemeId(null);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        if (selectedSchemeId) {
          return (
            <SchemeDetails 
              schemeId={selectedSchemeId} 
              onBack={() => setSelectedSchemeId(null)} 
            />
          );
        }
        return (
          <Dashboard 
            onSelectScheme={handleSelectScheme}
            onCompareChange={handleCompareChange}
            comparedIds={comparedIds}
            onNavigate={handleNavigate}
          />
        );
      case 'compare':
        return (
          <CompareSchemes 
            comparedIds={comparedIds}
            onRemoveCompare={handleRemoveCompare}
            onSelectScheme={handleSelectScheme}
          />
        );
      case 'ocr':
        return <OCRReader onSelectScheme={handleSelectScheme} />;
      case 'offices':
        return <OfficeLocator />;
      case 'profile':
        return <ProfileSetup />;
      case 'feedback':
        return <FeedbackForm />;
      case 'admin':
        return <AdminPanel />;
      case 'call-agent':
        return <CallAgent />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      default:
        return <Dashboard onSelectScheme={handleSelectScheme} onCompareChange={handleCompareChange} comparedIds={comparedIds} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar - left navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      {/* Main Container - header and active view content */}
      <div className="main-content">
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onNavigate={handleNavigate}
          activeView={activeView}
        />
        
        {/* Floating Voice Only Mode toggle */}
        <button 
          onClick={() => setShowVoiceOnly(true)}
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--success)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg), 0 0 20px rgba(16, 185, 129, 0.2)',
            zIndex: 999
          }}
          className="btn no-print"
          title="Launch Fullscreen Voice Overlay Mode"
        >
          <Mic size={26} />
        </button>

        {/* View renderer */}
        <main style={{ minHeight: 'calc(100vh - 140px)' }}>
          {renderActiveView()}
        </main>
      </div>

      {/* AI Floating Chat widget */}
      <ChatBot />

      {/* Fullscreen Voice Mode overlay */}
      {showVoiceOnly && (
        <VoiceOnlyMode 
          onClose={() => setShowVoiceOnly(false)} 
          onSelectScheme={handleSelectScheme}
        />
      )}
    </div>
  );
};

export default App;

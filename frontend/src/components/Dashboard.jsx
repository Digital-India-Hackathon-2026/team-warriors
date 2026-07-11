import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  Sparkles, 
  Heart, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  TrendingUp,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const Dashboard = ({ onSelectScheme, onCompareChange, comparedIds, onNavigate }) => {
  const { user, token, toggleFavorite } = useAuth();
  const { language, t } = useLanguage();

  const [schemes, setSchemes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'favorites', 'recent'
  const [isSearching, setIsSearching] = useState(false);

  // Fetch schemes
  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schemes`);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
        
        // If user is logged in, fetch recommendations
        if (user && user.profile && user.profile.age) {
          fetchRecommendations(user.profile);
        }
      }
    } catch (err) {
      console.error('Error fetching schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (profile) => {
    try {
      const res = await fetch(`${API_BASE}/schemes/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.filter(s => s.eligibilityStatus.eligible).slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [user]);

  // Handle Natural Language search using Gemini Backend
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchSchemes();
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/schemes/search?q=${encodeURIComponent(searchQuery)}&lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getSchemeName = (scheme) => {
    if (language === 'Telugu' && scheme.name_te) return scheme.name_te;
    if (language === 'Hindi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name;
  };

  const getSchemeDesc = (scheme) => {
    if (language === 'Telugu' && scheme.description_te) return scheme.description_te;
    if (language === 'Hindi' && scheme.description_hi) return scheme.description_hi;
    return scheme.description;
  };

  // Filter categories
  const categories = ['All', 'Agriculture', 'Healthcare', 'Finance', 'Housing', 'Women & Child'];
  
  const filteredSchemes = schemes.filter(s => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  // Filter schemes based on active tabs
  const tabFilteredSchemes = filteredSchemes.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'favorites') {
      return user && user.favorites && user.favorites.includes(s.id);
    }
    if (activeTab === 'recent') {
      return user && user.recentlyViewed && user.recentlyViewed.includes(s.id);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Welcoming Hero Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        borderRadius: 'var(--border-radius-md)',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: 600 }}>
          <Sparkles size={18} />
          <span>AI-Powered Portal</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {language === 'Telugu' ? 'ప్రభుత్వ పథకాల సమాచార సారథి' : language === 'Hindi' ? 'सरकारी योजनाओं के लिए आपका मार्गदर्शक' : 'Your Personalized Government Schemes Guide'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', fontSize: '15px' }}>
          {language === 'Telugu' 
            ? 'సరళమైన తెలుగు లేదా ఇంగ్లీషులో ప్రశ్నలు అడగండి, మీ వయస్సు, రాష్ట్రం మరియు ఆదాయ అర్హతలను తనిఖీ చేసుకోండి.' 
            : language === 'Hindi'
            ? 'सरल भाषा में प्रश्न पूछें, अपनी आयु, राज्य और आय की पात्रता की जांच करें।'
            : 'Ask queries in natural language, upload identity documents to check eligibility, and get direct assistance in your preferred language.'}
        </p>

        {/* Profile incomplete warning */}
        {user && (!user.profile || !user.profile.age) && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--warning-light)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--warning)' }} />
              <span>{language === 'Telugu' ? 'వ్యక్తిగతీకరించిన సిఫార్సుల కోసం దయచేసి మీ ప్రొఫైల్ సెటప్ పూర్తి చేయండి.' : 'Complete your profile to unlock personalized AI scheme recommendations.'}</span>
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('profile')} style={{ padding: '6px 12px', fontSize: '12px' }}>
              {t('profile')}
            </button>
          </div>
        )}
      </div>

      {/* 2. Interactive AI Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '4px 16px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}>
          <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
          <input 
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              padding: '12px 0',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          {isSearching && (
            <div style={{ position: 'absolute', right: '16px' }} className="spinner"></div>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--border-radius-md)' }}>
          <Sparkles size={16} />
          <span>AI Search</span>
        </button>
      </form>

      {/* 3. Recommended Section (Only if eligible items exist) */}
      {user && recommendations.length > 0 && searchQuery === '' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
            <span>{language === 'Telugu' ? 'మీకు సరిపోయే పథకాలు (AI సిఫార్సులు)' : 'Personalized AI Matches'}</span>
          </h2>
          <div className="grid-3">
            {recommendations.map(scheme => (
              <div 
                key={scheme.id} 
                className="card"
                onClick={() => onSelectScheme(scheme.id)}
                style={{
                  border: `1.5px solid var(--success)`,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(16, 185, 129, 0.02) 100%)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'var(--success-light)',
                    color: 'var(--success)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    100% Eligible
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{scheme.category}</span>
                </div>
                <h3 style={{ fontSize: '16px', lineHeight: '1.4' }}>{getSchemeName(scheme)}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>
                  {getSchemeDesc(scheme).substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {scheme.deadline}
                  </span>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Apply Now <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Navigation and Category Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '10px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Tabs: All / Favorites / Recent */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={() => setActiveTab('all')}
            style={{
              paddingBottom: '8px',
              borderBottom: activeTab === 'all' ? '2.5px solid var(--accent-color)' : 'none',
              color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'all' ? '600' : '500',
              fontSize: '15px'
            }}
          >
            All Schemes
          </button>
          {user && (
            <>
              <button 
                onClick={() => setActiveTab('favorites')}
                style={{
                  paddingBottom: '8px',
                  borderBottom: activeTab === 'favorites' ? '2.5px solid var(--accent-color)' : 'none',
                  color: activeTab === 'favorites' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeTab === 'favorites' ? '600' : '500',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Heart size={14} fill={activeTab === 'favorites' ? 'var(--danger)' : 'none'} style={{ color: activeTab === 'favorites' ? 'var(--danger)' : 'var(--text-tertiary)' }} />
                <span>{t('favorites')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('recent')}
                style={{
                  paddingBottom: '8px',
                  borderBottom: activeTab === 'recent' ? '2.5px solid var(--accent-color)' : 'none',
                  color: activeTab === 'recent' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeTab === 'recent' ? '600' : '500',
                  fontSize: '15px'
                }}
              >
                {t('recentlyViewed')}
              </button>
            </>
          )}
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Schemes Grid display */}
      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card skeleton-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
              <div className="skeleton skeleton-title" style={{ width: '80%' }}></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text short"></div>
            </div>
          ))}
        </div>
      ) : tabFilteredSchemes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No schemes match your criteria or search criteria.</p>
          <button className="btn btn-outline" onClick={() => { setSelectedCategory('All'); setSearchQuery(''); fetchSchemes(); }} style={{ marginTop: '16px' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {tabFilteredSchemes.map(scheme => {
            const isFav = user && user.favorites && user.favorites.includes(scheme.id);
            const isCompared = comparedIds.includes(scheme.id);
            
            return (
              <div 
                key={scheme.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative'
                }}
              >
                {/* Header elements */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {scheme.category}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Compare Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isCompared}
                        onChange={() => onCompareChange(scheme.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Compare</span>
                    </label>

                    {/* Favorite toggle star */}
                    {user && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(scheme.id);
                        }}
                        style={{ color: isFav ? 'var(--danger)' : 'var(--text-tertiary)' }}
                      >
                        <Heart size={18} fill={isFav ? 'var(--danger)' : 'none'} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scheme text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', flex: 1 }} onClick={() => onSelectScheme(scheme.id)}>
                  <h3 style={{ fontSize: '17px', lineHeight: '1.4', fontWeight: 700 }}>
                    {getSchemeName(scheme)}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {getSchemeDesc(scheme).substring(0, 120)}...
                  </p>
                </div>

                {/* Card footer details */}
                <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)'
                }}>
                  <span>Views: {scheme.popularity || 0}</span>
                  <button className="btn btn-outline" onClick={() => onSelectScheme(scheme.id)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '12px' }}>
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

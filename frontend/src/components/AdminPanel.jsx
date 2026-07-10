import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, Users, FileText, MessageSquare, Star, Search, MessageSquareCode } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const AdminPanel = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/analytics`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p>Loading analytics console...</p>
      </div>
    );
  }

  if (!stats) {
    return <p>Error loading analytics data.</p>;
  }

  // Calculate highest view count to scale CSS bars
  const maxViews = stats.schemePopularity && stats.schemePopularity.length > 0
    ? Math.max(...stats.schemePopularity.map(s => s.views))
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={24} style={{ color: 'var(--accent-color)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          System Analytics Dashboard
        </h1>
      </div>

      {/* Numerical Stats Counters Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {/* Users */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Users Registered</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
          </div>
        </div>

        {/* Schemes */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Schemes</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{stats.totalSchemes}</div>
          </div>
        </div>

        {/* Searches */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Search size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>NLP Searches</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{stats.searches}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)' }}>
            <MessageSquareCode size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>AI Chat dialogs</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{stats.chatMessages}</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .grid-2 {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          .grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Graphs and detailed metrics grid */}
      <div className="grid-2">
        {/* Popularity Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Scheme Popularity (Views)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.schemePopularity && stats.schemePopularity.map(s => {
              const percentage = ((s.views / maxViews) * 100).toFixed(0);
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                    <span>{s.name.split(' - ')[0]}</span>
                    <span>{s.views} views</span>
                  </div>
                  {/* Styled CSS Bar graph progress container */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-color)',
                      borderRadius: '5px',
                      transition: 'width 0.8s ease-out'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Recent Citizen Feedback ({stats.totalFeedback})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto' }}>
            {stats.recentFeedback && stats.recentFeedback.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No feedback submitted yet.</p>
            ) : (
              stats.recentFeedback.map((f) => (
                <div 
                  key={f.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{f.name}</span>
                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < f.rating ? 'var(--warning)' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>"{f.comment}"</p>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', alignSelf: 'flex-end' }}>
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { GitCompare, Calendar, Landmark, Check, X, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const CompareSchemes = ({ comparedIds, onRemoveCompare, onSelectScheme }) => {
  const { language, t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparedSchemes = async () => {
      if (comparedIds.length === 0) {
        setSchemes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/schemes/compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ schemeIds: comparedIds })
        });
        
        if (res.ok) {
          const data = await res.json();
          setSchemes(data);
        }
      } catch (err) {
        console.error('Error fetching compared schemes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparedSchemes();
  }, [comparedIds]);

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

  const getSchemeBenefits = (scheme) => {
    if (language === 'Telugu' && scheme.benefits_te) return scheme.benefits_te;
    if (language === 'Hindi' && scheme.benefits_hi) return scheme.benefits_hi;
    return scheme.benefits;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px auto' }}></div>
        <p>Loading comparison data...</p>
      </div>
    );
  }

  if (comparedIds.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
        <GitCompare size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', margin: '0 auto 16px auto' }} />
        <h3>No Schemes Selected</h3>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>{t('comparePlaceholder')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <GitCompare size={24} style={{ color: 'var(--accent-color)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {t('compare')}
        </h1>
      </div>

      <div className="glass-panel" style={{
        overflowX: 'auto',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px',
          minWidth: '700px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '16px 20px', width: '20%', fontWeight: 700, color: 'var(--text-tertiary)' }}>Criteria</th>
              {schemes.map(s => (
                <th key={s.id} style={{ padding: '16px 20px', width: `${80 / schemes.length}%`, verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        {s.category}
                      </span>
                      <button 
                        onClick={() => onRemoveCompare(s.id)}
                        style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, cursor: 'pointer' }} onClick={() => onSelectScheme(s.id)}>
                      {getSchemeName(s)}
                    </h3>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Description */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', color: 'var(--text-secondary)', lineHeight: 1.5, verticalAlign: 'top' }}>
                  {getSchemeDesc(s).substring(0, 160)}...
                </td>
              ))}
            </tr>

            {/* Benefits */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Benefits</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--accent-color)', lineHeight: 1.5, verticalAlign: 'top' }}>
                  {getSchemeBenefits(s)}
                </td>
              ))}
            </tr>

            {/* Age Limits */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Eligible Age Range</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  {s.eligibility.age_min === 0 ? 'Children / ' : ''}
                  {s.eligibility.age_min} to {s.eligibility.age_max || 'No limit'} years
                </td>
              ))}
            </tr>

            {/* Annual Income limits */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Annual Income</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  {s.eligibility.income_max ? `₹${s.eligibility.income_max.toLocaleString()}` : 'No Limit'}
                </td>
              ))}
            </tr>

            {/* Gender criteria */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Gender Restriction</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  {s.eligibility.gender === 'Any' ? 'Any Gender' : s.eligibility.gender}
                </td>
              ))}
            </tr>

            {/* Farmer filter */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Farmer Only</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  {s.eligibility.farmer_only ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600 }}>
                      <Check size={16} /> Yes
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>No</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Documents needed */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Documents Required</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {s.documents.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Deadline */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top', fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {s.deadline}
                  </span>
                </td>
              ))}
            </tr>

            {/* Quick Actions */}
            <tr>
              <td style={{ padding: '16px 20px' }}></td>
              {schemes.map(s => (
                <td key={s.id} style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                  <button className="btn btn-primary" onClick={() => onSelectScheme(s.id)} style={{ width: '100%', borderRadius: '8px' }}>
                    View Full Details
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareSchemes;

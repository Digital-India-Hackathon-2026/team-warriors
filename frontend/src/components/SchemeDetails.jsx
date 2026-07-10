import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  FileDown, 
  ExternalLink, 
  Calendar,
  AlertCircle,
  ClipboardList,
  Sparkles
} from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const SchemeDetails = ({ schemeId, onBack }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [documentStatus, setDocumentStatus] = useState({});

  useEffect(() => {
    const fetchSchemeDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/schemes/${schemeId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setScheme(data);
          
          // Trigger eligibility check if user is logged in
          if (user && user.profile && user.profile.age) {
            runAIEligibilityCheck(data, user.profile);
          }
        }
      } catch (err) {
        console.error('Error fetching scheme details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemeDetails();
  }, [schemeId, user]);

  const runAIEligibilityCheck = async (schemeData, profile) => {
    setCheckingEligibility(true);
    try {
      const res = await fetch(`${API_BASE}/schemes/${schemeData.id}/check-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile, lang: language })
      });
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch (err) {
      console.error('Eligibility check request failed:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleDocumentToggle = (doc) => {
    setDocumentStatus(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const getSchemeName = () => {
    if (language === 'Telugu' && scheme.name_te) return scheme.name_te;
    if (language === 'Hindi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name;
  };

  const getSchemeDesc = () => {
    if (language === 'Telugu' && scheme.description_te) return scheme.description_te;
    if (language === 'Hindi' && scheme.description_hi) return scheme.description_hi;
    return scheme.description;
  };

  const getSchemeBenefits = () => {
    if (language === 'Telugu' && scheme.benefits_te) return scheme.benefits_te;
    if (language === 'Hindi' && scheme.benefits_hi) return scheme.benefits_hi;
    return scheme.benefits;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
        <p>Loading scheme details...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
        <p>Scheme details could not be loaded. Please try again.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back button and PDF exporter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Schemes</span>
        </button>
        <button className="btn btn-outline" onClick={handlePrint}>
          <FileDown size={16} />
          <span>{t('downloadPdf')}</span>
        </button>
      </div>

      {/* Main scheme sheet */}
      <div className="card" id="scheme-printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Banner header */}
        <div style={{
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-color)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {scheme.category}
            </span>
            <h1 style={{ fontSize: '26px', marginTop: '12px', lineHeight: '1.3', fontFamily: 'var(--font-heading)' }}>
              {getSchemeName()}
            </h1>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px 18px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <Calendar size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{t('deadline')}</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{scheme.deadline}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Overview and Benefits */}
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Overview</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{getSchemeDesc()}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Benefits</h2>
            <div style={{ 
              backgroundColor: 'var(--accent-light)', 
              color: 'var(--text-primary)', 
              padding: '16px', 
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.6,
              borderLeft: '4px solid var(--accent-color)'
            }}>
              {getSchemeBenefits()}
            </div>
          </div>
        </div>

        {/* Section 2: AI Eligibility Evaluator */}
        <div style={{
          padding: '20px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-color)' }} />
              <span>{t('eligibilityCalculator')}</span>
            </h3>
            {checkingEligibility && (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="spinner"></span> AI analyzing...
              </span>
            )}
          </div>

          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <AlertCircle size={16} />
              <span>Please log in and update your Profile to see your custom eligibility analysis.</span>
            </div>
          ) : eligibility ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: eligibility.eligible ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${eligibility.eligible ? 'var(--success)' : 'var(--danger)'}`,
                color: 'var(--text-primary)'
              }}>
                {eligibility.eligible ? <CheckCircle size={22} style={{ color: 'var(--success)' }} /> : <XCircle size={22} style={{ color: 'var(--danger)' }} />}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {eligibility.eligible ? 'You qualify' : 'You do not meet one or more criteria'}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>{eligibility.reason}</div>
                </div>
              </div>

              {/* Criteria breakdown */}
              {eligibility.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eligibility.details.map((detail, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{detail.criteria}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{detail.details}</span>
                        {detail.status === 'Matched' ? (
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        ) : detail.status === 'Not Matched' ? (
                          <XCircle size={14} style={{ color: 'var(--danger)' }} />
                        ) : (
                          <HelpCircle size={14} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No eligibility context yet. Make sure your Profile is fully saved.
            </div>
          )}
        </div>

        {/* Section 3: Guide and Checklists */}
        <div className="grid-2">
          {/* Stepper Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} style={{ color: 'var(--accent-color)' }} />
              <span>{t('documentsRequired')}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scheme.documents && scheme.documents.map((doc, idx) => {
                const isChecked = !!documentStatus[doc];
                return (
                  <label 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: isChecked ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleDocumentToggle(doc)}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    <span style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                      {doc}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Visual Stepper Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>{t('applicationGuide')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
              {scheme.application_steps && scheme.application_steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', paddingBottom: idx === scheme.application_steps.length - 1 ? '0' : '20px' }}>
                  {/* Circle number */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      {idx + 1}
                    </div>
                    {idx !== scheme.application_steps.length - 1 && (
                      <div style={{
                        flex: 1,
                        width: '2px',
                        backgroundColor: 'var(--border-color)',
                        marginTop: '4px',
                        marginBottom: '4px'
                      }}></div>
                    )}
                  </div>
                  {/* Step Description */}
                  <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', paddingTop: '2px', lineHeight: 1.4 }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Official portal disclaimer and link */}
        <div style={{
          marginTop: '12px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
            <AlertCircle size={14} />
            <span>Always apply via official secure government domains (*.gov.in / *.nic.in).</span>
          </div>
          {scheme.official_link && (
            <a 
              href={scheme.official_link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary no-print"
              style={{ borderRadius: '20px' }}
            >
              <span>{t('officialLink')}</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

      </div>
    </div>
  );
};

export default SchemeDetails;

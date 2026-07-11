import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Scan, Upload, FileText, Check, AlertTriangle, UserCheck, HelpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const OCRReader = ({ onSelectScheme }) => {
  const { user, updateProfile } = useAuth();
  const { language, t } = useLanguage();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [applied, setApplied] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setOcrResult(null);
      setEligibleSchemes([]);
      setApplied(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('lang', language);

    try {
      const res = await fetch(`${API_BASE}/chat/ocr`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setOcrResult(data);
        
        // Find matching schemes based on extracted criteria
        evaluateExtractedEligibility(data);
      } else {
        alert('Failed to parse document. Please upload a clear image of Aadhaar, Income certificate or Ration card.');
      }
    } catch (err) {
      console.error('OCR upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const evaluateExtractedEligibility = async (extractedData) => {
    // Generate temporary user profile based on OCR
    const tempProfile = {
      age: extractedData.dob ? calculateAge(extractedData.dob) : 30, // fallback
      gender: extractedData.gender || 'Any',
      income: extractedData.income ? parseInt(extractedData.income) : 100000,
      state: extractedData.state || 'Telangana',
      isFarmer: extractedData.documentType?.toLowerCase().includes('farmer') || false
    };

    try {
      const res = await fetch(`${API_BASE}/schemes/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tempProfile)
      });

      if (res.ok) {
        const schemes = await res.json();
        setEligibleSchemes(schemes.filter(s => s.eligibilityStatus.eligible));
      }
    } catch (err) {
      console.error('Failed to run OCR matching recommendations:', err);
    }
  };

  const calculateAge = (dobString) => {
    try {
      const birth = new Date(dobString);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch (e) {
      return 25;
    }
  };

  const applyToProfile = async () => {
    if (!ocrResult || !user) return;
    
    // Construct mapped properties
    const mapped = {};
    if (ocrResult.gender) mapped.gender = ocrResult.gender;
    if (ocrResult.income) mapped.income = ocrResult.income;
    if (ocrResult.state) mapped.state = ocrResult.state;
    if (ocrResult.dob) mapped.age = calculateAge(ocrResult.dob);

    try {
      await updateProfile(mapped);
      setApplied(true);
    } catch (e) {
      console.error('Failed to apply details to profile:', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Scan size={24} style={{ color: 'var(--accent-color)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          AI OCR Eligibility Checker
        </h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '-12px' }}>
        Upload an identity card (e.g., Aadhaar card) or certificates. Our multimodal Gemini model will extract your demographic data and instantly cross-check eligibility.
      </p>

      <div className="grid-2">
        {/* Upload panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', minHeight: '300px' }}>
          
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-primary)',
            transition: 'border-color var(--transition-fast)'
          }}
          onClick={() => document.getElementById('ocr-file-input').click()}
          >
            <input 
              type="file" 
              id="ocr-file-input" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Upload size={36} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Click to upload file</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Supports JPG, PNG up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          {file && (
            <button 
              className="btn btn-primary" 
              onClick={handleUpload}
              disabled={loading}
              style={{ width: '100%', borderRadius: '8px' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ borderLeftColor: '#fff' }}></span>
                  <span>Extracting Text...</span>
                </>
              ) : (
                <>
                  <Scan size={16} />
                  <span>Analyze Document</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* OCR Result and Scheme eligibility matching */}
        <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-color)' }} />
            <span>Extracted Information</span>
          </h2>

          {!ocrResult ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              Upload and analyze a document to check eligibility parameters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Parameter Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Document Type</span>
                  <span style={{ fontWeight: 600 }}>{ocrResult.documentType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Extracted Name</span>
                  <span style={{ fontWeight: 600 }}>{ocrResult.name}</span>
                </div>
                {ocrResult.idNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>ID Number</span>
                    <span style={{ fontWeight: 600 }}>{ocrResult.idNumber}</span>
                  </div>
                )}
                {ocrResult.dob && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>DOB</span>
                    <span style={{ fontWeight: 600 }}>{ocrResult.dob} (Age: {calculateAge(ocrResult.dob)} years)</span>
                  </div>
                )}
                {ocrResult.gender && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Gender</span>
                    <span style={{ fontWeight: 600 }}>{ocrResult.gender}</span>
                  </div>
                )}
                {ocrResult.state && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>State</span>
                    <span style={{ fontWeight: 600 }}>{ocrResult.state}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {user && (
                <button 
                  className={`btn ${applied ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={applyToProfile}
                  disabled={applied}
                  style={{ width: '100%', borderRadius: '8px' }}
                >
                  <UserCheck size={16} />
                  <span>{applied ? 'Details Applied to Profile' : 'Apply Details to Profile Settings'}</span>
                </button>
              )}

              {/* Match list */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>Matched Eligible Schemes:</h3>
                {eligibleSchemes.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No matching schemes found based on these parameters.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {eligibleSchemes.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => onSelectScheme(s.id)}
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          backgroundColor: 'var(--success-light)',
                          color: 'var(--success)',
                          fontWeight: 600,
                          border: '1px solid var(--success)'
                        }}
                      >
                        {s.name.split(' - ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRReader;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Save, CheckCircle } from 'lucide-react';

const ProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [occupation, setOccupation] = useState('Any');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('Telangana');
  const [education, setEducation] = useState('Any');
  const [disability, setDisability] = useState(false);
  const [caste, setCaste] = useState('General');
  const [isFarmer, setIsFarmer] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state with loaded user profile context
  useEffect(() => {
    if (user && user.profile) {
      const p = user.profile;
      if (p.age) setAge(p.age);
      if (p.gender) setGender(p.gender);
      if (p.occupation) setOccupation(p.occupation);
      if (p.income) setIncome(p.income);
      if (p.state) setState(p.state);
      if (p.education) setEducation(p.education);
      if (p.disability !== undefined) setDisability(p.disability);
      if (p.caste) setCaste(p.caste);
      if (p.isFarmer !== undefined) setIsFarmer(p.isFarmer);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateProfile({
        age: parseInt(age) || '',
        gender,
        occupation,
        income: income !== '' ? parseInt(income) : '',
        state,
        education,
        disability,
        caste,
        isFarmer
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const states = ['Andhra Pradesh', 'Telangana', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Bihar'];
  const socialCategories = ['General', 'OBC', 'SC', 'ST'];
  const occupations = ['Farmer', 'Student', 'Self-Employed', 'Unorganized sector worker', 'Business Owner', 'Laborer', 'Domestic Worker', 'Artisan', 'Unemployed', 'Any'];
  const genders = ['Male', 'Female', 'Transgender', 'Other'];

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please register or login to customize your scheme profile settings.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <User size={24} style={{ color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {t('profile')}
          </h2>
        </div>

        {success && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: '6px',
            border: '1px solid var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <CheckCircle size={18} />
            <span>Profile saved successfully! AI eligibility criteria have been re-calibrated.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          {/* Age */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('age')}</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              placeholder="e.g. 28"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* Gender */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('gender')}</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Occupation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('occupation')}</label>
            <select 
              value={occupation} 
              onChange={(e) => setOccupation(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {occupations.map(occ => <option key={occ} value={occ}>{occ}</option>)}
            </select>
          </div>

          {/* Income */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('income')}</label>
            <input 
              type="number" 
              value={income} 
              onChange={(e) => setIncome(e.target.value)} 
              placeholder="Annual income in ₹"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('state')}</label>
            <select 
              value={state} 
              onChange={(e) => setState(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Caste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('caste')}</label>
            <select 
              value={caste} 
              onChange={(e) => setCaste(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {socialCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Checkbox columns */}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '24px', margin: '8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={isFarmer} 
                onChange={(e) => setIsFarmer(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Are you registered as a Farmer?</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={disability} 
                onChange={(e) => setDisability(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Do you have a physical disability?</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving} 
            style={{ gridColumn: 'span 2', borderRadius: '8px', height: '44px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : t('save')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;

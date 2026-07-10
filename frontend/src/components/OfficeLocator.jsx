import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Phone, Search, Locate } from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const OfficeLocator = () => {
  const { t } = useLanguage();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState('Telangana');
  const [coords, setCoords] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  const fetchOffices = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/offices?${query}`);
      if (res.ok) {
        const data = await res.json();
        setOffices(data);
        if (data.length > 0) setSelectedOffice(data[0]);
      }
    } catch (err) {
      console.error('Error fetching offices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices({ state: searchState });
  }, []);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSearchState(state);
    setCoords(null);
    fetchOffices({ state });
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        fetchOffices({ lat, lng });
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not retrieve your location. Falling back to default list.');
        fetchOffices({ state: searchState });
      }
    );
  };

  const states = ['Andhra Pradesh', 'Telangana', 'Delhi'];

  // Map drawing parameters
  // Radar center is (150, 150) in a 300x300 box
  const getMapPoints = () => {
    if (offices.length === 0) return [];
    
    // We map distances relative to max distance
    const maxDist = Math.max(...offices.map(o => parseFloat(o.distance)));
    
    return offices.map((office, idx) => {
      // Calculate fake angles based on index so they fan out evenly
      const angle = (idx * (2 * Math.PI)) / offices.length;
      const normalizedDist = parseFloat(office.distance) / (maxDist || 1);
      
      // Distance radius up to 100px from center
      const r = normalizedDist * 100 + 20; 
      const x = 150 + r * Math.cos(angle);
      const y = 150 + r * Math.sin(angle);
      
      return { ...office, x, y };
    });
  };

  const mapPoints = getMapPoints();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MapPin size={24} style={{ color: 'var(--accent-color)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {t('nearbyOffices')}
        </h1>
      </div>

      {/* Control filters bar */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 24px'
      }}>
        {/* State filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={searchState} 
            onChange={handleStateChange}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Locate me button */}
        <button className="btn btn-primary" onClick={getMyLocation} disabled={loading} style={{ borderRadius: '20px' }}>
          <Locate size={16} />
          <span>Get Offices Near Me</span>
        </button>
      </div>

      {/* Dynamic Radar Map and Office cards */}
      <div className="grid-2">
        {/* List of offices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="spinner"></div>
          ) : offices.length === 0 ? (
            <p>No offices found.</p>
          ) : (
            offices.map((office) => {
              const isSelected = selectedOffice?.id === office.id;
              return (
                <div 
                  key={office.id} 
                  className="card"
                  onClick={() => setSelectedOffice(office)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {office.type}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      {office.distance} km away
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{office.name}</h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{office.address}</p>
                  
                  {office.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      <Phone size={12} />
                      <span>{office.phone}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RADAR Custom SVG simulation panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Interactive Position Map Radar
          </h3>
          
          <div style={{ position: 'relative', width: '300px', height: '300px' }}>
            <svg width="300" height="300" style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              {/* Radar circular lines */}
              <circle cx="150" cy="150" r="120" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4" />
              <circle cx="150" cy="150" r="80" fill="none" stroke="var(--border-color)" strokeWidth="1" />
              <circle cx="150" cy="150" r="40" fill="none" stroke="var(--border-color)" strokeWidth="1" />
              
              {/* Grid axes */}
              <line x1="150" y1="10" x2="150" y2="290" stroke="var(--border-color)" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="10" y1="150" x2="290" y2="150" stroke="var(--border-color)" strokeWidth="1" strokeOpacity="0.5" />

              {/* User Center Marker */}
              <circle cx="150" cy="150" r="8" fill="var(--accent-color)" />
              <circle cx="150" cy="150" r="16" fill="var(--accent-color)" fillOpacity="0.15" />

              {/* Office coordinate marker pins */}
              {mapPoints.map((point) => {
                const isSelected = selectedOffice?.id === point.id;
                return (
                  <g 
                    key={point.id} 
                    cursor="pointer" 
                    onClick={() => setSelectedOffice(point)}
                  >
                    {/* Pulsing ring on selected */}
                    {isSelected && (
                      <circle cx={point.x} cy={point.y} r="12" fill="var(--success)" fillOpacity="0.25" />
                    )}
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r="6" 
                      fill={isSelected ? "var(--success)" : "var(--text-tertiary)"} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Quick tag */}
                    <text 
                      x={point.x + 8} 
                      y={point.y + 4} 
                      fontSize="9px" 
                      fill="var(--text-secondary)"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {point.name.substring(0, 10)}...
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Radar scanner line simulation overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '130px',
              height: '2px',
              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.4) 0%, transparent 100%)',
              transformOrigin: 'left center',
              animation: 'radar-sweep 4s linear infinite',
              pointerEvents: 'none'
            }}></div>
          </div>

          {selectedOffice && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justify: 'center', gap: '4px' }}>
                <Navigation size={12} style={{ color: 'var(--success)' }} />
                <span>Selected: {selectedOffice.name} ({selectedOffice.distance} km)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OfficeLocator;

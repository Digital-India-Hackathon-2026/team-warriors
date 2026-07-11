import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const FeedbackForm = () => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, rating, comment })
      });
      if (res.ok) {
        setSuccess(true);
        setComment('');
        setName('');
        setEmail('');
      }
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <MessageSquare size={24} style={{ color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            Submit Your Feedback
          </h2>
        </div>

        {success ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Thank you!</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Your feedback was submitted successfully. We appreciate your input to make Scheme Sathi better!
            </p>
            <button className="btn btn-outline" onClick={() => setSuccess(false)} style={{ marginTop: '12px' }}>
              Submit another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Name (Optional)</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter name"
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email (Optional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter email"
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Rating Stars selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ color: 'var(--warning)', padding: '4px' }}
                  >
                    <Star size={24} fill={star <= rating ? 'var(--warning)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Comments *</label>
              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                required
                rows="4"
                placeholder="How was your experience using Scheme Sathi?"
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
              <Send size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;

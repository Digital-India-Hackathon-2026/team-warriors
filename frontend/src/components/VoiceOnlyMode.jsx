import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mic, MicOff, Volume2, VolumeX, X, HelpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const VoiceOnlyMode = ({ onClose, onSelectScheme }) => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('Hello! I am Scheme Sathi. Ask me about any government scheme in Telugu or English.');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(`voice-session-${Date.now()}`);

  const getSpeechLangCode = () => {
    if (language === 'Telugu') return 'te-IN';
    if (language === 'Hindi') return 'hi-IN';
    return 'en-IN';
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleSendVoiceQuery(text);
      };
      
      rec.onerror = () => setIsRecording(false);
      recognitionRef.current = rec;
    }

    // Speak initial greeting
    speakText(response);

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text) => {
    if (muted || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_\-]/g, ''));
    utterance.lang = getSpeechLangCode();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendVoiceQuery = async (text) => {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: text,
          language: language,
          profile: user?.profile || {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.text);
        speakText(data.text);
      }
    } catch (e) {
      console.error('Voice chatbot error:', e);
      setResponse('Error checking details. Please try again.');
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.lang = getSpeechLangCode();
      recognitionRef.current.start();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(9, 13, 22, 0.98)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      padding: '24px',
      textAlign: 'center'
    }} className="no-print">
      
      {/* Top action row */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        display: 'flex',
        gap: '16px'
      }}>
        <button 
          onClick={() => { setMuted(!muted); if (window.speechSynthesis) window.speechSynthesis.cancel(); }}
          style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
        >
          {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button 
          onClick={onClose} 
          style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Pulsing Audio Radar and Mic Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', opacity: 0.8 }}>
          {language === 'Telugu' ? 'వాయిస్ సహాయ మోడ్' : 'Voice-Only Mode'}
        </h2>
        
        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing visual circles */}
          {(isRecording || isSpeaking) && (
            <>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `2.5px solid ${isRecording ? 'var(--danger)' : 'var(--accent-color)'}`,
                animation: 'radar-pulse 2s infinite',
                opacity: 0
              }}></div>
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                border: `1.5px solid ${isRecording ? 'var(--danger)' : 'var(--accent-color)'}`,
                animation: 'radar-pulse 2s infinite 0.5s',
                opacity: 0
              }}></div>
            </>
          )}

          <button 
            onClick={toggleListen}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'var(--danger)' : 'var(--accent-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
              zIndex: 10
            }}
          >
            {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
          </button>
        </div>

        {/* Text Feedbacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', padding: '0 16px' }}>
          {/* User query transcript */}
          {transcript && (
            <p style={{ fontStyle: 'italic', fontSize: '15px', color: 'var(--text-tertiary)' }}>
              "{transcript}"
            </p>
          )}

          {/* AI Response readout */}
          <h1 style={{
            fontSize: '20px',
            lineHeight: '1.5',
            fontWeight: 500,
            color: '#f8fafc',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '20px 24px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {response}
          </h1>
        </div>

        <p style={{ fontSize: '12px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HelpCircle size={14} />
          <span>Click the microphone to speak. Speak in English, Telugu, or Hindi.</span>
        </p>
      </div>

      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default VoiceOnlyMode;

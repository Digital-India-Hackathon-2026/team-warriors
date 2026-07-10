import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User,
  Clock,
  Signal
} from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const CallAgent = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  // Call state machine: 'idle' | 'connecting' | 'active' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Transcript log
  const [transcript, setTranscript] = useState([]);
  const [liveCaption, setLiveCaption] = useState('');

  const sessionIdRef = useRef(`call-${Date.now()}`);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // --- Speech Recognition Setup ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'te-IN'; // Telugu primary

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interimTranscript += t;
          }
        }

        // Show live interim captions
        if (interimTranscript) {
          setLiveCaption(interimTranscript);
        }

        // When user finishes a phrase, send it to the call agent
        if (finalTranscript.trim()) {
          setLiveCaption('');
          addTranscriptEntry('user', finalTranscript.trim());
          sendToAgent(finalTranscript.trim());
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        // Auto-restart on non-fatal errors during active call
        if (e.error === 'no-speech' || e.error === 'aborted') {
          if (callState === 'active' && !isMuted) {
            setTimeout(() => {
              try { rec.start(); } catch(_) {}
            }, 300);
          }
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Auto-restart recognition if call is still active and not muted
        if (callState === 'active' && !isMuted) {
          setTimeout(() => {
            try {
              rec.start();
              setIsListening(true);
            } catch (_) {}
          }, 300);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Timer ---
  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // --- Auto scroll transcript ---
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, liveCaption]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addTranscriptEntry = useCallback((role, text) => {
    setTranscript(prev => [...prev, {
      role,
      text,
      time: new Date()
    }]);
  }, []);

  // --- TTS ---
  const speakTelugu = useCallback((text) => {
    if (!isSpeakerOn || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-]/g, '').substring(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'te-IN';
    utterance.rate = 0.95;

    // Try to find a Telugu voice
    const voices = window.speechSynthesis.getVoices();
    const teluguVoice = voices.find(v => v.lang.includes('te'));
    if (teluguVoice) utterance.voice = teluguVoice;

    utterance.onstart = () => setIsAgentSpeaking(true);
    utterance.onend = () => {
      setIsAgentSpeaking(false);
      // Re-activate mic after agent finishes speaking
      if (callState === 'active' && !isMuted && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (_) {}
      }
    };
    utterance.onerror = () => setIsAgentSpeaking(false);

    // Pause recognition while agent speaks
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
    }

    window.speechSynthesis.speak(utterance);
  }, [isSpeakerOn, callState, isMuted]);

  // --- Send message to backend Call Agent ---
  const sendToAgent = useCallback(async (text) => {
    try {
      const res = await fetch(`${API_BASE}/chat/call-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: text,
          profile: user?.profile || {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        addTranscriptEntry('agent', data.text);
        speakTelugu(data.text);
      }
    } catch (err) {
      console.error('Call agent fetch error:', err);
    }
  }, [user, addTranscriptEntry, speakTelugu]);

  // --- Call Controls ---
  const startCall = () => {
    setCallState('connecting');
    setTranscript([]);
    setCallTimer(0);
    setLiveCaption('');
    sessionIdRef.current = `call-${Date.now()}`;

    // Simulate a 2-second "connecting" animation then start
    setTimeout(() => {
      setCallState('active');

      // Agent greets first
      const greeting = 'నమస్కారం అండి! నేను ప్రభుత్వ పథకాల సహాయ అధికారి కీర్తిని మాట్లాడుతున్నాను. మీకు ఏ పథకం గురించి సమాచారం కావాలో చెప్పండి.';
      addTranscriptEntry('agent', greeting);
      speakTelugu(greeting);
    }, 2200);
  };

  const endCall = () => {
    setCallState('ended');
    setIsListening(false);
    setIsAgentSpeaking(false);
    setLiveCaption('');

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    addTranscriptEntry('system', 'కాల్ ముగిసింది. ధన్యవాదాలు! (Call ended)');
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
    } else {
      if (callState === 'active' && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (_) {}
      }
    }
  };

  const toggleSpeaker = () => {
    const newSpeaker = !isSpeakerOn;
    setIsSpeakerOn(newSpeaker);
    if (!newSpeaker && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
    }
  };

  // --- Render ---
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '24px',
      maxWidth: '520px',
      margin: '0 auto'
    }}>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: 'var(--font-heading)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <Phone size={24} style={{ color: 'var(--accent-color)' }} />
          ప్రభుత్వ పథకాల హెల్ప్‌లైన్
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Government Schemes Helpline — Telugu Voice Call Agent
        </p>
      </div>

      {/* Main Call Card */}
      <div className="card" style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '32px 24px',
        position: 'relative',
        overflow: 'hidden',
        background: callState === 'active' 
          ? 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(79, 70, 229, 0.03) 100%)'
          : 'var(--bg-secondary)'
      }}>

        {/* Agent Avatar */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          {/* Pulsing rings during active call */}
          {(callState === 'active' || callState === 'connecting') && (
            <>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: '130px', height: '130px',
                borderRadius: '50%',
                border: `2px solid ${isAgentSpeaking ? 'var(--success)' : 'var(--accent-color)'}`,
                transform: 'translate(-50%, -50%)',
                animation: 'call-pulse 2s ease-out infinite',
                opacity: 0
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: '160px', height: '160px',
                borderRadius: '50%',
                border: `1.5px solid ${isAgentSpeaking ? 'var(--success)' : 'var(--accent-color)'}`,
                transform: 'translate(-50%, -50%)',
                animation: 'call-pulse 2s ease-out infinite 0.6s',
                opacity: 0
              }} />
            </>
          )}

          {/* Avatar circle */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: callState === 'active' 
              ? (isAgentSpeaking 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)')
              : 'linear-gradient(135deg, var(--bg-tertiary), var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            boxShadow: callState === 'active' 
              ? '0 0 30px rgba(79, 70, 229, 0.25)' 
              : 'var(--shadow-md)',
            transition: 'all 0.4s ease',
            position: 'relative',
            zIndex: 2
          }}>
            👩‍💼
          </div>

          {/* Speaking visualizer bars */}
          {isAgentSpeaking && (
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '3px',
              alignItems: 'flex-end',
              height: '20px',
              zIndex: 3
            }}>
              {[12, 18, 14, 20, 10, 16, 12].map((h, i) => (
                <div key={i} style={{
                  width: '3px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--success)',
                  animation: `eq-bar 0.5s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.07}s`,
                  height: `${h}px`
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Agent info */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>కీర్తి (Keerthi)</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Government Schemes Helpline Officer
          </p>
        </div>

        {/* Call status and timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 20px',
          borderRadius: '20px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {callState === 'idle' && (
            <span style={{ color: 'var(--text-tertiary)' }}>Ready to connect</span>
          )}
          {callState === 'connecting' && (
            <>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }} />
              <span style={{ color: 'var(--warning)' }}>Connecting…</span>
            </>
          )}
          {callState === 'active' && (
            <>
              <Signal size={14} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)' }}>Active Call</span>
              <span style={{ color: 'var(--text-tertiary)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <Clock size={12} />
                {formatTime(callTimer)}
              </span>
            </>
          )}
          {callState === 'ended' && (
            <span style={{ color: 'var(--danger)' }}>Call Ended — {formatTime(callTimer)}</span>
          )}
        </div>

        {/* Listening indicator */}
        {callState === 'active' && isListening && !isAgentSpeaking && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--accent-color)',
            animation: 'fade-pulse 1.5s ease infinite'
          }}>
            <Mic size={14} />
            <span>Listening for your voice…</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '8px'
        }}>
          {/* Mute */}
          {callState === 'active' && (
            <button
              onClick={toggleMute}
              style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                backgroundColor: isMuted ? 'var(--danger-light)' : 'var(--bg-tertiary)',
                color: isMuted ? 'var(--danger)' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${isMuted ? 'var(--danger)' : 'var(--border-color)'}`,
                transition: 'all 0.2s ease'
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Main call button */}
          {(callState === 'idle' || callState === 'ended') && (
            <button
              onClick={startCall}
              style={{
                width: '72px', height: '72px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Phone size={30} />
            </button>
          )}

          {callState === 'active' && (
            <button
              onClick={endCall}
              style={{
                width: '72px', height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <PhoneOff size={30} />
            </button>
          )}

          {callState === 'connecting' && (
            <button disabled style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--warning)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.7
            }}>
              <Phone size={30} />
            </button>
          )}

          {/* Speaker */}
          {callState === 'active' && (
            <button
              onClick={toggleSpeaker}
              style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                backgroundColor: !isSpeakerOn ? 'var(--danger-light)' : 'var(--bg-tertiary)',
                color: !isSpeakerOn ? 'var(--danger)' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${!isSpeakerOn ? 'var(--danger)' : 'var(--border-color)'}`,
                transition: 'all 0.2s ease'
              }}
              title={isSpeakerOn ? 'Speaker off' : 'Speaker on'}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          )}
        </div>

        {(callState === 'idle' || callState === 'ended') && (
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '300px' }}>
            Press the green button to call Keerthi — she speaks Telugu and knows every government scheme.
          </p>
        )}
      </div>

      {/* Live Transcript Panel */}
      {(callState === 'active' || callState === 'ended') && transcript.length > 0 && (
        <div className="card" style={{
          width: '100%',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '320px',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px'
          }}>
            Live Transcript
          </h3>

          {transcript.map((entry, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              opacity: entry.role === 'system' ? 0.5 : 1
            }}>
              {/* Role indicator */}
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                backgroundColor: entry.role === 'user' 
                  ? 'var(--accent-light)' 
                  : entry.role === 'agent' 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: '13px'
              }}>
                {entry.role === 'user' ? '🙋' : entry.role === 'agent' ? '👩‍💼' : 'ℹ️'}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: entry.role === 'user' ? 'var(--accent-color)' : 'var(--success)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '2px'
                }}>
                  {entry.role === 'user' ? 'You' : entry.role === 'agent' ? 'Keerthi' : ''}
                </div>
                <p style={{
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  fontStyle: entry.role === 'system' ? 'italic' : 'normal'
                }}>
                  {entry.text}
                </p>
              </div>

              {/* Timestamp */}
              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }}>
                {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Interim live caption */}
          {liveCaption && (
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              opacity: 0.6, fontStyle: 'italic', fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <span>🙋</span>
              <span>{liveCaption}…</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>
      )}

      <style>{`
        @keyframes call-pulse {
          0%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }
        @keyframes eq-bar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1.2); }
        }
        @keyframes fade-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default CallAgent;

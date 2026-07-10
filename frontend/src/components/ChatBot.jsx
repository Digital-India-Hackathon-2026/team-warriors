import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

const ChatBot = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const sessionIdRef = useRef(`session-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisUtteranceRef = useRef(null);

  // Initialize Web Speech APIs
  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };
      
      rec.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        setIsRecording(false);
      };
      
      recognitionRef.current = rec;
    }
    
    // Add default initial greeting
    setMessages([
      { role: 'model', text: t('chatbotGreeting'), timestamp: new Date() }
    ]);

    return () => {
      // Stop ongoing voice output on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update voice configuration based on language
  const getSpeechLangCode = () => {
    if (language === 'Telugu') return 'te-IN';
    if (language === 'Hindi') return 'hi-IN';
    return 'en-IN';
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Recognition triggers
  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Google Chrome.');
      return;
    }
    
    // Stop speaking if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    recognitionRef.current.lang = getSpeechLangCode();
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Speak response out loud using web synthesis
  const speakText = (text) => {
    if (isMuted || !window.speechSynthesis) return;

    // Stop current synthesis
    window.speechSynthesis.cancel();
    
    // Remove Markdown formatting like asterisks or hashtags from speech input
    const cleanText = text.replace(/[*#`_\-]/g, '').substring(0, 200); // limit speech snippet for performance

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getSpeechLangCode();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Fine-tune voice selection based on language if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.includes(getSpeechLangCode()));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    synthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (customText = '') => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    if (!customText) setInput('');

    // Append user message
    const userMsg = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: textToSend,
          language: language,
          profile: user?.profile || {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = { role: 'model', text: data.text, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);
        
        // Trigger speaking output
        speakText(data.text);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Clear conversation memory?')) {
      try {
        await fetch(`${API_BASE}/chat/clear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId: sessionIdRef.current })
        });
        
        setMessages([
          { role: 'model', text: t('chatbotGreeting'), timestamp: new Date() }
        ]);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (err) {
        console.error('Error clearing chat:', err);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }} className="no-print">
      
      {/* 1. Floating Toggle Icon */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            position: 'relative'
          }}
          className="btn"
        >
          <MessageSquare size={26} />
          {/* Audio line indicator of active speaking on the toggle badge */}
          {isSpeaking && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--success)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1s infinite'
            }}>
              🔊
            </div>
          )}
        </button>
      )}

      {/* 2. Expanded Chatbot Dialog Sheet */}
      {isOpen && (
        <div className="glass-panel" style={{
          width: '380px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)'
        }}>
          {/* Dialog Header with avatar */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* Speaking Avatar face details */}
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSpeaking ? '0 0 10px var(--accent-color)' : 'none'
              }}>
                <span style={{ fontSize: '20px' }}>🤖</span>
                {/* Lip lines syncing with voice sound */}
                {isSpeaking && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    display: 'flex',
                    gap: '2px',
                    alignItems: 'center',
                    height: '12px'
                  }}>
                    <span className="talking-line speaking"></span>
                    <span className="talking-line speaking"></span>
                    <span className="talking-line speaking"></span>
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Scheme Sathi AI</h3>
                <span style={{ fontSize: '11px', color: isSpeaking ? 'var(--success)' : 'var(--text-tertiary)' }}>
                  {isSpeaking ? 'Speaking...' : 'Online assistance'}
                </span>
              </div>
            </div>

            {/* Config panel triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setIsMuted(!isMuted)} style={{ color: 'var(--text-secondary)' }} title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button onClick={clearChat} style={{ color: 'var(--text-secondary)' }} title="Clear history">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages list pane */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={idx} 
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: isUser ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    boxShadow: 'var(--shadow-sm)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input bar */}
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button 
              onClick={isRecording ? stopListening : startListening}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isRecording ? 'var(--danger-light)' : 'var(--accent-light)',
                color: isRecording ? 'var(--danger)' : 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Voice Input (multilingual)"
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input 
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button 
              onClick={() => sendMessage()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-color)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default ChatBot;

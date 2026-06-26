import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { uploadDocument } from '../../api/documents';

export default function MedbridgeAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm MedbridgeAI, your triage assistant. Can you tell me what symptoms you're experiencing today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [myDocuments, setMyDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [showDocSelector, setShowDocSelector] = useState(false);

  // Drag logic
  const [position, setPosition] = useState({ right: 30, bottom: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    dragStart.current = {
      startX: e.clientX,
      startY: e.clientY,
      initRight: position.right,
      initBottom: position.bottom
    };
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.startX;
    const dy = e.clientY - dragStart.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setIsDragging(true);
    }

    setPosition({
      right: dragStart.current.initRight - dx,
      bottom: dragStart.current.initBottom - dy
    });
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    dragStart.current = null;
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleClick = (e) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    setIsOpen(true);
  };

  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && myDocuments.length === 0) {
      axios.get('/api/documents/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('mb_token')}` }
      })
        .then(res => setMyDocuments(res.data))
        .catch(err => console.error('Failed to load documents for AI', err));
    }
  }, [isOpen]);

  const handleSend = async (customMessage = null, docId = null) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMsgs);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const payload = { messages: newMsgs };
      const contextDocId = docId || selectedDocId;
      if (contextDocId) {
        payload.document_ids = [parseInt(contextDocId, 10)];
      }

      const res = await axios.post('/api/ai/chat', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mb_token')}` }
      });

      setMessages([...newMsgs, { role: 'model', content: res.data.response }]);
    } catch (err) {
      toast.error('MedbridgeAI is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="medbridge-ai-container"
      style={!isOpen ? { right: `${position.right}px`, bottom: `${position.bottom}px` } : {}}
    >
      {!isOpen ? (
        <button
          className="ai-fab"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Ask MedbridgeAI</span>
        </button>
      ) : (
        <div className="ai-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="ai-chat-window" onClick={e => e.stopPropagation()}>
            <div className="ai-chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="ai-avatar">✨</div>
                <div>
                  <strong>MedbridgeAI</strong>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>Triage & Medicine Assistant</div>
                </div>
              </div>
              <button className="ai-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="ai-chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`ai-msg-row ${msg.role}`}>
                  <div className="ai-bubble">
                    {msg.role === 'model' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg-row model">
                  <div className="ai-bubble loading">
                    <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showDocSelector && (
              <div className="ai-doc-selector">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="ai-doc-select-input"
                >
                  <option value="">-- Attach a Document Context --</option>
                  {myDocuments.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ai-chat-input-area">
              <button
                className="ai-icon-btn"
                onClick={() => setShowDocSelector(!showDocSelector)}
                title="Attach Document"
              >
                📎
              </button>
              <input
                type="text"
                placeholder="Describe your symptoms..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <button className="ai-send-btn" onClick={() => handleSend()} disabled={loading}>
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

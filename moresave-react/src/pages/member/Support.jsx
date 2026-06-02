import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Send, Bot, User, Headphones } from 'lucide-react';

const MemberSupport = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const memberNumber = user?.memberNumber;
  const memberName = user?.fullName || user?.username;

  useEffect(() => {
    if (!memberNumber) return;
    fetch(`/api/support?memberNumber=${memberNumber}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []));
    // Mark as read
    fetch('/api/support/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberNumber })
    });
  }, [memberNumber]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'member', text, timestamp: new Date().toISOString()
    }]);

    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberNumber, memberName, message: text, sender: 'member' })
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubbleStyle = (sender) => ({
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: sender === 'member' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: sender === 'member' ? 'var(--dark-brown)' : sender === 'ai' ? '#f0f4ff' : '#e8f5e9',
    color: sender === 'member' ? 'white' : '#1a1a1a',
    fontSize: '14px',
    lineHeight: '1.6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    whiteSpace: 'pre-wrap'
  });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Navbar user={user} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '20px 30px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-brown), var(--mid-brown))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headphones size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Moresave SACCO Support</h2>
              <p style={{ fontSize: '12px', color: 'var(--accent-green)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', display: 'inline-block' }}></span>
                Online – Ask us anything!
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px', backgroundColor: '#f7f3ef', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#aaa', marginTop: '60px' }}>
                <Bot size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '16px' }}>Hi {memberName}! 👋</p>
                <p style={{ fontSize: '14px' }}>How can we help you today? Type a message below to get started.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'member' ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: msg.sender === 'member' ? 'row-reverse' : 'row' }}>
                  {msg.sender !== 'member' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'ai' ? '#e8eeff' : '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {msg.sender === 'ai' ? <Bot size={16} color="#4a6cf7" /> : <User size={16} color="#27ae60" />}
                    </div>
                  )}
                  <div style={bubbleStyle(msg.sender)}>
                    {msg.sender === 'ai' && <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4a6cf7', marginBottom: '6px' }}>🤖 AI Support</div>}
                    {msg.sender === 'staff' && <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#27ae60', marginBottom: '6px' }}>👤 {msg.staffName || 'Support Staff'}</div>}
                    {msg.text}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#bbb', marginTop: '4px', paddingLeft: msg.sender !== 'member' ? '40px' : '0', paddingRight: msg.sender === 'member' ? '0' : '0' }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8eeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="#4a6cf7" />
                </div>
                <div style={{ padding: '12px 16px', backgroundColor: '#f0f4ff', borderRadius: '18px 18px 18px 4px', fontSize: '20px' }}>
                  <span style={{ animation: 'blink 1s infinite' }}>●●●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 30px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message here..."
              style={{ flex: 1, padding: '12px 18px', borderRadius: '25px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fafafa' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--dark-brown)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? 0.5 : 1 }}
            >
              <Send size={20} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSupport;

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Send, MessageSquare, User, Bot, Inbox } from 'lucide-react';

const AdminSupport = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const bottomRef = useRef(null);

  const fetchTickets = () => {
    fetch('/api/support')
      .then(r => r.json())
      .then(setTickets);
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openTicket = (ticket) => {
    setSelected(ticket);
    fetch(`/api/support?memberNumber=${ticket.memberNumber}`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages || []);
        // Mark as read
        fetch('/api/support/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberNumber: ticket.memberNumber })
        });
        fetchTickets();
      });
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    const text = reply.trim();
    setReply('');
    const res = await fetch('/api/support/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberNumber: selected.memberNumber, message: text, staffName: user?.fullName || user?.username })
    });
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  };

  const formatTime = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const bubbleStyle = (sender) => ({
    maxWidth: '72%',
    padding: '10px 15px',
    borderRadius: sender === 'member' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: sender === 'member' ? '#f0f0f0' : sender === 'staff' ? 'var(--dark-brown)' : '#f0f4ff',
    color: sender === 'staff' ? 'white' : '#1a1a1a',
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <Navbar user={user} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT: Ticket List */}
          <div style={{ width: '300px', borderRight: '1px solid #eee', background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Inbox size={20} /> Support Inbox
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '4px 0 0' }}>{tickets.length} active conversations</p>
            </div>
            {tickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p>No member messages yet</p>
              </div>
            )}
            {tickets.map((t, i) => (
              <div
                key={i}
                onClick={() => openTicket(t)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f5f5f5',
                  backgroundColor: selected?.memberNumber === t.memberNumber ? '#fdf8f5' : 'white',
                  borderLeft: selected?.memberNumber === t.memberNumber ? '3px solid var(--dark-brown)' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.memberName}</span>
                  {t.unread > 0 && (
                    <span style={{ backgroundColor: 'var(--accent-red)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                      {t.unread}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {t.lastMessage?.text || 'No messages'}
                </p>
                <p style={{ fontSize: '11px', color: '#ccc', margin: '4px 0 0' }}>
                  {t.lastMessage ? formatTime(t.lastMessage.timestamp) : ''}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT: Chat View */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f3ef' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>
                <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p style={{ fontSize: '18px' }}>Select a conversation to view</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--light-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="var(--mid-brown)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0, fontSize: '15px' }}>{selected.memberName}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>{selected.memberNumber}</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'member' ? 'flex-start' : 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: msg.sender === 'member' ? 'row' : 'row-reverse' }}>
                        {msg.sender === 'member' && (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={14} color="#666" />
                          </div>
                        )}
                        {msg.sender === 'ai' && (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e8eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Bot size={14} color="#4a6cf7" />
                          </div>
                        )}
                        <div style={bubbleStyle(msg.sender)}>
                          {msg.sender === 'ai' && <div style={{ fontSize: '10px', color: '#4a6cf7', fontWeight: 'bold', marginBottom: '4px' }}>🤖 AI Auto-Reply</div>}
                          {msg.text}
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', color: '#bbb', marginTop: '3px', paddingLeft: msg.sender === 'member' ? '36px' : '0', paddingRight: msg.sender !== 'member' ? '0' : '0' }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Staff Reply Box */}
                <div style={{ padding: '14px 24px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    placeholder={`Reply as ${user?.fullName || 'Staff'}...`}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim()}
                    style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: 'var(--dark-brown)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', opacity: !reply.trim() ? 0.5 : 1 }}
                  >
                    <Send size={14} /> Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;

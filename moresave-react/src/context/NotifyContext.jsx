import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotifyContext = createContext(null);

export const useNotify = () => useContext(NotifyContext);

export const NotifyProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // { message, onConfirm, onCancel, type }

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setModal({
        message,
        onConfirm: () => { setModal(null); resolve(true); },
        onCancel:  () => { setModal(null); resolve(false); }
      });
    });
  }, []);

  const icons = {
    success: <CheckCircle size={20} color="#27ae60" />,
    error:   <XCircle size={20} color="#e74c3c" />,
    warning: <AlertTriangle size={20} color="#f39c12" />,
    info:    <Info size={20} color="#2980b9" />,
  };

  const colors = {
    success: { bg: '#f0fdf4', border: '#27ae60' },
    error:   { bg: '#fef2f2', border: '#e74c3c' },
    warning: { bg: '#fffbeb', border: '#f39c12' },
    info:    { bg: '#eff6ff', border: '#2980b9' },
  };

  return (
    <NotifyContext.Provider value={{ toast, confirm }}>
      {children}

      {/* TOAST CONTAINER */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 16px',
            backgroundColor: colors[t.type]?.bg || '#fff',
            border: `1px solid ${colors[t.type]?.border || '#ccc'}`,
            borderLeft: `4px solid ${colors[t.type]?.border || '#ccc'}`,
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            animation: 'slideIn 0.3s ease-out',
          }}>
            <div style={{ flexShrink: 0, marginTop: '1px' }}>{icons[t.type]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Moresave SACCO
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#1a1a1a', lineHeight: 1.5 }}>{t.message}</p>
            </div>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#aaa', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* CONFIRM MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ backgroundColor: 'var(--dark-brown)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/icon-512.png.png" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Moresave SACCO</span>
            </div>
            <div style={{ padding: '24px 24px 20px' }}>
              <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={modal.onCancel} style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                Cancel
              </button>
              <button onClick={modal.onConfirm} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: 'var(--dark-brown)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn  { from { opacity: 0; transform: scale(0.95); }      to { opacity: 1; transform: scale(1); } }
      `}</style>
    </NotifyContext.Provider>
  );
};

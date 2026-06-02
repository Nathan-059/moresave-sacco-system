import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass" style={{
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '700px',
        borderRadius: '12px',
        overflow: 'hidden',
        animation: 'modalFadeIn 0.3s ease-out'
      }}>
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--warm-white)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--dark-brown)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', color: '#999' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '25px', maxHeight: '80vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default Modal;

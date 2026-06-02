import React from 'react';
import { User, Calendar } from 'lucide-react';

const Navbar = ({ user }) => {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div style={{
      height: '70px',
      backgroundColor: 'var(--dark-brown)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      color: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/icon-512.png.png"
          alt="Moresave SACCO Logo"
          style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>MORESAVE SACCO</span>
          <span style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic' }}>Management System</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Calendar size={16} color="#D4C5B5" />
          <span style={{ color: '#D4C5B5' }}>{today}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 'bold' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--soft-brown)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={18} />
          </div>
          <span>{user?.fullName || user?.username}</span>
          <span style={{ 
            fontSize: '10px', 
            textTransform: 'uppercase', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#D4C5B5'
          }}>
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

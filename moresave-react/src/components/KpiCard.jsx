import React from 'react';

const KpiCard = ({ title, value, color, icon }) => {
  return (
    <div style={{
      backgroundColor: color,
      padding: '20px',
      borderRadius: '12px',
      color: 'white',
      flex: 1,
      minWidth: '220px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'transform 0.3s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', opacity: 0.9 }}>{title}</span>
        {icon}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  );
};

export default KpiCard;

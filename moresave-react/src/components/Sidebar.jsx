import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, PiggyBank, 
  TrendingUp, AlertTriangle, FileText, Search, Settings, LogOut, Headphones 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.role || 'member';

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager', 'loan_officer', 'cashier'] },
    { name: 'Members', path: '/admin/members', icon: <Users size={20} />, roles: ['admin', 'manager', 'loan_officer', 'cashier'] },
    { name: 'Loans', path: '/admin/loans', icon: <CreditCard size={20} />, roles: ['admin', 'manager', 'loan_officer', 'cashier'] },
    { name: 'Savings', path: '/admin/savings', icon: <PiggyBank size={20} />, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Dividends', path: '/admin/dividends', icon: <TrendingUp size={20} />, roles: ['admin', 'manager'] },
    { name: 'Penalties', path: '/admin/penalties', icon: <AlertTriangle size={20} />, roles: ['admin', 'manager', 'loan_officer'] },
    { name: 'Reports', path: '/admin/reports', icon: <FileText size={20} />, roles: ['admin', 'manager', 'loan_officer'] },
    { name: 'Support', path: '/admin/support', icon: <Headphones size={20} />, roles: ['admin', 'manager', 'loan_officer', 'cashier'] },
    { name: 'Audit Log', path: '/admin/audit', icon: <Search size={20} />, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} />, roles: ['admin', 'manager'] },
  ];

  const memberMenu = [
    { name: 'Dashboard', path: '/member', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', path: '/member/transactions', icon: <PiggyBank size={20} /> },
    { name: 'My Loans', path: '/member/loans', icon: <CreditCard size={20} /> },
    { name: 'Apply for Loan', path: '/member/apply-loan', icon: <CreditCard size={20} /> },
    { name: 'My Dividends', path: '/member/dividends', icon: <TrendingUp size={20} /> },
    { name: 'My Profile', path: '/member/profile', icon: <Users size={20} /> },
    { name: 'Contact Support', path: '/member/support', icon: <Headphones size={20} /> },
  ];

  const filteredAdminMenu = adminMenu.filter(item => item.roles.includes(role));
  const menu = role === 'member' ? memberMenu : filteredAdminMenu;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{
      width: '240px',
      backgroundColor: 'var(--mid-brown)',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--dark-brown)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <img
          src="/icon-512.png.png"
          alt="Moresave SACCO"
          style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '15px', margin: 0, fontWeight: 'bold' }}>MORESAVE SACCO</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', margin: '2px 0 0', fontStyle: 'italic' }}>Management System</p>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--warm-white)' : '4px solid transparent',
              transition: 'all 0.3s',
              textDecoration: 'none'
            })}
          >
            <span style={{ marginRight: '12px', display: 'flex' }}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '20px',
          color: '#ff7675',
          backgroundColor: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ marginRight: '12px' }}><LogOut size={20} /></span>
        Logout
      </button>
    </div>
  );
};

export default Sidebar;

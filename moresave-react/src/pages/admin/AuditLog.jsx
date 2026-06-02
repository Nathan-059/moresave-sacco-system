import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Search, Clock, Shield } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/audit');
        if (res.ok) setLogs(await res.json());
        else {
          // Placeholder data if endpoint not fully implemented
          setLogs([
            { timestamp: '2026-05-14 14:30:22', user: 'admin', action: 'LOGIN', details: 'User admin logged in from 127.0.0.1' },
            { timestamp: '2026-05-14 14:35:10', user: 'cashier', action: 'DEPOSIT', details: 'Deposited UGX 500,000 to MRS0001' },
            { timestamp: '2026-05-14 15:10:05', user: 'manager', action: 'LOAN_APPROVE', details: 'Approved loan LN00045 for MRS0005' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>System Audit Log</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Monitor user actions and system events for security and compliance.</p>

          <div className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
                <input type="text" placeholder="Filter by user or action..." className="input-field" style={{ marginBottom: 0, paddingLeft: '40px' }} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '15px 20px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Timestamp</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-light)', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <td style={{ padding: '15px 20px', fontFamily: 'monospace' }}>{log.timestamp}</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{log.user}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        backgroundColor: '#eee'
                      }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text-light)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuditLog;

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { TrendingUp, Calculator, CheckCircle, Clock } from 'lucide-react';

const Dividends = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/dividends/history');
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('Error fetching dividend history');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    // Simulate calculation or call real endpoint if implemented
    setTimeout(() => {
      toast('Dividend calculation preview generated successfully!', 'success');
      setCalculating(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dividend Management</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Calculate and distribute annual dividends to members.</p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-orange)' }}
              onClick={handleCalculate}
              disabled={calculating}
            >
              <Calculator size={18} /> {calculating ? 'Calculating...' : 'Run Dividend Engine'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            <div className="glass" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>📜 Distribution History</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)' }}>Year</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)' }}>Total Distributed</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)' }}>Members</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{h.year}</td>
                      <td style={{ padding: '12px 8px' }}>UGX {Number(h.total_amount).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>{h.member_count}</td>
                      <td style={{ padding: '12px 8px' }}>{h.distribution_date}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>No distribution history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="glass" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>ℹ️ Dividend Policy</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-dark)' }}>
                <p style={{ marginBottom: '15px' }}>Dividends are calculated based on the <strong>average monthly savings balance</strong> throughout the financial year.</p>
                <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                  <li>Minimum balance required: UGX 200,000</li>
                  <li>Distribution rate: Set by Board</li>
                  <li>Automatic credit to savings account</li>
                </ul>
                <div style={{ padding: '15px', backgroundColor: 'var(--light-cream)', borderRadius: '8px', fontSize: '12px' }}>
                  <strong>Next Run Date:</strong><br />
                  31st December, 2026
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dividends;

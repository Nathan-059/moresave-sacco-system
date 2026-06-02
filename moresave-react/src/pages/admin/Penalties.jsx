import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';

const Penalties = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const res = await fetch('/api/reports/overdue');
        if (res.ok) setOverdue(await res.json());
      } catch (err) {
        console.error('Error fetching overdue loans');
      } finally {
        setLoading(false);
      }
    };
    fetchOverdue();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Late Payment Penalties</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Review loans with overdue installments and applied penalties.</p>

          <div className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Loan No</th>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Member Name</th>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Installment</th>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Penalty (2%)</th>
                  <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Total Due</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((loan, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{loan.loan_number}</td>
                    <td style={{ padding: '15px 20px' }}>{loan.full_name}</td>
                    <td style={{ padding: '15px 20px', color: 'var(--accent-red)', fontWeight: '600' }}>{loan.due_date}</td>
                    <td style={{ padding: '15px 20px' }}>UGX {Number(loan.amount_due).toLocaleString()}</td>
                    <td style={{ padding: '15px 20px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>UGX {Number(loan.penalty).toLocaleString()}</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>UGX {Number(parseFloat(loan.amount_due) + parseFloat(loan.penalty)).toLocaleString()}</td>
                  </tr>
                ))}
                {loading && (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>Loading overdue loans...</td></tr>
                )}
                {!loading && overdue.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
                        <Clock size={48} />
                        <h3>No overdue payments found. All members are up to date!</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Penalties;

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { CreditCard, Clock } from 'lucide-react';

const statusStyle = {
  disbursed: { bg: '#e1f7e1', color: '#27ae60' },
  approved:  { bg: '#e1f7e1', color: '#27ae60' },
  pending:   { bg: '#fff4e5', color: '#b45d00' },
  rejected:  { bg: '#ffe1e1', color: '#c0392b' },
  closed:    { bg: '#eee',    color: '#666' },
};

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('/api/portal/loans/' + user.username)
      .then(r => r.json())
      .then(d => { setLoans(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.username]);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>My Loans</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '28px', fontSize: '14px' }}>All your loan applications and their current status.</p>

          <div style={{ display: 'grid', gap: '18px' }}>
            {loans.map((loan) => {
              const s = statusStyle[loan.status] || statusStyle.pending;
              const progress = loan.loan_amount > 0
                ? Math.max(0, Math.min(100, ((loan.loan_amount - loan.outstanding_balance) / loan.loan_amount) * 100))
                : 0;
              return (
                <div key={loan.loan_number} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{loan.loan_number}</span>
                      <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '12px' }}>
                        Applied: {new Date(loan.application_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: s.bg, color: s.color }}>
                      {loan.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>LOAN AMOUNT</div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-green)' }}>UGX {Number(loan.loan_amount).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>MONTHLY PAYMENT</div>
                      <div style={{ fontWeight: '600' }}>UGX {Number(loan.monthly_payment).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>OUTSTANDING</div>
                      <div style={{ fontWeight: '700', color: loan.outstanding_balance > 0 ? '#c0392b' : '#27ae60' }}>
                        UGX {Number(loan.outstanding_balance).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>PERIOD / RATE</div>
                      <div style={{ fontWeight: '600' }}>{loan.repayment_period} months · {loan.interest_rate}%/mo</div>
                    </div>
                    {loan.purpose && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>PURPOSE</div>
                        <div style={{ fontSize: '13px', color: '#555' }}>{loan.purpose}</div>
                      </div>
                    )}
                    {loan.maturity_date && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>MATURITY DATE</div>
                        <div style={{ fontWeight: '600' }}>{new Date(loan.maturity_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {loan.approval_date && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>APPROVED ON</div>
                        <div style={{ fontWeight: '600' }}>{new Date(loan.approval_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>

                  {/* Repayment progress bar (only for active loans) */}
                  {['disbursed', 'approved'].includes(loan.status) && (
                    <div style={{ padding: '0 24px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                        <span>Repayment Progress</span>
                        <span>{progress.toFixed(1)}% paid</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: progress + '%', backgroundColor: progress >= 100 ? '#27ae60' : 'var(--mid-brown)', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && loans.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px', opacity: 0.5 }}>
                <CreditCard size={48} style={{ marginBottom: '15px' }} />
                <h3>No loan records found</h3>
                <p style={{ fontSize: '14px' }}>You have not applied for any loans yet.</p>
              </div>
            )}
            {loading && <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>Loading...</div>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyLoans;

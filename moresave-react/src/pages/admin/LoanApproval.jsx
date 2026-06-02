import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { useNotify } from '../../context/NotifyContext';
import { Check, X, Eye, Clock, TrendingUp, Users, Shield, Briefcase, AlertCircle } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid var(--light-brown, #f0e8df)' }}>
      <Icon size={16} color="var(--mid-brown)" />
      <span style={{ fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mid-brown)' }}>{title}</span>
    </div>
    {children}
  </div>
);

const InfoGrid = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
    {items.map(({ label, value, highlight }) => (
      <div key={label} style={{ backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>{label}</div>
        <div style={{ fontWeight: '600', fontSize: '14px', color: highlight ? 'var(--accent-green)' : '#333' }}>{value ?? '—'}</div>
      </div>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    disbursed: { bg: '#e1f7e1', color: '#27ae60' },
    approved:  { bg: '#e1f7e1', color: '#27ae60' },
    rejected:  { bg: '#ffe1e1', color: '#c0392b' },
    pending:   { bg: '#fff4e5', color: '#b45d00' },
    closed:    { bg: '#eee',    color: '#666' },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: c.bg, color: c.color }}>
      {status?.toUpperCase()}
    </span>
  );
};

const LoanApproval = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast, confirm } = useNotify();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/loans/pending');
      const data = await response.json();
      setLoans(data);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (loanNumber) => {
    setReviewLoading(true);
    setIsReviewOpen(true);
    setReviewData(null);
    try {
      const res = await fetch(`/api/loans/${loanNumber}/review`);
      const data = await res.json();
      setReviewData(data);
    } catch (err) {
      toast('Error loading loan details', 'error');
      setIsReviewOpen(false);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApprove = async (loanNumber) => {
    const ok = await confirm(`Approve loan ${loanNumber}? Funds will be disbursed immediately.`);
    if (!ok) return;
    try {
      const response = await fetch(`/api/loans/${loanNumber}/approve`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast('Loan approved and disbursed successfully!', 'success');
        setIsReviewOpen(false);
        fetchPending();
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error processing approval', 'error');
    }
  };

  const handleReject = async (loanNumber) => {
    const ok = await confirm(`Are you sure you want to REJECT loan ${loanNumber}?`);
    if (!ok) return;
    try {
      const response = await fetch(`/api/loans/${loanNumber}/reject`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast('Loan application rejected.', 'warning');
        setIsReviewOpen(false);
        fetchPending();
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error processing rejection', 'error');
    }
  };

  const { loan, savingsHistory, savingsSnapshots, nextOfKin, collateral, loanHistory } = reviewData || {};

  // Savings adequacy check: balance >= 30% of loan amount is a common SACCO rule
  const savingsRatio = loan ? ((loan.savings_balance / loan.loan_amount) * 100).toFixed(1) : 0;
  const savingsOk = savingsRatio >= 30;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Loan Approvals</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Review and process pending loan applications.</p>

          {/* Review Modal */}
          <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Loan Application Review">
            {reviewLoading && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading member details...</div>
            )}
            {!reviewLoading && reviewData && (
              <div style={{ padding: '4px 8px', maxHeight: '75vh', overflowY: 'auto' }}>

                {/* Loan Summary Banner */}
                <div style={{ backgroundColor: '#4E3526', color: 'white', borderRadius: '10px', padding: '18px 22px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>LOAN APPLICATION — {loan.loan_number}</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{loan.full_name}</div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>{loan.member_number} · Applied {new Date(loan.application_date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7dde92' }}>UGX {Number(loan.loan_amount).toLocaleString()}</div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>{loan.repayment_period} months · UGX {Number(loan.monthly_payment).toLocaleString()}/mo</div>
                  </div>
                </div>

                {/* Eligibility Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ borderRadius: '8px', padding: '12px 14px', backgroundColor: savingsOk ? '#e1f7e1' : '#ffe1e1', borderLeft: `4px solid ${savingsOk ? '#27ae60' : '#c0392b'}` }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>SAVINGS RATIO</div>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: savingsOk ? '#27ae60' : '#c0392b' }}>{savingsRatio}%</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{savingsOk ? '✓ Meets 30% threshold' : '✗ Below 30% threshold'}</div>
                  </div>
                  <div style={{ borderRadius: '8px', padding: '12px 14px', backgroundColor: collateral?.length > 0 ? '#e1f7e1' : '#fff4e5', borderLeft: `4px solid ${collateral?.length > 0 ? '#27ae60' : '#e67e22'}` }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>COLLATERAL</div>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: collateral?.length > 0 ? '#27ae60' : '#e67e22' }}>{collateral?.length || 0} item{collateral?.length !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{collateral?.length > 0 ? '✓ Collateral provided' : '⚠ No collateral'}</div>
                  </div>
                  <div style={{ borderRadius: '8px', padding: '12px 14px', backgroundColor: nextOfKin?.length > 0 ? '#e1f7e1' : '#fff4e5', borderLeft: `4px solid ${nextOfKin?.length > 0 ? '#27ae60' : '#e67e22'}` }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>NEXT OF KIN</div>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: nextOfKin?.length > 0 ? '#27ae60' : '#e67e22' }}>{nextOfKin?.length || 0} listed</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{nextOfKin?.length > 0 ? '✓ On record' : '⚠ None on record'}</div>
                  </div>
                </div>

                {/* Member Info */}
                <Section title="Member Information" icon={Briefcase}>
                  <InfoGrid items={[
                    { label: 'Phone', value: loan.phone_number },
                    { label: 'National ID', value: loan.national_id },
                    { label: 'Occupation', value: loan.occupation },
                    { label: 'Address', value: loan.address },
                    { label: 'Member Since', value: new Date(loan.joining_date).toLocaleDateString() },
                    { label: 'Account Status', value: loan.membership_status?.toUpperCase() },
                  ]} />
                  {loan.purpose && (
                    <div style={{ marginTop: '12px', backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>LOAN PURPOSE</div>
                      <div style={{ fontSize: '14px', color: '#333' }}>{loan.purpose}</div>
                    </div>
                  )}
                </Section>

                {/* Savings */}
                <Section title="Savings Position" icon={TrendingUp}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>CURRENT BALANCE</div>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-green)' }}>UGX {Number(loan.savings_balance).toLocaleString()}</div>
                    </div>
                    <div style={{ backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>ACCOUNT NUMBER</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{loan.account_number}</div>
                    </div>
                  </div>

                  {savingsSnapshots?.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>MONTHLY BALANCE HISTORY</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[...savingsSnapshots].reverse().map((s, i) => (
                          <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '6px', padding: '8px 12px', textAlign: 'center', minWidth: '80px' }}>
                            <div style={{ fontSize: '10px', color: '#aaa' }}>{new Date(s.snap_year, s.snap_month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })}</div>
                            <div style={{ fontWeight: '600', fontSize: '12px', color: '#333' }}>UGX {Number(s.balance).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {savingsHistory?.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', color: '#999', margin: '14px 0 8px' }}>RECENT TRANSACTIONS</div>
                      <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                        {savingsHistory.map((t, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < savingsHistory.length - 1 ? '1px solid #f5f5f5' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: t.transaction_type === 'deposit' ? '#27ae60' : '#c0392b' }}>
                                {t.transaction_type === 'deposit' ? '↑' : '↓'} {t.transaction_type.toUpperCase()}
                              </span>
                              <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '8px' }}>{new Date(t.transaction_date).toLocaleDateString()}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: t.transaction_type === 'deposit' ? '#27ae60' : '#c0392b' }}>
                                {t.transaction_type === 'deposit' ? '+' : '-'}UGX {Number(t.amount).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '11px', color: '#aaa' }}>Bal: UGX {Number(t.balance_after).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {!savingsHistory?.length && !savingsSnapshots?.length && (
                    <div style={{ color: '#aaa', fontSize: '13px', padding: '10px 0' }}>No savings history found.</div>
                  )}
                </Section>

                {/* Next of Kin */}
                <Section title="Next of Kin" icon={Users}>
                  {nextOfKin?.length > 0 ? nextOfKin.map((k, i) => (
                    <div key={i} style={{ backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{k.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{k.relationship}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '13px', color: '#555' }}>
                          <div>{k.phone_number}</div>
                          {k.national_id && <div style={{ fontSize: '11px', color: '#aaa' }}>NIN: {k.national_id}</div>}
                        </div>
                      </div>
                      {k.address && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>{k.address}</div>}
                    </div>
                  )) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e67e22', fontSize: '13px', padding: '10px', backgroundColor: '#fff4e5', borderRadius: '8px' }}>
                      <AlertCircle size={16} /> No next of kin on record for this member.
                    </div>
                  )}
                </Section>

                {/* Collateral */}
                <Section title="Collateral" icon={Shield}>
                  {collateral?.length > 0 ? collateral.map((c, i) => (
                    <div key={i} style={{ backgroundColor: '#f9f6f2', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.collateral_type}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.description}</div>
                          {c.document_ref && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Ref: {c.document_ref}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent-green)' }}>UGX {Number(c.estimated_value).toLocaleString()}</div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e67e22', fontSize: '13px', padding: '10px', backgroundColor: '#fff4e5', borderRadius: '8px' }}>
                      <AlertCircle size={16} /> No collateral submitted for this loan.
                    </div>
                  )}
                </Section>

                {/* Loan History */}
                <Section title="Past Loan History" icon={Clock}>
                  {loanHistory?.length > 0 ? (
                    <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                      {loanHistory.map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < loanHistory.length - 1 ? '1px solid #f5f5f5' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{l.loan_number}</div>
                            <div style={{ fontSize: '11px', color: '#aaa' }}>{new Date(l.application_date).toLocaleDateString()} · {l.repayment_period} months</div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>UGX {Number(l.loan_amount).toLocaleString()}</span>
                            <StatusBadge status={l.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#aaa', fontSize: '13px', padding: '10px 0' }}>No previous loans on record.</div>
                  )}
                </Section>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid #eee', marginTop: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '14px', backgroundColor: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                    onClick={() => handleApprove(loan.loan_number)}
                  >
                    <Check size={18} /> Approve & Disburse
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '14px', backgroundColor: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                    onClick={() => handleReject(loan.loan_number)}
                  >
                    <X size={18} /> Reject Application
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Loan Cards List */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {loans.map((loan) => (
              <div key={loan.loan_number} className="glass" style={{
                backgroundColor: 'white',
                padding: '22px 25px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>MEMBER</span>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{loan.full_name}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#aaa' }}>{loan.member_number}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>AMOUNT</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-green)', fontSize: '15px' }}>UGX {Number(loan.loan_amount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>PERIOD</span>
                    <span>{loan.repayment_period} Months</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>MONTHLY PAY</span>
                    <span style={{ fontWeight: '600' }}>UGX {Number(loan.monthly_payment).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>APPLIED</span>
                    <span style={{ fontSize: '13px' }}>{new Date(loan.application_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--mid-brown)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleReview(loan.loan_number)}
                  >
                    <Eye size={16} /> Review
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--accent-green)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleApprove(loan.loan_number)}
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--accent-red)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleReject(loan.loan_number)}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}

            {!loading && loans.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                <Clock size={48} style={{ marginBottom: '15px' }} />
                <h3>No pending applications</h3>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>Loading...</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoanApproval;

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { History, ArrowDownCircle, ArrowUpCircle, Clock, Upload, Smartphone, X, Shield } from 'lucide-react';

/* ─── Inline PesaPal Modal (goes straight to iframe, no double popup) ─── */
const MobileMoneyModal = ({ isOpen, onClose, memberNumber, amount, phoneNumber, provider, description, onSuccess, onError }) => {
  const [step, setStep] = useState('loading'); // loading | iframe | done
  const [paymentUrl, setPaymentUrl] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Reset and trigger API call whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStep('loading');
    setPaymentUrl('');
    setTrackingId('');

    const handleMsg = (e) => {
      if (e.data?.type === 'PESAPAL_PAYMENT_RESULT') {
        const { success, status, trackingId: tid } = e.data.data;
        if (success && status === 'COMPLETED') {
          onSuccess({ trackingId: tid });
        } else {
          onError({ message: `Payment ${status || 'failed'}. Check your phone or try again.` });
        }
        onClose();
      }
    };
    window.addEventListener('message', handleMsg);

    // Immediately call PesaPal API
    fetch('/api/pesapal/submit-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberNumber, amount, paymentMethod: 'mobile_money', phoneNumber, provider, description, usePopup: true })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.redirect_url) {
          setPaymentUrl(data.redirect_url);
          setTrackingId(data.order_tracking_id);
          setStep('iframe');
        } else {
          onError({ message: data.message || 'Failed to initiate payment' });
          onClose();
        }
      })
      .catch(() => {
        onError({ message: 'Network error. Check your connection and try again.' });
        onClose();
      });

    return () => window.removeEventListener('message', handleMsg);
  }, [isOpen]); // only re-run when isOpen changes

  const verifyNow = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/pesapal/verify-status/${trackingId}`);
      const data = await res.json();
      if (data.success && data.status === 'COMPLETED') {
        onSuccess({ trackingId });
        onClose();
      } else {
        onError({ message: `Status: ${data.status || 'Pending'}. If you paid, wait a moment and try again.` });
      }
    } catch {
      onError({ message: 'Error verifying. Please contact support.' });
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#667eea" />
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Mobile Money Payment — {provider} Uganda</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#666" /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #eee', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#666' }}>Connecting to PesaPal...</p>
            </div>
          )}

          {step === 'iframe' && (
            <>
              <div style={{ background: '#fff8e1', padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', color: '#856404' }}>
                📱 <strong>Check your phone ({phoneNumber})!</strong> A {provider} mobile money prompt has been sent. Enter your PIN on your phone to complete.
              </div>
              <div style={{ border: '2px solid #e1e5e9', borderRadius: '8px', overflow: 'hidden', height: '420px' }}>
                <iframe src={paymentUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PesaPal Payment" />
              </div>
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button onClick={verifyNow} disabled={verifying} style={{ padding: '9px 24px', background: verifying ? '#aaa' : '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: verifying ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  {verifying ? 'Checking...' : "✅ I've paid — Verify Now"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─── Main Transactions Page ─── */
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMMModal, setShowMMModal] = useState(false);

  const [requestType, setRequestType] = useState('deposit');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [receipt, setReceipt] = useState(null);
  const receiptRef = useRef();

  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  const fetchData = async () => {
    try {
      const profileRes = await fetch(`/api/portal/profile/${user.username}`);
      const prof = await profileRes.json();
      setProfile(prof);
      setPhoneNumber(prof.phone_number || '');

      const [txRes, reqRes] = await Promise.all([
        fetch(`/api/savings/${prof.account_number}/history`),
        fetch(`/api/savings/requests/member/${user.username}`)
      ]);
      setTransactions(await txRes.json());
      setRequests(await reqRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast('Enter a valid amount', 'warning');
    if (!desc.trim()) return toast('Please provide a reason/description', 'warning');

    // Mobile money deposit → open PesaPal modal directly
    if (requestType === 'deposit' && paymentMethod === 'mobile_money') {
      if (!phoneNumber) return toast('Enter your mobile money number', 'warning');
      if (!/^(070|077|078|075|076|020|039)\d{7}$/.test(phoneNumber))
        return toast('Enter a valid Ugandan mobile money number (e.g. 0772123456)', 'warning');
      setShowMMModal(true);
      return;
    }

    // Cash deposit/withdrawal or mobile money withdrawal → goes to pending
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('memberNumber', profile.member_number);
      formData.append('type', requestType);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('description', desc);
      if (paymentMethod === 'mobile_money') {
        formData.append('phoneNumber', phoneNumber);
        formData.append('provider', provider);
      } else {
        formData.append('phoneNumber', '');
        formData.append('provider', '');
      }
      if (receipt) formData.append('receipt', receipt);

      const res = await fetch('/api/savings/request', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        toast(`✅ ${requestType === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted! Pending admin approval.`, 'success');
        setAmount(''); setDesc(''); setReceipt(null);
        if (receiptRef.current) receiptRef.current.value = '';
        fetchData();
      } else {
        toast(data.message || 'Failed to submit request', 'error');
      }
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMMSuccess = () => {
    toast('🎉 Mobile Money Payment Completed! Your account has been credited.', 'success');
    setAmount(''); setDesc('');
    fetchData();
  };

  const handleMMError = (err) => toast(`❌ ${err.message}`, 'error');

  const statusBadge = (s) => ({
    pending:  { bg: '#fff4e5', color: '#e67e22' },
    approved: { bg: '#e1f7e1', color: '#27ae60' },
    rejected: { bg: '#ffebeb', color: '#c0392b' }
  }[s] || { bg: '#eee', color: '#666' });

  return (
    <div style={{ display: 'flex' }}>
      <MobileMoneyModal
        isOpen={showMMModal}
        onClose={() => setShowMMModal(false)}
        memberNumber={profile?.member_number}
        amount={amount}
        phoneNumber={phoneNumber}
        provider={provider}
        description={desc || 'Savings Deposit'}
        onSuccess={handleMMSuccess}
        onError={handleMMError}
      />

      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>My Savings Portal</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '28px', alignItems: 'start' }}>

            {/* ── LEFT: Request Form ── */}
            <div className="glass" style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '18px', fontSize: '16px', fontWeight: 'bold' }}>💸 Request Transaction</h3>
              <form onSubmit={handleSubmit}>

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>Transaction Type</label>
                <select className="input-field" value={requestType} onChange={e => setRequestType(e.target.value)} style={{ width: '100%', marginBottom: '12px' }}>
                  <option value="deposit">📥 Deposit Savings</option>
                  <option value="withdrawal">📤 Withdraw Savings</option>
                </select>

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>Payment Method</label>
                <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', marginBottom: '12px' }}>
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                </select>

                {paymentMethod === 'mobile_money' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>SIM Provider</label>
                    <select className="input-field" value={provider} onChange={e => setProvider(e.target.value)} style={{ width: '100%', marginBottom: '8px' }}>
                      <option value="MTN">MTN Uganda</option>
                      <option value="Airtel">Airtel Uganda</option>
                    </select>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>Mobile Number</label>
                    <input type="text" className="input-field" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g. 0772123456" style={{ marginBottom: 0 }} />
                  </div>
                )}

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>Amount (UGX)</label>
                <input type="number" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" style={{ marginBottom: '12px' }} />

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>Reason / Description</label>
                <input type="text" className="input-field" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Purpose of transaction" style={{ marginBottom: '12px' }} />

                {/* Receipt upload — for cash deposits */}
                {paymentMethod === 'cash' && requestType === 'deposit' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold' }}>
                      <Upload size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Upload Receipt (optional)
                    </label>
                    <input
                      ref={receiptRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setReceipt(e.target.files[0])}
                      style={{ width: '100%', fontSize: '13px', padding: '6px', border: '1px solid #ccc', borderRadius: '6px' }}
                    />
                    {receipt && <p style={{ fontSize: '12px', color: '#27ae60', marginTop: '4px' }}>✅ {receipt.name}</p>}
                  </div>
                )}

                {/* Info box */}
                <div style={{ background: paymentMethod === 'mobile_money' && requestType === 'deposit' ? '#e8f5e9' : '#e3f2fd', padding: '10px', borderRadius: '6px', fontSize: '12px', color: paymentMethod === 'mobile_money' && requestType === 'deposit' ? '#2e7d32' : '#1565c0', marginBottom: '14px' }}>
                  {paymentMethod === 'mobile_money' && requestType === 'deposit'
                    ? '📱 Clicking Submit will send a payment prompt to your phone. Enter your PIN to complete.'
                    : '⏳ Your request will be reviewed and approved by an admin before your balance is updated.'}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--mid-brown)' }} disabled={submitting}>
                  {submitting ? 'SUBMITTING...' : paymentMethod === 'mobile_money' && requestType === 'deposit' ? '📱 PAY VIA MOBILE MONEY' : 'SUBMIT REQUEST'}
                </button>
              </form>
            </div>

            {/* ── RIGHT: Tables ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Requests */}
              <div className="glass" style={{ background: 'white', borderRadius: '12px', padding: '22px' }}>
                <h3 style={{ marginBottom: '14px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--accent-orange)" /> My Requests
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        {['Date','Type','Method','Amount','Status','Receipt'].map(h => (
                          <th key={h} style={{ padding: '9px 10px', color: 'var(--text-light)', textTransform: 'uppercase', textAlign: 'left', fontSize: '11px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r, i) => {
                        const s = statusBadge(r.status);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <td style={{ padding: '9px 10px' }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                            <td style={{ padding: '9px 10px', fontWeight: 'bold', color: r.request_type === 'deposit' ? '#27ae60' : '#c0392b' }}>{r.request_type.toUpperCase()}</td>
                            <td style={{ padding: '9px 10px' }}>{r.payment_method === 'mobile_money' ? `📱 ${r.sim_provider}` : '💵 Cash'}</td>
                            <td style={{ padding: '9px 10px', fontWeight: 'bold' }}>UGX {Number(r.amount).toLocaleString()}</td>
                            <td style={{ padding: '9px 10px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: s.bg, color: s.color }}>{r.status.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: '9px 10px' }}>
                              {r.receipt_url
                                ? <a href={r.receipt_url} target="_blank" rel="noreferrer" style={{ color: '#667eea', fontSize: '12px' }}>View</a>
                                : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {requests.length === 0 && (
                        <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>No requests yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approved Ledger */}
              <div className="glass" style={{ background: 'white', borderRadius: '12px', padding: '22px' }}>
                <h3 style={{ marginBottom: '14px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--mid-brown)" /> My Approved Ledger
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        {['Date','Type','Description','Amount','Balance After'].map(h => (
                          <th key={h} style={{ padding: '9px 10px', color: 'var(--text-light)', textTransform: 'uppercase', textAlign: 'left', fontSize: '11px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                          <td style={{ padding: '9px 10px' }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {t.transaction_type === 'deposit'
                                ? <ArrowDownCircle size={13} color="#27ae60" />
                                : <ArrowUpCircle size={13} color="#c0392b" />}
                              <span style={{ fontWeight: 'bold', color: t.transaction_type === 'deposit' ? '#27ae60' : '#c0392b', fontSize: '12px' }}>{t.transaction_type.toUpperCase()}</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 10px', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                          <td style={{ padding: '9px 10px', fontWeight: 'bold' }}>UGX {Number(t.amount).toLocaleString()}</td>
                          <td style={{ padding: '9px 10px', fontWeight: 'bold', color: 'var(--mid-brown)' }}>UGX {Number(t.balance_after).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!loading && transactions.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>No approved transactions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;

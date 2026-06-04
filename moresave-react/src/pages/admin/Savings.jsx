import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { Search, Plus, Minus, History, Check, X, Clock, Shield } from 'lucide-react';

// ── Inline Mobile Money Modal (same as member Transactions page) ──
// Opens straight to PesaPal iframe — no double popup
const MobileMoneyModal = ({ isOpen, onClose, memberNumber, amount, phoneNumber, provider, description, onSuccess, onError }) => {
  const [step, setStep] = useState('loading');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('loading');
    setPaymentUrl('');
    setTrackingId('');

    const handleMsg = (e) => {
      if (e.data?.type === 'PESAPAL_PAYMENT_RESULT') {
        const { success, status, trackingId: tid } = e.data.data;
        if (success && status === 'COMPLETED') onSuccess({ trackingId: tid });
        else onError({ message: `Payment ${status || 'failed'}. Check phone or try again.` });
        onClose();
      }
    };
    window.addEventListener('message', handleMsg);

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
      .catch(() => { onError({ message: 'Network error. Try again.' }); onClose(); });

    return () => window.removeEventListener('message', handleMsg);
  }, [isOpen]);

  const verifyNow = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/pesapal/verify-status/${trackingId}`);
      const data = await res.json();
      if (data.success && data.status === 'COMPLETED') { onSuccess({ trackingId }); onClose(); }
      else onError({ message: `Status: ${data.status || 'Pending'}. Wait and try again.` });
    } catch { onError({ message: 'Error verifying. Contact support.' }); }
    finally { setVerifying(false); }
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#667eea" />
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Mobile Money Payment — {provider} Uganda</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#666" /></button>
        </div>
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
                📱 <strong>Check phone ({phoneNumber})!</strong> A {provider} mobile money prompt has been sent. Enter your PIN on your phone.
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

const Savings = () => {
  const [memberNo, setMemberNo] = useState('');
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPesaPalPopup, setShowPesaPalPopup] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast, confirm } = useNotify();

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch('/api/savings/requests/pending');
      if (res.ok) setPendingRequests(await res.json());
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleActionRequest = async (id, action) => {
    const ok = await confirm(`Are you sure you want to ${action} this transaction request?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/savings/requests/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.user_id || 1 })
      });
      const data = await res.json();
      if (data.success) {
        toast(`Transaction request ${action}d successfully!`, 'success');
        fetchPendingRequests();
        if (account) findAccount();
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error updating transaction request', 'error');
    }
  };

  const findAccount = async () => {
    if (!memberNo) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/savings/${memberNo}`);
      if (res.ok) {
        const data = await res.json();
        setAccount(data);
        setPhoneNumber(data.phone_number || '');
      } else {
        toast('Member not found', 'warning');
      }
    } catch (err) {
      toast('Error fetching account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (type) => {
    if (!amount || amount <= 0) return toast('Enter a valid amount', 'warning');
    
    if (paymentMethod === 'mobile_money') {
      if (!phoneNumber) return toast('Enter a mobile money phone number', 'warning');
      if (!/^(070|077|078|075|076|020|039)\d{7}$/.test(phoneNumber)) {
        return toast('Please enter a valid Ugandan mobile money number (e.g., 0772123456)', 'warning');
      }
      
      if (type === 'deposit') {
        // Open PesaPal popup for mobile money deposits
        setShowPesaPalPopup(true);
        return;
      } else if (type === 'withdrawal') {
        // Mobile Money Withdrawal - Send money directly to phone
        const ok = await confirm(`Confirm mobile money withdrawal of UGX ${Number(amount).toLocaleString()} to ${phoneNumber}?`);
        if (!ok) return;

        try {
          const res = await fetch('/api/pesapal/submit-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberNumber: memberNo,
              amount,
              phoneNumber,
              provider,
              description: desc || 'Staff-initiated withdrawal'
            })
          });
          const data = await res.json();
          if (data.success) {
            if (data.requiresApproval) {
              toast(`Mobile money withdrawal request submitted for approval. Money will be sent to ${phoneNumber} once processed.`, 'info');
            } else {
              toast(`Mobile money withdrawal initiated! UGX ${Number(amount).toLocaleString()} will be sent to ${phoneNumber} shortly.`, 'success');
            }
            setAmount('');
            setDesc('');
            findAccount();
            fetchPendingRequests();
          } else {
            toast(data.message, 'error');
          }
        } catch (err) {
          toast('Error processing mobile money withdrawal', 'error');
        }
        return;
      }
    }

    const ok = await confirm(`Confirm ${type} of UGX ${Number(amount).toLocaleString()}?`);
    if (!ok) return;

    let finalDesc = desc;
    if (paymentMethod === 'mobile_money') {
      finalDesc = `${desc ? desc + ' ' : ''}[Mobile Money - ${provider}: ${phoneNumber}]`;
    } else {
      finalDesc = `${desc ? desc + ' ' : ''}[Cash]`;
    }

    try {
      const res = await fetch('/api/savings/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberNumber: memberNo, type, amount, description: finalDesc })
      });
      const data = await res.json();
      if (data.success) {
        toast('Transaction recorded successfully!', 'success');
        setAmount('');
        setDesc('');
        findAccount();
        fetchPendingRequests();
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error recording transaction', 'error');
    }
  };

  const handlePesaPalSuccess = (result) => {
    toast('🎉 Mobile Money Payment Completed!\n\nThe payment has been processed securely and credited to the member account.', 'success');
    setAmount('');
    setDesc('');
    findAccount();
    fetchPendingRequests();
  };

  const handlePesaPalError = (error) => {
    toast(`❌ Payment Error: ${error.message}`, 'error');
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Mobile Money Modal — inline, no external component needed */}
      <MobileMoneyModal
        isOpen={showPesaPalPopup}
        onClose={() => setShowPesaPalPopup(false)}
        memberNumber={memberNo}
        amount={amount}
        phoneNumber={phoneNumber}
        provider={provider}
        description={desc || 'Staff-initiated Savings Deposit'}
        onSuccess={handlePesaPalSuccess}
        onError={handlePesaPalError}
      />

      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Savings & Transactions</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>🔍 Find Member Account</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter Member No (e.g. MRS0001)" 
                  value={memberNo}
                  onChange={(e) => setMemberNo(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <button className="btn btn-primary" onClick={findAccount} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {account && (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--light-cream)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>ACCOUNT HOLDER</p>
                  <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '15px' }}>{account.full_name}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>CURRENT BALANCE</p>
                  <p style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--accent-green)' }}>UGX {Number(account.current_balance).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', opacity: account ? 1 : 0.5, pointerEvents: account ? 'all' : 'none' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>💸 New Transaction</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</label>
                <select 
                  className="input-field" 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px' }}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                </select>
              </div>

              {paymentMethod === 'mobile_money' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>SIM Provider</label>
                    <select 
                      className="input-field" 
                      value={provider} 
                      onChange={(e) => setProvider(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px' }}
                    >
                      <option value="MTN">MTN Uganda</option>
                      <option value="Airtel">Airtel Uganda</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>MM Phone Number</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="e.g. 0772123456" 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Amount (UGX)</label>
                <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ marginBottom: 0 }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <input type="text" className="input-field" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deposit/Withdrawal reason" style={{ marginBottom: 0 }} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleTransaction('deposit')}>
                  <Plus size={18} /> Deposit
                </button>
                <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleTransaction('withdrawal')}>
                  <Minus size={18} /> Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Pending Member Requests */}
          <div className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--accent-orange)" /> ⌛ Pending Member Deposit/Withdrawal Requests
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Account No</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Payment Details</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Reason</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Receipt</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Requested At</th>
                    <th style={{ padding: '12px 15px', color: 'var(--text-light)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => (
                    <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                        {req.full_name} <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 'normal', display: 'block' }}>{req.member_number}</span>
                      </td>
                      <td style={{ padding: '12px 15px' }}>{req.account_number}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          backgroundColor: req.request_type === 'deposit' ? '#e1f7e1' : '#ffebeb',
                          color: req.request_type === 'deposit' ? '#27ae60' : '#c0392b'
                        }}>
                          {req.request_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>UGX {Number(req.amount).toLocaleString()}</td>
                      <td style={{ padding: '12px 15px' }}>
                        {req.payment_method === 'mobile_money' ? (
                          <span>📱 {req.sim_provider} <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>{req.phone_number}</span></span>
                        ) : (
                          <span>💵 Cash</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>{req.description}</td>
                      <td style={{ padding: '12px 15px' }}>
                        {req.receipt_url
                          ? <a href={req.receipt_url} target="_blank" rel="noreferrer" style={{ color: '#667eea', fontWeight: 'bold', fontSize: '12px' }}>📎 View</a>
                          : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 15px' }}>{new Date(req.requested_at).toLocaleString()}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button 
                            className="btn" 
                            style={{ 
                              backgroundColor: 'var(--accent-green)', 
                              color: 'white', 
                              padding: '5px 10px', 
                              fontSize: '11px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleActionRequest(req.request_id, 'approve')}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            className="btn" 
                            style={{ 
                              backgroundColor: 'var(--accent-red)', 
                              color: 'white', 
                              padding: '5px 10px', 
                              fontSize: '11px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleActionRequest(req.request_id, 'reject')}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingRequests.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                        No pending transaction requests from members.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Savings;

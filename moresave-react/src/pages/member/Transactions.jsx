import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import PesaPalPopup from '../../components/PesaPalPopup';
import { useNotify } from '../../context/NotifyContext';
import { History, ArrowDownCircle, ArrowUpCircle, Plus, Clock } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showPesaPalPopup, setShowPesaPalPopup] = useState(false);
  
  // Form states
  const [requestType, setRequestType] = useState('deposit');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  const fetchData = async () => {
    try {
      const profileRes = await fetch(`/api/portal/profile/${user.username}`);
      const prof = await profileRes.json();
      setProfile(prof);
      setPhoneNumber(prof.phone_number || '');

      const res = await fetch(`/api/savings/${prof.account_number}/history`);
      const data = await res.json();
      setTransactions(data);

      const reqRes = await fetch(`/api/savings/requests/member/${user.username}`);
      const reqData = await reqRes.json();
      setRequests(reqData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const trackingId = searchParams.get('OrderTrackingId');
      
      if (trackingId) {
        setVerifyingPayment(true);
        try {
          const res = await fetch(`/api/pesapal/verify-status/${trackingId}`);
          const pesapalData = await res.json();
          if (pesapalData.payment_status_description === 'COMPLETED') {
            toast('🎉 Savings Deposit Completed!\n\nYour payment has been processed securely via PesaPal and credited to your account.', 'success');
          } else {
            toast('❌ Transaction was not completed or was cancelled on PesaPal.', 'error');
          }
          // Clear query params
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Error verifying payment status:', err);
        } finally {
          setVerifyingPayment(false);
        }
      }
      
      fetchData();
    };

    checkPaymentStatus();
  }, [user.username]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast('Enter a valid amount', 'warning');
    
    if (requestType === 'deposit' && paymentMethod === 'mobile_money') {
      if (!phoneNumber) return toast('Enter a mobile money phone number', 'warning');
      if (!/^(070|077|078|075|076|020|039)\d{7}$/.test(phoneNumber)) {
        return toast('Please enter a valid Ugandan mobile money number (e.g., 0772123456)', 'warning');
      }
      
      // Open PesaPal popup for mobile money deposits
      setShowPesaPalPopup(true);
      return;
    }

    setSubmitting(true);
    try {
      if (requestType === 'deposit') {
        // Cash Deposit (Instant)
        const finalDesc = `${desc ? desc + ' ' : ''}[Cash]`;

        const res = await fetch('/api/savings/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberNumber: profile.member_number,
            type: 'deposit',
            amount,
            description: finalDesc
          })
        });
        const data = await res.json();
        if (data.success) {
          toast(`Deposit of UGX ${Number(amount).toLocaleString()} processed successfully!`, 'success');
          setAmount('');
          setDesc('');
          fetchData();
        } else {
          toast(data.message, 'error');
        }
      } else {
        // Withdrawals - check if mobile money (send to phone) or cash
        if (paymentMethod === 'mobile_money') {
          // Mobile Money Withdrawal - Send money directly to phone
          const res = await fetch('/api/pesapal/submit-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberNumber: profile.member_number,
              amount,
              phoneNumber,
              provider,
              description: desc || 'Savings Withdrawal'
            })
          });
          const data = await res.json();
          if (data.success) {
            if (data.requiresApproval) {
              toast(`Mobile money withdrawal request of UGX ${Number(amount).toLocaleString()} submitted for admin approval. Money will be sent to ${phoneNumber} once approved.`, 'info');
            } else {
              toast(`Mobile money withdrawal of UGX ${Number(amount).toLocaleString()} initiated! Money will be sent to ${phoneNumber} shortly.`, 'success');
            }
            setAmount('');
            setDesc('');
            fetchData();
          } else {
            toast(data.message, 'error');
          }
        } else {
          // Cash withdrawal - requires admin approval
          const res = await fetch('/api/savings/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberNumber: profile.member_number,
              type: 'withdrawal',
              amount,
              paymentMethod,
              phoneNumber: null,
              provider: null,
              description: desc
            })
          });
          const data = await res.json();
          if (data.success) {
            toast(`Cash withdrawal request of UGX ${Number(amount).toLocaleString()} submitted successfully! It is pending approval by the loan officer/admin.`, 'success');
            setAmount('');
            setDesc('');
            fetchData();
          } else {
            toast(data.message, 'error');
          }
        }
      }
    } catch (err) {
      toast('Error processing transaction request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePesaPalSuccess = (result) => {
    toast('🎉 Mobile Money Payment Completed!\n\nYour payment has been processed securely and credited to your account.', 'success');
    setAmount('');
    setDesc('');
    fetchData();
  };

  const handlePesaPalError = (error) => {
    toast(`❌ Payment Error: ${error.message}`, 'error');
  };

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      {/* PesaPal Popup */}
      <PesaPalPopup
        isOpen={showPesaPalPopup}
        onClose={() => setShowPesaPalPopup(false)}
        memberNumber={profile?.member_number}
        amount={amount}
        phoneNumber={phoneNumber}
        provider={provider}
        description={desc || 'Sacco Savings Deposit'}
        onSuccess={handlePesaPalSuccess}
        onError={handlePesaPalError}
      />

      {verifyingPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid var(--accent-green)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Verifying Transaction Status</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Please wait while we verify your payment with PesaPal...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>My Savings Portal</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            {/* Left Column: Transaction Request Form */}
            <div className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>💸 Request Transaction</h3>
              <form onSubmit={handleRequestSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Transaction Type</label>
                  <select 
                    className="input-field" 
                    value={requestType} 
                    onChange={(e) => setRequestType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px' }}
                  >
                    <option value="deposit">📥 Deposit Savings</option>
                    <option value="withdrawal">📤 Withdraw Savings</option>
                  </select>
                </div>

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
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
                  <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" style={{ marginBottom: 0 }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Reason / Description</label>
                  <input type="text" className="input-field" value={desc} onChange={(e) => setDesc(e.target.value)} required placeholder="Purpose of transaction" style={{ marginBottom: 0 }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--mid-brown)', padding: '12px' }} disabled={submitting}>
                  {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </form>
            </div>

            {/* Right Column: Pending Requests & History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Pending Requests Section */}
              <div className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="var(--accent-orange)" /> ⌛ Pending Approval
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr style={{ textAlign: 'left' }}>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Type</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Method</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                          <td style={{ padding: '10px' }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: r.request_type === 'deposit' ? '#27ae60' : '#c0392b' }}>
                            {r.request_type.toUpperCase()}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {r.payment_method === 'mobile_money' ? `📱 MM (${r.sim_provider})` : '💵 Cash'}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>UGX {Number(r.amount).toLocaleString()}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: 'bold',
                              backgroundColor: r.status === 'pending' ? '#fff4e5' : r.status === 'approved' ? '#e1f7e1' : '#ffebeb',
                              color: r.status === 'pending' ? '#e67e22' : r.status === 'approved' ? '#27ae60' : '#c0392b'
                            }}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                            No pending or past requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction History Section */}
              <div className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={20} color="var(--mid-brown)" /> My Approved Ledger
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr style={{ textAlign: 'left' }}>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Type</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Description</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                          <td style={{ padding: '10px' }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {t.transaction_type === 'deposit' ? (
                                <ArrowDownCircle size={14} color="#27ae60" />
                              ) : (
                                <ArrowUpCircle size={14} color="#c0392b" />
                              )}
                              <span style={{ fontWeight: 'bold', color: t.transaction_type === 'deposit' ? '#27ae60' : '#c0392b' }}>
                                {t.transaction_type.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px', fontSize: '12px' }}>{t.description}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>UGX {Number(t.amount).toLocaleString()}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--mid-brown)' }}>UGX {Number(t.balance_after).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!loading && transactions.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            No approved transactions found.
                          </td>
                        </tr>
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

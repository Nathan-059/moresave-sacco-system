import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Shield } from 'lucide-react';

const PesaPalPopup = ({ 
  isOpen, 
  onClose, 
  memberNumber, 
  amount, 
  phoneNumber, 
  provider, 
  description, 
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('confirm'); // confirm, processing, pin-entry
  const [paymentUrl, setPaymentUrl] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('confirm');
      setPaymentUrl('');
      setTrackingId('');
      setLoading(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  }, [isOpen, timeoutId]);

  useEffect(() => {
    // Listen for messages from PesaPal iframe/popup
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PESAPAL_PAYMENT_RESULT') {
        const { success, status, trackingId: resultTrackingId } = event.data.data;
        
        if (success && status === 'COMPLETED') {
          onSuccess({
            message: 'Payment completed successfully! Your account has been credited.',
            trackingId: resultTrackingId
          });
        } else {
          onError({
            message: `Payment ${status.toLowerCase()}. Please try again or contact support.`,
            trackingId: resultTrackingId
          });
        }
        
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('message', handleMessage);
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onSuccess, onError, onClose, isOpen, timeoutId]);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pesapal/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberNumber,
          amount,
          paymentMethod: 'mobile_money',
          phoneNumber,
          provider,
          description,
          usePopup: true
        })
      });

      const data = await response.json();
      
      if (data.success && data.redirect_url) {
        setPaymentUrl(data.redirect_url);
        setTrackingId(data.order_tracking_id);
        setStep('pin-entry');
        
        // Show message about phone prompt
        if (data.message) {
          // You could show this message in the UI
          console.log('PesaPal Message:', data.message);
        }
        
        // Set a timeout to handle cases where payment takes too long
        const timeout = setTimeout(() => {
          onError({ 
            message: 'Payment session timed out. Please check your phone for any mobile money notifications or try again.',
            trackingId: data.order_tracking_id
          });
          onClose();
        }, 300000); // 5 minutes timeout
        
        setTimeoutId(timeout);
      } else {
        onError({ message: data.message || 'Failed to initiate payment' });
        onClose();
      }
    } catch (error) {
      onError({ message: 'Network error. Please check your connection and try again.' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: step === 'pin-entry' ? '800px' : '480px',
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header - fixed */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #f1f1f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px 12px 0 0',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#667eea" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              Secure Mobile Money Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {step === 'confirm' && (
            <div>
              {/* Compact header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Smartphone size={32} color="#667eea" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>Confirm Payment Details</h4>
                  <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>
                    A prompt will be sent to your phone to complete payment
                  </p>
                </div>
              </div>

              {/* Payment details - compact */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Amount:</span>
                  <span style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '16px' }}>
                    UGX {Number(amount).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Mobile Number:</span>
                  <span style={{ fontWeight: 'bold' }}>{phoneNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Provider:</span>
                  <span style={{ fontWeight: 'bold' }}>{provider} Uganda</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Member:</span>
                  <span style={{ fontWeight: 'bold' }}>{memberNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Description:</span>
                  <span style={{ fontWeight: 'bold' }}>{description}</span>
                </div>
              </div>

              {/* Info box - compact */}
              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1565c0'
              }}>
                📱 <strong>How it works:</strong> After clicking "Send Payment Request", a mobile money prompt will be sent to <strong>{phoneNumber}</strong>. Check your phone and enter your PIN to complete the payment.
              </div>

              {/* Buttons - always visible */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={initiatePayment}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: loading ? '#aaa' : '#667eea',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Send Payment Request
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'pin-entry' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>📱 Check Your Phone!</h4>
                <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>
                  A mobile money prompt has been sent to <strong>{phoneNumber}</strong>.<br/>
                  Enter your <strong>{provider}</strong> PIN on your phone to complete payment.
                </p>
              </div>

              <div style={{
                backgroundColor: '#fff3cd',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '13px',
                color: '#856404',
                textAlign: 'center'
              }}>
                ⏳ Waiting for you to approve on your phone... Do not close this window.
              </div>

              <div style={{
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                overflow: 'hidden',
                height: '350px'
              }}>
                <iframe
                  src={paymentUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PesaPal Payment"
                />
              </div>

              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/pesapal/verify-status/${trackingId}`);
                      const data = await res.json();
                      if (data.success && data.status === 'COMPLETED') {
                        onSuccess({ message: 'Payment verified and completed!', trackingId });
                        onClose();
                      } else {
                        onError({ message: `Payment status: ${data.status || 'Pending'}. Please wait or try again.`, trackingId });
                      }
                    } catch {
                      onError({ message: 'Error verifying payment. Please contact support.', trackingId });
                    }
                  }}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ I've Paid — Verify Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PesaPalPopup;
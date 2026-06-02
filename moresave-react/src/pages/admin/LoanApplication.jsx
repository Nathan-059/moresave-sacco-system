import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { FileText, Save, Shield } from 'lucide-react';

const LoanApplication = () => {
  const [formData, setFormData] = useState({
    memberNumber: '',
    loanAmount: '',
    repaymentPeriod: '6',
    purpose: '',
    collateralType: 'Land Title',
    collateralDescription: '',
    collateralValue: '',
    collateralDocRef: ''
  });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast(`Loan application ${data.loanNumber} submitted successfully!`, 'success');
        setFormData({
          memberNumber: '',
          loanAmount: '',
          repaymentPeriod: '6',
          purpose: '',
          collateralType: 'Land Title',
          collateralDescription: '',
          collateralValue: '',
          collateralDocRef: ''
        });
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error submitting application', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>New Loan Application</h1>

          <div className="glass" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '600px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Member Number <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. MRS0001" 
                  value={formData.memberNumber}
                  onChange={(e) => setFormData({...formData, memberNumber: e.target.value})}
                  required 
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Loan Amount (UGX) <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Minimum 200,000" 
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({...formData, loanAmount: e.target.value})}
                  required 
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Repayment Period (Months) <span style={{ color: 'red' }}>*</span></label>
                <select 
                  className="input-field" 
                  value={formData.repaymentPeriod}
                  onChange={(e) => setFormData({...formData, repaymentPeriod: e.target.value})}
                >
                  {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} Months</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Purpose of Loan <span style={{ color: 'red' }}>*</span></label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px' }} 
                  placeholder="Briefly describe why the loan is needed..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  required
                ></textarea>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '20px', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> Collateral Security Details
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Collateral Type <span style={{ color: 'red' }}>*</span></label>
                <select 
                  className="input-field" 
                  value={formData.collateralType}
                  onChange={(e) => setFormData({...formData, collateralType: e.target.value})}
                >
                  {['Land Title', 'Vehicle Logbook', 'Building', 'Equipment', 'Livestock', 'Salary Slip', 'Guarantor', 'Other'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Collateral Description <span style={{ color: 'red' }}>*</span></label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px' }} 
                  placeholder="Provide details of the collateral (e.g. registration details)..."
                  value={formData.collateralDescription}
                  onChange={(e) => setFormData({...formData, collateralDescription: e.target.value})}
                  required
                ></textarea>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Estimated Value (UGX) <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Estimated valuation of the asset" 
                  value={formData.collateralValue}
                  onChange={(e) => setFormData({...formData, collateralValue: e.target.value})}
                  required 
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Supporting Document Ref #</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Reference number of title, logbook or ID (optional)" 
                  value={formData.collateralDocRef}
                  onChange={(e) => setFormData({...formData, collateralDocRef: e.target.value})}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }} disabled={loading}>
                <Save size={18} /> {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoanApplication;

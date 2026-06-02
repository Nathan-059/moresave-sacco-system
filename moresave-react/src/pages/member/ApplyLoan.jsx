import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { Shield, CheckCircle2, AlertCircle, Save, Percent, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApplyLoan = () => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    loanAmount: '',
    repaymentPeriod: '6',
    purpose: '',
    collateralType: 'Land Title',
    collateralDescription: '',
    collateralValue: '',
    collateralDocRef: ''
  });

  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEligibility();
  }, [user.username]);

  const fetchEligibility = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/eligibility/${user.username}`);
      const data = await res.json();
      setEligibility(data);
    } catch (err) {
      console.error('Error fetching eligibility:', err);
      toast('Could not verify loan eligibility details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.loanAmount || !formData.purpose || !formData.collateralDescription || !formData.collateralValue) {
      toast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberNumber: user.username,
          loanAmount: formData.loanAmount,
          repaymentPeriod: formData.repaymentPeriod,
          purpose: formData.purpose,
          collateralType: formData.collateralType,
          collateralDescription: formData.collateralDescription,
          collateralValue: formData.collateralValue,
          collateralDocRef: formData.collateralDocRef
        })
      });

      const data = await res.json();
      if (data.success) {
        toast(`🎉 Success! Loan application ${data.loanNumber} has been submitted successfully.`, 'success');
        navigate('/member/loans');
      } else {
        toast(data.message || 'Application rejected.', 'error');
      }
    } catch (err) {
      toast('Error submitting loan application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Calculations
  const P = Number(formData.loanAmount) || 0;
  const T = Number(formData.repaymentPeriod) || 6;
  const interestRate = 0.02; // 2% flat per month
  const interest = P * interestRate * T;
  const totalPayable = P + interest;
  const monthlyPayment = totalPayable / T;

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <Navbar user={user} />
          <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading eligibility details...</div>
        </div>
      </div>
    );
  }

  const { eligible, checks } = eligibility || {};

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Apply for a Loan</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '28px', fontSize: '14px' }}>
            Ensure you meet the eligibility criteria before applying. All applications require collateral security.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
            
            {/* Left Column: Form (only if eligible) */}
            <div>
              {eligible ? (
                <div className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '24px', color: 'var(--dark-brown)' }}>
                    Loan Application Details
                  </h3>
                  <form onSubmit={handleSubmit}>
                    
                    {/* Amount */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Loan Amount (UGX) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="loanAmount"
                        className="input-field"
                        placeholder="e.g. 1000000"
                        value={formData.loanAmount}
                        onChange={handleInputChange}
                        required
                        min="50000"
                      />
                    </div>

                    {/* Repayment Period */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Repayment Period <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        name="repaymentPeriod"
                        className="input-field"
                        value={formData.repaymentPeriod}
                        onChange={handleInputChange}
                      >
                        {[3, 6, 9, 12, 18, 24].map(m => (
                          <option key={m} value={m}>{m} Months</option>
                        ))}
                      </select>
                    </div>

                    {/* Purpose */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Purpose of Loan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <textarea
                        name="purpose"
                        className="input-field"
                        style={{ minHeight: '80px' }}
                        placeholder="Explain what the loan will be used for..."
                        value={formData.purpose}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '20px', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} /> Collateral Security Details
                    </h3>

                    {/* Collateral Type */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Collateral Type <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        name="collateralType"
                        className="input-field"
                        value={formData.collateralType}
                        onChange={handleInputChange}
                      >
                        {['Land Title', 'Vehicle Logbook', 'Building', 'Equipment', 'Livestock', 'Salary Slip', 'Guarantor', 'Other'].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Collateral Description */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Collateral Description <span style={{ color: 'red' }}>*</span>
                      </label>
                      <textarea
                        name="collateralDescription"
                        className="input-field"
                        style={{ minHeight: '80px' }}
                        placeholder="Provide details of the collateral (e.g. plot number, registration, serial number)..."
                        value={formData.collateralDescription}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Collateral Estimated Value */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Estimated Value (UGX) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="collateralValue"
                        className="input-field"
                        placeholder="Estimated valuation of the asset"
                        value={formData.collateralValue}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Collateral Document Reference */}
                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Supporting Document Ref #
                      </label>
                      <input
                        type="text"
                        name="collateralDocRef"
                        className="input-field"
                        placeholder="Reference number of title, logbook or ID (optional)"
                        value={formData.collateralDocRef}
                        onChange={handleInputChange}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled={submitting}
                    >
                      <Save size={18} /> {submitting ? 'Submitting Application...' : 'SUBMIT LOAN APPLICATION'}
                    </button>

                  </form>
                </div>
              ) : (
                <div style={{ padding: '30px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', color: '#991b1b' }}>
                  <AlertCircle size={28} style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>Application Blocked</h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                    You currently do not meet the minimum eligibility requirements of Moresave SACCO. Please review the checklist on the right. You must satisfy all requirements to submit a loan application.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Eligibility Checklist & Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Eligibility Checklist */}
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dark-brown)' }}>
                  <CheckCircle2 size={18} /> Eligibility Checklist
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {checks && Object.keys(checks).map((key) => {
                    const ch = checks[key];
                    return (
                      <div key={key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>
                          {ch.pass ? '✅' : '❌'}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: ch.pass ? '#27ae60' : '#c0392b' }}>
                            {ch.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            {ch.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formula & Live Preview */}
              {eligible && P > 0 && (
                <div style={{ backgroundColor: 'var(--light-cream)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-brown)', color: 'var(--dark-brown)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Percent size={16} /> Live Payment Estimate
                  </h3>
                  <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Principal:</span>
                      <strong style={{ fontSize: '13px' }}>UGX {P.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Interest (2% monthly flat):</span>
                      <strong>UGX {interest.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '6px', marginBottom: '6px' }}>
                      <span>Total Payable:</span>
                      <strong>UGX {totalPayable.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '6px', fontSize: '14px', color: '#27ae60' }}>
                      <span>Monthly Instalment:</span>
                      <strong>UGX {Math.round(monthlyPayment).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Policy Rules */}
              <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe', fontSize: '12px', lineHeight: 1.5, color: '#1e40af' }}>
                <Landmark size={18} style={{ marginBottom: '8px' }} />
                <h4 style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Moresave SACCO Loan Policy</h4>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>Loan applications are reviewed manually by a Records Officer and approved by the Branch Manager.</li>
                  <li>Interest is strictly 2% flat per month on the principal.</li>
                  <li>Overdue instalments attract a 2% monthly penalty on the outstanding amount.</li>
                </ul>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ApplyLoan;

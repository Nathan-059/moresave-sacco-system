import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { useNotify } from '../context/NotifyContext';
import { sendWelcomeEmail } from '../services/emailService';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    address: '',
    occupation: '',
    dob: '',
    gender: 'Male',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinNationalId: '',
    nextOfKinAddress: '',
    refereeMemberNumber: '',
    registrationFeeReceipt: ''
  });

  const [files, setFiles] = useState({
    passportPhoto: null,
    idScan: null,
    residenceProof: null,
    lcLetter: null
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useNotify();

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    Object.keys(files).forEach(key => {
      if (files[key]) data.append(key, files[key]);
    });

    try {
      // Step 1: Save member to your database as you normally do
      const res = await fetch('/api/members', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      
      if (result.success) {
        let emailResult = { success: false };
        
        // Step 2: Send welcome email immediately after saving
        if (formData.email) {
          emailResult = await sendWelcomeEmail({
            name: formData.fullName,
            email: formData.email,
            accountNumber: "ACC" + result.memberNumber,
            memberId: result.memberNumber
          });
        }

        if (emailResult.success) {
          toast(`🎉 Registration Successful!\n\nYour Member Number: ${result.memberNumber}\nYour Default Password: ${result.memberNumber}\n\nPlease keep these safe! A welcome email has also been sent to you.`, 'success');
        } else {
          toast(`🎉 Registration Successful!\n\nYour Member Number: ${result.memberNumber}\nYour Default Password: ${result.memberNumber}\n\nPlease keep these safe! (Welcome email could not be sent).`, 'success');
        }
        
        // Auto-login the new member and redirect to dashboard
        const newUser = {
          id: 'temp', 
          username: result.memberNumber,
          role: 'member',
          memberNumber: result.memberNumber,
          fullName: formData.fullName,
          status: 'pending'
        };
        localStorage.setItem('user', JSON.stringify(newUser));
        
        navigate('/member');
      } else {
        toast(result.message, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4E3526 0%, #8B6B4A 100%)',
      padding: '40px 20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '900px',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <div style={{ padding: '30px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/login" style={{ color: 'var(--mid-brown)' }}><ArrowLeft size={24} /></Link>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Membership Application</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Moresave SACCO Management System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
          {/* Section: Personal Details */}
          <h3 style={{ borderLeft: '4px solid var(--mid-brown)', paddingLeft: '10px', marginBottom: '20px', fontSize: '16px' }}>1. Personal Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label className="label-sm">Full Legal Name (as on ID)</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">National ID / NIN</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, nationalId: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Phone Number</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Email Address</label>
              <input type="email" className="input-field" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Date of Birth</label>
              <input type="date" className="input-field" required onChange={(e) => setFormData({...formData, dob: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Gender</label>
              <select className="input-field" onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label-sm">Residential Address</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label-sm">Occupation</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, occupation: e.target.value})} />
            </div>
          </div>

          {/* Section: Next of Kin */}
          <h3 style={{ borderLeft: '4px solid var(--mid-brown)', paddingLeft: '10px', marginBottom: '20px', fontSize: '16px' }}>2. Next of Kin Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label className="label-sm">Next of Kin Full Name</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, nextOfKinName: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Relationship to Applicant</label>
              <input type="text" className="input-field" required placeholder="e.g. Spouse, Parent, Sibling" onChange={(e) => setFormData({...formData, nextOfKinRelationship: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Next of Kin Contact Number</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, nextOfKinPhone: e.target.value})} />
            </div>
            <div>
              <label className="label-sm">Next of Kin National ID / NIN</label>
              <input type="text" className="input-field" required placeholder="14-character NIN" onChange={(e) => setFormData({...formData, nextOfKinNationalId: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label-sm">Next of Kin Residential Address</label>
              <input type="text" className="input-field" required onChange={(e) => setFormData({...formData, nextOfKinAddress: e.target.value})} />
            </div>
          </div>

          {/* Section: Supporting Documents */}
          <h3 style={{ borderLeft: '4px solid var(--mid-brown)', paddingLeft: '10px', marginBottom: '20px', fontSize: '16px' }}>3. Supporting Documents (Scanned)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div className="file-upload-box">
              <label className="label-sm"><Upload size={14} /> Passport Size Photo</label>
              <input type="file" name="passportPhoto" accept="image/*" required onChange={handleFileChange} />
            </div>
            <div className="file-upload-box">
              <label className="label-sm"><Upload size={14} /> National ID Scan</label>
              <input type="file" name="idScan" accept="image/*,.pdf" required onChange={handleFileChange} />
            </div>
            <div className="file-upload-box">
              <label className="label-sm"><Upload size={14} /> Proof of Residence (Utility Bill)</label>
              <input type="file" name="residenceProof" accept="image/*,.pdf" required onChange={handleFileChange} />
            </div>
            <div className="file-upload-box">
              <label className="label-sm"><Upload size={14} /> LC Verification Letter</label>
              <input type="file" name="lcLetter" accept="image/*,.pdf" required onChange={handleFileChange} />
            </div>
          </div>

          {/* Section: Verification & Payment */}
          <h3 style={{ borderLeft: '4px solid var(--mid-brown)', paddingLeft: '10px', marginBottom: '20px', fontSize: '16px' }}>4. Verification & Initial Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label className="label-sm">Referee Member Number <span style={{ color: '#888', fontWeight: 'normal' }}>(Active SACCO member)</span></label>
              <input type="text" className="input-field" placeholder="e.g. MRS0001" onChange={(e) => setFormData({...formData, refereeMemberNumber: e.target.value})} />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>The referee must be an existing active member in good standing.</p>
            </div>
            <div>
              <label className="label-sm">Registration Fee Receipt No. <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="input-field" placeholder="UGX 20,000 Receipt #" required onChange={(e) => setFormData({...formData, registrationFeeReceipt: e.target.value})} />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Official receipt issued by the Cashier upon payment of UGX 20,000.</p>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f7f0', border: '1px solid #d0e7d0', borderRadius: '8px', fontSize: '13px', marginBottom: '30px', color: '#2d5a27' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} />
              <strong>Declaration:</strong> I hereby certify that the information provided is true and correct. I understand that my application is subject to verification and approval by Moresave SACCO management.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold' }} disabled={loading}>
            {loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT MEMBERSHIP APPLICATION'}
          </button>
        </form>
      </div>
      
      <style>{`
        .label-sm {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #444;
        }
        .file-upload-box {
          padding: 15px;
          border: 1px dashed #ccc;
          border-radius: 8px;
          background: #fdfdfd;
        }
        .file-upload-box input {
          font-size: 12px;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Register;


import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { User, Save, Lock } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    phone_number: '',
    email: '',
    address: '',
    occupation: ''
  });
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/portal/profile/${user.username}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.username]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/portal/profile/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone_number,
          email: profile.email,
          address: profile.address,
          occupation: profile.occupation
        })
      });
      const data = await res.json();
      if (data.success) toast('Profile updated successfully!', 'success');
      else toast(data.message, 'error');
    } catch (err) {
      toast('Error updating profile', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast("New passwords don't match!", 'warning');
    }
    if (passwords.new.length < 4) {
      return toast("Password must be at least 4 characters long.", 'warning');
    }
    try {
      const res = await fetch(`/api/portal/change-password/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });
      const data = await res.json();
      if (data.success) {
        toast('Password updated successfully!', 'success');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error changing password', 'error');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>My Profile</h1>

          {/* Read-only member info */}
          <div className="glass" style={{ backgroundColor: 'white', padding: '24px 30px', borderRadius: '12px', marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              { label: 'Member Number', value: profile.member_number },
              { label: 'Account Number', value: profile.account_number },
              { label: 'Joined', value: profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '—' },
              { label: 'Status', value: profile.membership_status?.toUpperCase() },
              { label: 'National ID', value: profile.national_id },
              { label: 'Gender', value: profile.gender },
              { label: 'Date of Birth', value: profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '—' },
              { label: 'Savings Balance', value: 'UGX ' + Number(profile.current_balance || 0).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div className="glass" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <User size={24} color="var(--mid-brown)" />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Update Contact Info</h3>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Full Name</label>
                  <input type="text" className="input-field" value={profile.full_name || ''} disabled style={{ backgroundColor: '#f5f5f5' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Phone Number</label>
                  <input type="text" className="input-field" value={profile.phone_number || ''} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Email Address</label>
                  <input type="email" className="input-field" value={profile.email || ''} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Address</label>
                  <input type="text" className="input-field" value={profile.address || ''} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Occupation</label>
                  <input type="text" className="input-field" value={profile.occupation || ''} onChange={(e) => setProfile({...profile, occupation: e.target.value})} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px' }}>
                  <Save size={18} /> Save Changes
                </button>
              </form>
            </div>

            <form className="glass" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', height: 'fit-content' }} onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <Lock size={24} color="var(--mid-brown)" />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Change Password</h3>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Current Password</label>
                {profile.membership_status === 'pending' && (
                  <span style={{ fontSize: '11px', color: '#e67e22', display: 'block', marginBottom: '8px' }}>
                    Default password is your Member Number ({profile.member_number})
                  </span>
                )}
                <input type="password" required className="input-field" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>New Password</label>
                <input type="password" required className="input-field" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Confirm New Password</label>
                <input type="password" required className="input-field" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--dark-brown)' }}>
                Update Password
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Save, Download } from 'lucide-react';

const Settings = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [config, setConfig] = useState({
    general: { currency: 'UGX', timezone: 'Africa/Kampala', dateFormat: 'YYYY-MM-DD' },
    security: { complexPasswords: true, sessionTimeout: 30, twoFactorAuth: false },
    notifications: { emailOnRegistration: true, emailOnLoanApproval: true, smsOnDeposit: false },
    support: { aiEnabled: true }
  });
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotify();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) setConfig(data);
        setLoading(false);
      })
      .catch(err => console.error("Failed to load settings"));
  }, []);

  const handleSave = async (sectionKey, e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast('Settings saved securely to server!', 'success');
        setActiveTab(null);
      }
    } catch (err) {
      toast('Error saving settings.', 'error');
    }
  };

  const handleChange = (section, key, value) => {
    setConfig({
      ...config,
      [section]: { ...config[section], [key]: value }
    });
  };

  if (loading) return <div>Loading settings...</div>;

  const sections = [
    { id: 'general', title: 'General Settings', icon: <Globe size={20} />, description: 'System currency, timezone, and regional formats.' },
    { id: 'security', title: 'Security', icon: <Shield size={20} />, description: 'Password policies, 2FA, and session management.' },
    { id: 'notifications', title: 'Notifications', icon: <Bell size={20} />, description: 'Configure SMS and Email alert triggers.' },
    { id: 'support', title: 'Customer Care', icon: <span>💬</span>, description: 'Toggle between AI Auto-Responder and manual staff support.' },
    { id: 'backup', title: 'Backup & Restore', icon: <Database size={20} />, description: 'Manage database backups and system maintenance.' },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>System Settings</h1>

          <div style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
            {sections.map((section) => (
              <div key={section.id} className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                <div 
                  style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'background 0.2s', backgroundColor: activeTab === section.id ? '#f9f9f9' : 'white' }}
                  onClick={() => setActiveTab(activeTab === section.id ? null : section.id)}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--light-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mid-brown)' }}>
                    {section.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{section.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>{section.description}</p>
                  </div>
                  <div style={{ color: activeTab === section.id ? 'var(--dark-brown)' : '#ccc' }}>
                    <SettingsIcon size={20} />
                  </div>
                </div>

                {/* EXPANDABLE FORMS */}
                {activeTab === 'general' && section.id === 'general' && (
                  <form onSubmit={(e) => handleSave('general', e)} style={{ padding: '25px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>System Currency</label>
                      <select className="input-field" value={config.general.currency} onChange={(e) => handleChange('general', 'currency', e.target.value)} style={{ padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }}>
                        <option value="UGX">UGX - Ugandan Shilling</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Timezone</label>
                      <input type="text" className="input-field" value={config.general.timezone} onChange={(e) => handleChange('general', 'timezone', e.target.value)} style={{ padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-green)' }}><Save size={16} /> Save Changes</button>
                  </form>
                )}

                {activeTab === 'security' && section.id === 'security' && (
                  <form onSubmit={(e) => handleSave('security', e)} style={{ padding: '25px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={config.security.complexPasswords} onChange={(e) => handleChange('security', 'complexPasswords', e.target.checked)} />
                      <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Require Complex Passwords (8+ chars, numbers, symbols)</label>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Session Timeout (Minutes)</label>
                      <input type="number" className="input-field" value={config.security.sessionTimeout} onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))} style={{ padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-green)' }}><Save size={16} /> Save Changes</button>
                  </form>
                )}

                {activeTab === 'notifications' && section.id === 'notifications' && (
                  <form onSubmit={(e) => handleSave('notifications', e)} style={{ padding: '25px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={config.notifications.emailOnRegistration} onChange={(e) => handleChange('notifications', 'emailOnRegistration', e.target.checked)} />
                      <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Send Email to Members on Registration</label>
                    </div>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={config.notifications.emailOnLoanApproval} onChange={(e) => handleChange('notifications', 'emailOnLoanApproval', e.target.checked)} />
                      <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Send Email when Loan is Approved</label>
                    </div>
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={config.notifications.smsOnDeposit} onChange={(e) => handleChange('notifications', 'smsOnDeposit', e.target.checked)} />
                      <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Send SMS alerts for Deposits & Withdrawals</label>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-green)' }}><Save size={16} /> Save Changes</button>
                  </form>
                )}

                {activeTab === 'support' && section.id === 'support' && (
                  <form onSubmit={(e) => handleSave('support', e)} style={{ padding: '25px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '20px' }}>Choose how the system responds to member support messages:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '8px', border: `2px solid ${config.support.aiEnabled ? 'var(--dark-brown)' : '#eee'}`, cursor: 'pointer', backgroundColor: config.support.aiEnabled ? '#fdf8f5' : 'white' }}>
                        <input type="radio" name="supportMode" checked={config.support.aiEnabled} onChange={() => handleChange('support', 'aiEnabled', true)} />
                        <div>
                          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>🤖 AI Auto-Responder (Recommended)</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>Members get instant replies 24/7 powered by our smart SACCO knowledge base. Staff can still manually reply anytime.</p>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '8px', border: `2px solid ${!config.support.aiEnabled ? 'var(--dark-brown)' : '#eee'}`, cursor: 'pointer', backgroundColor: !config.support.aiEnabled ? '#fdf8f5' : 'white' }}>
                        <input type="radio" name="supportMode" checked={!config.support.aiEnabled} onChange={() => handleChange('support', 'aiEnabled', false)} />
                        <div>
                          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>👤 Manual Staff Responses Only</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>Member messages wait in the Support Inbox until a staff member manually replies. No automatic responses.</p>
                        </div>
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-green)' }}><Save size={16} /> Save Support Mode</button>
                  </form>
                )}

                {activeTab === 'backup' && section.id === 'backup' && (
                  <div style={{ padding: '25px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                    <p style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-light)' }}>
                      Download a complete secure snapshot of the SACCO database. Store this file securely.
                    </p>
                    <a href="/api/settings/backup" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--dark-brown)' }}>
                        <Download size={16} /> Generate & Download Full Backup
                      </button>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #eee' }}>
            <p style={{ fontSize: '12px', color: '#999' }}>Moresave SACCO Management System - Version 2.0.0 (React Web)</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;

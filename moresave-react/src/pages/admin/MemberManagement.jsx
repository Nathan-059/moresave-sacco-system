import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import { useNotify } from '../../context/NotifyContext';
import { Search, Filter, UserPlus, Eye, CheckCircle, XCircle, Save, FileText, Download, PauseCircle, PlayCircle, X } from 'lucide-react';

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', nationalId: '', address: '', occupation: '', dob: '', gender: 'Male'
  });

  const user = JSON.parse(localStorage.getItem('user'));
  const { toast, confirm } = useNotify();
  const debounceRef = useRef(null);

  const fetchMembers = useCallback(async (q, s) => {
    setLoading(true);
    try {
      const url = `/api/members?query=${encodeURIComponent(q)}&status=${encodeURIComponent(s)}`;
      const response = await fetch(url);
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when statusFilter changes
  useEffect(() => {
    fetchMembers(search, statusFilter);
  }, [statusFilter]);

  // Debounced live search as user types
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMembers(val, statusFilter);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchMembers('', statusFilter);
  };

  const handlePreview = async (memberNumber) => {
    try {
      const res = await fetch(`/api/members/${memberNumber}`);
      const data = await res.json();
      setSelectedMember(data);
      setIsPreviewOpen(true);
    } catch (err) {
      toast('Error fetching member details', 'error');
    }
  };

  const handleApprove = async (memberNumber) => {
    const ok = await confirm('Are you sure you want to approve this member? This will activate their account.');
    if (!ok) return;
    try {
      const res = await fetch(`/api/members/${memberNumber}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        toast('Member approved successfully!', 'success');
        setIsPreviewOpen(false);
        fetchMembers(search, statusFilter);
      } else {
        toast(data.message, 'error');
      }
    } catch (err) {
      toast('Error approving member', 'error');
    }
  };

  const handleReject = async (memberNumber) => {
    const ok = await confirm('Are you sure you want to REJECT this member registration?');
    if (!ok) return;
    try {
      const res = await fetch(`/api/members/${memberNumber}/reject`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        toast('Member registration rejected.', 'warning');
        setIsPreviewOpen(false);
        fetchMembers(search, statusFilter);
      } else toast(data.message, 'error');
    } catch (err) { toast('Error rejecting member', 'error'); }
  };

  const handleInactivate = async (memberNumber) => {
    const ok = await confirm('Are you sure you want to INACTIVATE this member? They will lose access to the system.');
    if (!ok) return;
    try {
      const res = await fetch(`/api/members/${memberNumber}/inactivate`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        toast('Member account inactivated.', 'warning');
        setIsPreviewOpen(false);
        fetchMembers(search, statusFilter);
      } else toast(data.message, 'error');
    } catch (err) { toast('Error inactivating member', 'error'); }
  };

  const handleReactivate = async (memberNumber) => {
    const ok = await confirm('Are you sure you want to REACTIVATE this member?');
    if (!ok) return;
    try {
      const res = await fetch(`/api/members/${memberNumber}/reactivate`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        toast('Member account reactivated.', 'success');
        setIsPreviewOpen(false);
        fetchMembers(search, statusFilter);
      } else toast(data.message, 'error');
    } catch (err) { toast('Error reactivating member', 'error'); }
  };

  const getDocUrl = (path) => {
    if (!path) return null;
    // Backend path is usually 'uploads/members/...'
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        
        <main style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Member Management</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>View and manage all registered SACCO members.</p>
            </div>
            {user.role !== 'cashier' && (
              <button 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-green)' }}
                onClick={() => window.location.href = '/register'}
              >
                <UserPlus size={18} /> Register New Member
              </button>
            )}
          </div>

          {/* Member Preview/Approval Modal */}
          <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Member Application Review">
            {selectedMember && (
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <img 
                    src={getDocUrl(selectedMember.passport_photo_url) || 'https://via.placeholder.com/150'} 
                    alt="Passport" 
                    style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }} 
                  />
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{selectedMember.full_name}</h2>
                    <p style={{ margin: '0 0 15px 0', color: '#666' }}>Member No: {selectedMember.member_number}</p>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: selectedMember.membership_status === 'pending' ? '#fff4e5' : '#e1f7e1',
                      color: selectedMember.membership_status === 'pending' ? '#b45d00' : '#27ae60'
                    }}>
                      {selectedMember.membership_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>National ID / NIN</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.national_id}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>Phone Number</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.phone_number}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>Address</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.address}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>Next of Kin</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.next_of_kin_name} ({selectedMember.next_of_kin_relationship})</p>
                    <p style={{ fontSize: '12px' }}>{selectedMember.next_of_kin_phone}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>Referee Member</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.referee_member_number || 'None'}</p>
                  </div>
                  <div className="info-group">
                    <label style={{ fontSize: '12px', color: '#999', display: 'block' }}>Registration Receipt</label>
                    <p style={{ fontWeight: '500' }}>{selectedMember.registration_fee_receipt_number}</p>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Supporting Documents</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                  {['id_scan_url', 'residence_proof_url', 'lc_letter_url'].map(key => (
                    <a 
                      key={key}
                      href={getDocUrl(selectedMember[key])} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="doc-link"
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', 
                        backgroundColor: '#f9f9f9', borderRadius: '8px', textDecoration: 'none', color: '#333',
                        fontSize: '13px', border: '1px solid #eee'
                      }}
                    >
                      <FileText size={18} color="var(--mid-brown)" />
                      {key.replace(/_/g, ' ').replace(' url', '').toUpperCase()}
                    </a>
                  ))}
                </div>

                {selectedMember.membership_status === 'pending' && user.role !== 'cashier' && (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '12px', backgroundColor: 'var(--accent-green)' }}
                      onClick={() => handleApprove(selectedMember.member_number)}
                    >
                      Approve & Activate Member
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '12px', backgroundColor: '#eee', color: '#666' }}
                      onClick={() => setIsPreviewOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </Modal>

          <div className="glass" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
                <input 
                  type="text" 
                  placeholder="Search by name, member number, phone or NIN..." 
                  className="input-field" 
                  style={{ marginBottom: 0, paddingLeft: '40px', paddingRight: search ? '36px' : '12px' }}
                  value={search}
                  onChange={handleSearchChange}
                />
                {search && (
                  <button
                    onClick={handleClearSearch}
                    style={{ position: 'absolute', right: '10px', top: '11px', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center' }}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <select 
                className="input-field" 
                style={{ marginBottom: 0, width: '180px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active Members</option>
                <option value="inactive">Inactive</option>
              </select>
              {!loading && (
                <span style={{ fontSize: '13px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                  {members.length} result{members.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Member No</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Full Name</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Phone</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Balance</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.member_number} style={{ borderBottom: '1px solid #f1f1f1' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{member.member_number}</td>
                      <td style={{ padding: '15px 20px' }}>{member.full_name}</td>
                      <td style={{ padding: '15px 20px' }}>{member.phone_number}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          backgroundColor: member.membership_status === 'active' ? '#e1f7e1' : (member.membership_status === 'pending' ? '#fff4e5' : '#ffe1e1'),
                          color: member.membership_status === 'active' ? '#27ae60' : (member.membership_status === 'pending' ? '#b45d00' : '#c0392b')
                        }}>
                          {member.membership_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>UGX {Number(member.balance).toLocaleString()}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            style={{ background: 'none', color: 'var(--mid-brown)', cursor: 'pointer' }} 
                            title="Review Application"
                            onClick={() => handlePreview(member.member_number)}
                          >
                            <Eye size={18} />
                          </button>
                          
                          {member.membership_status === 'pending' && user.role !== 'cashier' && (
                            <>
                              <button 
                                style={{ background: 'none', color: 'var(--accent-green)', cursor: 'pointer' }} 
                                title="Quick Approve & Activate Member"
                                onClick={() => handleApprove(member.member_number)}
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                style={{ background: 'none', color: 'var(--accent-red)', cursor: 'pointer' }} 
                                title="Reject Member Registration"
                                onClick={() => handleReject(member.member_number)}
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          
                          {member.membership_status === 'active' && user.role !== 'cashier' && (
                            <button 
                              style={{ background: 'none', color: '#e67e22', cursor: 'pointer' }} 
                              title="Inactivate Member"
                              onClick={() => handleInactivate(member.member_number)}
                            >
                              <PauseCircle size={18} />
                            </button>
                          )}

                          {member.membership_status === 'inactive' && user.role !== 'cashier' && (
                            <button 
                              style={{ background: 'none', color: 'var(--accent-green)', cursor: 'pointer' }} 
                              title="Reactivate Member"
                              onClick={() => handleReactivate(member.member_number)}
                            >
                              <PlayCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loading && (
                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>Loading members...</td></tr>
                  )}
                  {!loading && members.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>No members found</td></tr>
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

export default MemberManagement;


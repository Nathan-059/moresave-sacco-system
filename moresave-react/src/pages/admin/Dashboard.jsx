import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import KpiCard from '../../components/KpiCard';
import { Users, CreditCard, PiggyBank, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    totalMembers: 0,
    totalSavings: 0,
    activeLoans: 0,
    pendingLoans: 0
  });
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, loanRes] = await Promise.all([
          fetch('/api/reports/summary'),
          fetch('/api/loans/pending')
        ]);
        const sumData = await sumRes.json();
        const loanData = await loanRes.json();
        setSummary(sumData);
        setPendingLoans(loanData.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={true} />
      <div style={{ flex: 1, marginLeft: '240px', minHeight: '100vh' }}>
        <Navbar user={user} />
        
        <main style={{ padding: '30px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard Overview</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Welcome back, {user?.fullName}. Here is what's happening today.</p>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
            <KpiCard 
              title="Total Members" 
              value={summary.totalMembers} 
              color="var(--accent-blue)" 
              icon={<Users size={20} />} 
            />
            <KpiCard 
              title="Total Savings (UGX)" 
              value={Number(summary.totalSavings).toLocaleString()} 
              color="var(--accent-green)" 
              icon={<PiggyBank size={20} />} 
            />
            <KpiCard 
              title="Active Loans (UGX)" 
              value={Number(summary.activeLoans).toLocaleString()} 
              color="var(--accent-orange)" 
              icon={<CreditCard size={20} />} 
            />
            <KpiCard 
              title="Pending Loans" 
              value={summary.pendingLoans} 
              color="var(--accent-red)" 
              icon={<Clock size={20} />} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <div className="glass" style={{ padding: '25px', borderRadius: '12px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>⏳ Recent Loan Applications</h3>
                <Link to="/admin/loans" style={{ fontSize: '12px', color: 'var(--mid-brown)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)', fontWeight: '500' }}>Member</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)', fontWeight: '500' }}>Amount</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-light)', fontWeight: '500' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLoans.map((loan, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '12px 8px' }}>{loan.full_name}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>UGX {Number(loan.loan_amount).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>{loan.application_date}</td>
                    </tr>
                  ))}
                  {pendingLoans.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>No pending applications</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="glass" style={{ padding: '25px', borderRadius: '12px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>⚡ Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <Link to="/admin/members" className="btn btn-primary" style={{ textAlign: 'center', backgroundColor: 'var(--accent-blue)' }}>Manage Members</Link>
                <Link to="/admin/loans" className="btn btn-primary" style={{ textAlign: 'center', backgroundColor: 'var(--accent-green)' }}>Approve Loans</Link>
                <Link to="/admin/savings" className="btn btn-primary" style={{ textAlign: 'center', backgroundColor: 'var(--accent-orange)' }}>Savings/Deposits</Link>
                <Link to="/admin/reports" className="btn btn-primary" style={{ textAlign: 'center', backgroundColor: 'var(--dark-brown)' }}>Generate Reports</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

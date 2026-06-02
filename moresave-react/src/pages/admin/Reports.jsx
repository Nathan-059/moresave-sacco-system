import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useNotify } from '../../context/NotifyContext';
import { FileDown, FileText, Download } from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useNotify();

  const reportTypes = [
    { id: 'members', endpoint: '/api/members', title: 'Full Member List', description: 'Detailed list of all registered members and their statuses.', icon: <FileText size={24} />, color: 'var(--accent-blue)' },
    { id: 'loans', endpoint: '/api/loans/approved', title: 'Active Loans Report', description: 'Summary of all currently running and disbursed loans.', icon: <Download size={24} />, color: 'var(--accent-green)' },
    { id: 'overdue', endpoint: '/api/reports/overdue', title: 'Overdue Repayments', description: 'List of members with pending payments past their due date.', icon: <FileDown size={24} />, color: 'var(--accent-red)' },
    { id: 'savings', endpoint: '/api/reports/savings', title: 'Monthly Savings Summary', description: 'Consolidated report of savings activities for the current month.', icon: <FileText size={24} />, color: 'var(--mid-brown)' },
  ];

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast('No data available for this report.', 'warning');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== null ? row[header].toString().replace(/"/g, '""') : '';
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    a.click();
  };

  const handleGenerateReport = async (report) => {
    setLoading(true);
    try {
      const res = await fetch(report.endpoint);
      const data = await res.json();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadCSV(data, `${report.title.replace(/ /g, '_')}_${dateStr}`);
    } catch (error) {
      toast('Error generating report. Please check the server.', 'error');
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>System Reports</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Generate and download CSV/PDF reports of SACCO activities.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {reportTypes.map((report, i) => (
              <div key={i} className="glass" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
                <div style={{ color: report.color, marginBottom: '15px' }}>{report.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{report.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '25px', lineHeight: '1.5' }}>{report.description}</p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', backgroundColor: report.color, opacity: loading ? 0.7 : 1 }}
                  onClick={() => handleGenerateReport(report)}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;

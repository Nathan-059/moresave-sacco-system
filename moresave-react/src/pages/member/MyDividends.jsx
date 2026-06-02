import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { TrendingUp, Award } from 'lucide-react';

const MyDividends = () => {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchDividends = async () => {
      try {
        const res = await fetch(`/api/portal/dividends/${user.username}`);
        if (res.ok) setDividends(await res.json());
        else setDividends([]); // Placeholder
      } catch (err) {
        console.error('Error fetching dividends');
      } finally {
        setLoading(false);
      }
    };
    fetchDividends();
  }, [user.username]);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isAdmin={false} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <Navbar user={user} />
        <main style={{ padding: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>My Dividends</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {dividends.map((div, i) => (
              <div key={i} className="glass" style={{ 
                backgroundColor: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                borderLeft: '6px solid var(--accent-green)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '5px' }}>YEAR {div.year}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>UGX {Number(div.amount).toLocaleString()}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '10px' }}>Distributed on {new Date(div.date).toLocaleDateString()}</p>
                </div>
                <div style={{ color: 'var(--accent-green)', opacity: 0.2 }}>
                  <TrendingUp size={48} />
                </div>
              </div>
            ))}

            {!loading && dividends.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                <Award size={64} style={{ marginBottom: '20px' }} />
                <h3>You haven't received any dividends yet.</h3>
                <p>Keep saving to earn dividends at the end of the year!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyDividends;

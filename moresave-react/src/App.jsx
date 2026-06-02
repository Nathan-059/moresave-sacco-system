import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import MemberManagement from './pages/admin/MemberManagement';
import LoanApproval from './pages/admin/LoanApproval';
import LoanApplication from './pages/admin/LoanApplication';
import Savings from './pages/admin/Savings';
import Dividends from './pages/admin/Dividends';
import Penalties from './pages/admin/Penalties';
import Reports from './pages/admin/Reports';
import AuditLog from './pages/admin/AuditLog';
import Settings from './pages/admin/Settings';
import MemberDashboard from './pages/member/MemberDashboard';
import Transactions from './pages/member/Transactions';
import MyLoans from './pages/member/MyLoans';
import ApplyLoan from './pages/member/ApplyLoan';
import MyDividends from './pages/member/MyDividends';
import Profile from './pages/member/Profile';
import MemberSupport from './pages/member/Support';
import AdminSupport from './pages/admin/AdminSupport';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'member' ? '/member' : '/admin'} replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}><MemberManagement /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}><LoanApproval /></ProtectedRoute>} />
        <Route path="/admin/apply-loan" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}><LoanApplication /></ProtectedRoute>} />
        <Route path="/admin/savings" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><Savings /></ProtectedRoute>} />
        <Route path="/admin/dividends" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Dividends /></ProtectedRoute>} />
        <Route path="/admin/penalties" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer']}><Penalties /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuditLog /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Settings /></ProtectedRoute>} />
        
        {/* Member Routes */}
        <Route path="/member" element={<ProtectedRoute allowedRoles={['member']}><MemberDashboard /></ProtectedRoute>} />
        <Route path="/member/transactions" element={<ProtectedRoute allowedRoles={['member']}><Transactions /></ProtectedRoute>} />
        <Route path="/member/loans" element={<ProtectedRoute allowedRoles={['member']}><MyLoans /></ProtectedRoute>} />
        <Route path="/member/apply-loan" element={<ProtectedRoute allowedRoles={['member']}><ApplyLoan /></ProtectedRoute>} />
        <Route path="/member/dividends" element={<ProtectedRoute allowedRoles={['member']}><MyDividends /></ProtectedRoute>} />
        <Route path="/member/profile" element={<ProtectedRoute allowedRoles={['member']}><Profile /></ProtectedRoute>} />
        <Route path="/member/support" element={<ProtectedRoute allowedRoles={['member']}><MemberSupport /></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}><AdminSupport /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

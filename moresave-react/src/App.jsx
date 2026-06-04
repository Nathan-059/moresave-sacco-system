// ============================================================
// MORESAVE SACCO - Main Application Router (App.jsx)
// This file defines ALL the URL routes in the application.
// It also controls which pages are accessible by which user roles.
// ============================================================

// React Router imports for client-side navigation
// BrowserRouter: wraps the app so URLs work like normal web pages
// Routes/Route: defines which component renders at which URL
// Navigate: programmatically redirects users to another page
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ── Public Pages ─────────────────────────────────────────────
import Login from './pages/Login';       // Login page — accessible to everyone
import Register from './pages/Register'; // Member registration form

// ── Admin Pages ───────────────────────────────────────────────
import AdminDashboard    from './pages/admin/Dashboard';        // Admin home with KPIs
import MemberManagement  from './pages/admin/MemberManagement'; // View/approve/reject members
import LoanApproval      from './pages/admin/LoanApproval';     // Review and approve loan applications
import LoanApplication   from './pages/admin/LoanApplication';  // Staff creates a loan for a member
import Savings           from './pages/admin/Savings';          // Record deposits/withdrawals, approve requests
import Dividends         from './pages/admin/Dividends';        // Calculate and distribute dividends
import Penalties         from './pages/admin/Penalties';        // Manage member penalties
import Reports           from './pages/admin/Reports';          // Financial reports
import AuditLog          from './pages/admin/AuditLog';         // Security audit trail
import Settings          from './pages/admin/Settings';         // SACCO system settings
import AdminSupport      from './pages/admin/AdminSupport';     // Staff replies to member support tickets

// ── Member Pages ──────────────────────────────────────────────
import MemberDashboard from './pages/member/MemberDashboard'; // Member home with balance, loans, recent transactions
import Transactions    from './pages/member/Transactions';    // Member deposits/withdrawals with receipt upload
import MyLoans         from './pages/member/MyLoans';         // View loan history and repayment schedule
import ApplyLoan       from './pages/member/ApplyLoan';       // Apply for a new loan
import MyDividends     from './pages/member/MyDividends';     // View received dividends
import Profile         from './pages/member/Profile';         // Update contact info and change password
import MemberSupport   from './pages/member/Support';         // Chat with SACCO support staff

// ── Route Guard Component ─────────────────────────────────────
// ProtectedRoute wraps a page and checks if the user is logged in
// and has the correct role before allowing access.
// If not logged in → redirects to /login
// If wrong role → redirects to their own dashboard
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get the logged-in user from localStorage (set during login)
  const user = JSON.parse(localStorage.getItem('user'));

  // If no user in storage, force them to log in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user's role is not in the allowed list for this page, redirect them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Members go to /member, all staff go to /admin
    return <Navigate to={user.role === 'member' ? '/member' : '/admin'} replace />;
  }

  // User is authenticated and authorized — render the requested page
  return children;
};

// ── Main App Component ────────────────────────────────────────
function App() {
  return (
    // Router enables client-side navigation without full page reloads
    <Router>
      <Routes>

        {/* ── Public Routes (no login required) ── */}
        <Route path="/login"    element={<Login />} />    {/* Login page */}
        <Route path="/register" element={<Register />} /> {/* New member registration */}

        {/* ── Admin / Staff Routes ── */}
        {/* Only admin, manager, loan_officer, and cashier can access these */}

        {/* Main admin dashboard with summary stats */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Member management — view, approve, reject member applications */}
        <Route path="/admin/members" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}>
            <MemberManagement />
          </ProtectedRoute>
        } />

        {/* Loan approval — review pending loan applications */}
        <Route path="/admin/loans" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}>
            <LoanApproval />
          </ProtectedRoute>
        } />

        {/* Staff can apply for a loan on behalf of a member */}
        <Route path="/admin/apply-loan" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}>
            <LoanApplication />
          </ProtectedRoute>
        } />

        {/* Savings management — record cash transactions, approve mobile money requests */}
        <Route path="/admin/savings" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
            <Savings />
          </ProtectedRoute>
        } />

        {/* Dividends — only admin and manager can distribute dividends */}
        <Route path="/admin/dividends" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Dividends />
          </ProtectedRoute>
        } />

        {/* Penalties management */}
        <Route path="/admin/penalties" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer']}>
            <Penalties />
          </ProtectedRoute>
        } />

        {/* Financial reports */}
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer']}>
            <Reports />
          </ProtectedRoute>
        } />

        {/* Audit log — only admin and manager can see security logs */}
        <Route path="/admin/audit" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AuditLog />
          </ProtectedRoute>
        } />

        {/* System settings — interest rates, fees, SACCO configuration */}
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Staff support inbox — reply to member tickets */}
        <Route path="/admin/support" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'loan_officer', 'cashier']}>
            <AdminSupport />
          </ProtectedRoute>
        } />

        {/* ── Member Routes ── */}
        {/* Only members with role 'member' can access these */}

        {/* Member home dashboard — balance, active loan, recent transactions */}
        <Route path="/member" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberDashboard />
          </ProtectedRoute>
        } />

        {/* Savings portal — deposit/withdraw with cash or mobile money */}
        <Route path="/member/transactions" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Transactions />
          </ProtectedRoute>
        } />

        {/* View all loans and repayment history */}
        <Route path="/member/loans" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MyLoans />
          </ProtectedRoute>
        } />

        {/* Apply for a new loan (with eligibility check) */}
        <Route path="/member/apply-loan" element={
          <ProtectedRoute allowedRoles={['member']}>
            <ApplyLoan />
          </ProtectedRoute>
        } />

        {/* View dividend history */}
        <Route path="/member/dividends" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MyDividends />
          </ProtectedRoute>
        } />

        {/* Member profile — update contact info and password */}
        <Route path="/member/profile" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Contact support — chat interface for member help */}
        <Route path="/member/support" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberSupport />
          </ProtectedRoute>
        } />

        {/* ── Default Route ── */}
        {/* Redirect root URL "/" to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

// Export the App component so main.jsx can render it
export default App;

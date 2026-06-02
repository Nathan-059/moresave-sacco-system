import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { PiggyBank, CreditCard, TrendingUp, History, User, MessageCircle, ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const statusColors = {
  active:   { bg: "#e1f7e1", color: "#27ae60", label: "ACTIVE" },
  pending:  { bg: "#fff4e5", color: "#b45d00", label: "PENDING APPROVAL" },
  inactive: { bg: "#ffe1e1", color: "#c0392b", label: "INACTIVE" },
};

const loanStatusColors = {
  disbursed: { bg: "#e1f7e1", color: "#27ae60" },
  approved:  { bg: "#e1f7e1", color: "#27ae60" },
  pending:   { bg: "#fff4e5", color: "#b45d00" },
};

const StatusBadge = ({ status }) => {
  const s = statusColors[status] || statusColors.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const MemberDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [activeLoan, setActiveLoan] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes, lRes] = await Promise.all([
          fetch("/api/portal/profile/" + user.username),
          fetch("/api/portal/recent-transactions/" + user.username),
          fetch("/api/portal/loans/" + user.username),
        ]);
        const prof = await pRes.json();
        const txs  = await tRes.json();
        const loans = await lRes.json();
        setProfile(prof);
        setRecentTx(Array.isArray(txs) ? txs : []);
        const active = Array.isArray(loans)
          ? loans.find(l => ["disbursed","approved","pending"].includes(l.status))
          : null;
        setActiveLoan(active || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    load();
  }, [user.username]);

  const cards = [
    { title: "My Savings",    Icon: History,        path: "/member/transactions", color: "#4E3526" },
    { title: "My Loans",      Icon: CreditCard,     path: "/member/loans",        color: "#6F4E37" },
    { title: "Apply Loan",    Icon: CreditCard,     path: "/member/apply-loan",   color: "#8B6B4A" },
    { title: "My Dividends",  Icon: TrendingUp,     path: "/member/dividends",    color: "#27ae60" },
    { title: "My Profile",    Icon: User,           path: "/member/profile",      color: "#2980b9" },
    { title: "Support",       Icon: MessageCircle,  path: "/member/support",      color: "#e67e22" },
  ];

  const isPending = profile && profile.membership_status === "pending";
  const lsc = activeLoan ? (loanStatusColors[activeLoan.status] || {}) : {};

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: "240px" }}>
        <Navbar user={user} />
        <main style={{ padding: "30px" }}>

          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "4px" }}>
              {"Welcome, " + (profile ? profile.full_name : (user.fullName || user.username))}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--text-light)" }}>
              <span>{"Member No: "}<strong>{profile ? profile.member_number : user.memberNumber}</strong></span>
              {profile && <StatusBadge status={profile.membership_status} />}
            </div>
          </div>

          {isPending && (
            <div style={{ padding: "18px 22px", backgroundColor: "#fff8ee", borderLeft: "4px solid #e67e22", borderRadius: "8px", marginBottom: "24px" }}>
              <div style={{ fontWeight: "700", color: "#b45d00", marginBottom: "6px" }}>Application Pending Approval</div>
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#555" }}>
                Your membership application is under review. You will be notified once approved.
              </p>
              <div style={{ fontSize: "13px", backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #eee", display: "inline-block" }}>
                {"Member No: "}<strong>{profile.member_number}</strong>
                {"  Default Password: "}<strong>{profile.member_number}</strong>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "28px" }}>
            <div style={{ background: "linear-gradient(135deg, #4E3526 0%, #6F4E37 100%)", padding: "24px", borderRadius: "14px", color: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", opacity: 0.8 }}>Savings Balance</span>
                <PiggyBank size={20} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                {"UGX " + Number(profile ? profile.current_balance : 0).toLocaleString()}
              </div>
              <div style={{ marginTop: "10px", fontSize: "11px", opacity: 0.65 }}>
                {"Account: " + (profile ? profile.account_number : "")}
              </div>
            </div>

            <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "14px", border: "1px solid #eee" }}>
              <div style={{ fontSize: "13px", color: "var(--text-light)", marginBottom: "8px" }}>Active Loan</div>
              {activeLoan ? (
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: lsc.color || "#333" }}>
                    {"UGX " + Number(activeLoan.loan_amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                    {"Outstanding: UGX " + Number(activeLoan.outstanding_balance).toLocaleString()}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", backgroundColor: lsc.bg || "#eee", color: lsc.color || "#333" }}>
                      {activeLoan.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: "#aaa", marginTop: "8px" }}>No active loan</div>
              )}
            </div>

            <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "14px", border: "1px solid #eee" }}>
              <div style={{ fontSize: "13px", color: "var(--text-light)", marginBottom: "8px" }}>Member Info</div>
              <div style={{ fontSize: "13px", lineHeight: "1.9" }}>
                <div><span style={{ color: "#aaa" }}>{"Joined: "}</span>{profile && profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : ""}</div>
                <div><span style={{ color: "#aaa" }}>{"Gender: "}</span>{profile ? profile.gender : ""}</div>
                <div><span style={{ color: "#aaa" }}>{"Phone: "}</span>{profile ? profile.phone_number : ""}</div>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px", marginBottom: "32px" }}>
            {cards.map((card) => (
              <Link key={card.path} to={card.path} style={{ padding: "20px 12px", borderRadius: "12px", backgroundColor: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center", border: "1px solid #eee", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ color: card.color }}><card.Icon size={22} /></div>
                <span style={{ fontWeight: "600", fontSize: "12px", color: "var(--text-dark)" }}>{card.title}</span>
              </Link>
            ))}
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Recent Transactions</h3>
              <Link to="/member/transactions" style={{ fontSize: "13px", color: "var(--mid-brown)", fontWeight: "600" }}>View all</Link>
            </div>
            {recentTx.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead style={{ backgroundColor: "#f8f9fa" }}>
                  <tr>
                    {["Date","Type","Description","Amount","Balance"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: h === "Amount" || h === "Balance" ? "right" : "left", color: "var(--text-light)", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "12px 20px" }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {t.transaction_type === "deposit" ? <ArrowDownCircle size={14} color="#27ae60" /> : <ArrowUpCircle size={14} color="#c0392b" />}
                          <span style={{ fontWeight: "600", color: t.transaction_type === "deposit" ? "#27ae60" : "#c0392b" }}>{t.transaction_type.toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#666" }}>{t.description || ""}</td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: "600" }}>{"UGX " + Number(t.amount).toLocaleString()}</td>
                      <td style={{ padding: "12px 20px", textAlign: "right", color: "var(--mid-brown)", fontWeight: "600" }}>{"UGX " + Number(t.balance_after).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#aaa", fontSize: "14px" }}>
                <Clock size={32} style={{ marginBottom: "10px", opacity: 0.4 }} />
                <div>No transactions yet.</div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default MemberDashboard;

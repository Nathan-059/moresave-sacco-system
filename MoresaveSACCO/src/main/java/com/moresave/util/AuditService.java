package com.moresave.util;

import java.sql.*;

/**
 * Audit trail service — logs every significant action.
 * Concept paper requirement: "An audit log records every action
 * (who, when, what data, what changed) to prevent fraud."
 */
public class AuditService {

    public static void log(String username, String action,
                           String tableName, String recordId, String description) {
        try (Connection conn = DBConnection.getConnection()) {
            // Get user_id
            int userId = -1;
            if (username != null && !username.isEmpty()) {
                PreparedStatement us = conn.prepareStatement(
                    "SELECT user_id FROM users WHERE username = ?");
                us.setString(1, username);
                ResultSet ur = us.executeQuery();
                if (ur.next()) userId = ur.getInt("user_id");
            }

            String sql =
                "INSERT INTO audit_log (user_id, username, action, table_name, record_id, description) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setObject(1, userId == -1 ? null : userId);
            stmt.setString(2, username);
            stmt.setString(3, action);
            stmt.setString(4, tableName);
            stmt.setString(5, recordId);
            stmt.setString(6, description);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.out.println("[AUDIT ERROR] " + e.getMessage());
        }
    }

    // Convenience overloads
    public static void log(String username, String action, String description) {
        log(username, action, null, null, description);
    }

    public static void logLogin(String username) {
        log(username, "LOGIN", "users", username, "User logged in successfully");
    }

    public static void logLogout(String username) {
        log(username, "LOGOUT", "users", username, "User logged out");
    }

    public static void logMemberRegistered(String adminUser, String memberNumber, String memberName) {
        log(adminUser, "MEMBER_REGISTERED", "members", memberNumber,
            "New member registered: " + memberName + " (" + memberNumber + ")");
    }

    public static void logLoanApplied(String username, String loanNumber, double amount) {
        log(username, "LOAN_APPLIED", "loans", loanNumber,
            "Loan application submitted: " + loanNumber + " UGX " + String.format("%,.0f", amount));
    }

    public static void logLoanApproved(String adminUser, String loanNumber) {
        log(adminUser, "LOAN_APPROVED", "loans", loanNumber,
            "Loan approved and disbursed: " + loanNumber);
    }

    public static void logLoanRejected(String adminUser, String loanNumber) {
        log(adminUser, "LOAN_REJECTED", "loans", loanNumber,
            "Loan application rejected: " + loanNumber);
    }

    public static void logDeposit(String adminUser, String memberNumber, double amount) {
        log(adminUser, "DEPOSIT", "transactions", memberNumber,
            "Deposit of UGX " + String.format("%,.0f", amount) + " for member " + memberNumber);
    }

    public static void logWithdrawal(String adminUser, String memberNumber, double amount) {
        log(adminUser, "WITHDRAWAL", "transactions", memberNumber,
            "Withdrawal of UGX " + String.format("%,.0f", amount) + " for member " + memberNumber);
    }

    public static void logPasswordChange(String username) {
        log(username, "PASSWORD_CHANGED", "users", username, "Password changed by user");
    }

    public static void logProfileUpdate(String username) {
        log(username, "PROFILE_UPDATED", "members", username, "Member profile updated");
    }

    // Get recent audit logs for admin view
    public static javafx.collections.ObservableList<String[]> getRecentLogs(int limit) {
        javafx.collections.ObservableList<String[]> list =
            javafx.collections.FXCollections.observableArrayList();
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT username, action, table_name, record_id, description, logged_at " +
                "FROM audit_log ORDER BY logged_at DESC LIMIT ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, limit);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("logged_at"),
                    rs.getString("username") != null ? rs.getString("username") : "system",
                    rs.getString("action"),
                    rs.getString("table_name") != null ? rs.getString("table_name") : "",
                    rs.getString("record_id") != null ? rs.getString("record_id") : "",
                    rs.getString("description") != null ? rs.getString("description") : ""
                });
            }
        } catch (SQLException e) {
            System.out.println("Audit log error: " + e.getMessage());
        }
        return list;
    }
}

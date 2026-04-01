package com.moresave.controller;

import com.moresave.util.DBConnection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.sql.*;

public class MemberPortalController {

    // Get member details by username
    public String[] getMemberByUsername(
            String username) {
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT m.full_name, " +
                            "m.member_number, " +
                            "a.account_number, " +
                            "a.current_balance, " +
                            "m.phone_number, " +
                            "m.email, " +
                            "m.address, " +
                            "m.occupation, " +
                            "m.date_of_birth, " +
                            "m.gender, " +
                            "m.joining_date " +
                            "FROM members m " +
                            "JOIN accounts a " +
                            "ON m.member_id = a.member_id " +
                            "JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "WHERE u.username = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return new String[]{
                        rs.getString("full_name"),
                        rs.getString("member_number"),
                        rs.getString("account_number"),
                        String.format("%,.0f",
                                rs.getDouble(
                                        "current_balance"
                                )),
                        rs.getString("phone_number"),
                        rs.getString("email") != null ?
                                rs.getString("email") : "",
                        rs.getString("address"),
                        rs.getString("occupation") !=
                                null ?
                                rs.getString("occupation")
                                : "",
                        rs.getString("date_of_birth"),
                        rs.getString("gender"),
                        rs.getString("joining_date")
                };
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return null;
    }

    // Get member transactions
    public ObservableList<String[]>
    getTransactions(
            String accountNumber) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT t.transaction_date, " +
                            "t.transaction_type, " +
                            "t.amount, " +
                            "t.balance_after, " +
                            "t.description " +
                            "FROM transactions t " +
                            "JOIN accounts a " +
                            "ON t.account_id = a.account_id " +
                            "WHERE a.account_number = ? " +
                            "ORDER BY " +
                            "t.transaction_date DESC";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, accountNumber);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        rs.getString(2).toUpperCase(),
                        String.format("%,.0f",
                                rs.getDouble(3)),
                        String.format("%,.0f",
                                rs.getDouble(4)),
                        rs.getString(5) != null ?
                                rs.getString(5) : ""
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Get member loans
    public ObservableList<String[]>
    getMemberLoans(String username) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT l.loan_number, " +
                            "l.loan_amount, " +
                            "l.monthly_payment, " +
                            "l.outstanding_balance, " +
                            "l.status, " +
                            "l.application_date, " +
                            "l.maturity_date, " +
                            "l.interest_rate " +
                            "FROM loans l " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "WHERE u.username = ? " +
                            "ORDER BY " +
                            "l.application_date DESC";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString("loan_number"),
                        String.format("%,.0f",
                                rs.getDouble("loan_amount")),
                        String.format("%,.0f",
                                rs.getDouble(
                                        "monthly_payment"
                                )),
                        String.format("%,.0f",
                                rs.getDouble(
                                        "outstanding_balance"
                                )),
                        rs.getString("status")
                                .toUpperCase(),
                        rs.getString(
                                "application_date"
                        ),
                        rs.getString("maturity_date")
                                != null ?
                                rs.getString("maturity_date")
                                : "N/A",
                        rs.getString("interest_rate")
                                + "%"
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Get repayment schedule for a loan
    public ObservableList<String[]>
    getRepaymentSchedule(
            String loanNumber) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT lr.due_date, " +
                            "lr.amount_due, " +
                            "lr.amount_paid, " +
                            "lr.penalty_amount, " +
                            "(lr.amount_due + " +
                            "lr.penalty_amount) AS total, " +
                            "lr.payment_status " +
                            "FROM loan_repayments lr " +
                            "JOIN loans l " +
                            "ON lr.loan_id = l.loan_id " +
                            "WHERE l.loan_number = ? " +
                            "ORDER BY lr.due_date ASC";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, loanNumber);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString("due_date"),
                        String.format("%,.0f",
                                rs.getDouble("amount_due")),
                        String.format("%,.0f",
                                rs.getDouble("amount_paid")),
                        String.format("%,.0f",
                                rs.getDouble(
                                        "penalty_amount"
                                )),
                        String.format("%,.0f",
                                rs.getDouble("total")),
                        rs.getString("payment_status")
                                .toUpperCase()
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Get member dividends
    public ObservableList<String[]>
    getMemberDividends(String username) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT d.financial_year, " +
                            "d.average_savings, " +
                            "d.savings_percentage, " +
                            "d.dividend_amount, " +
                            "d.payment_status " +
                            "FROM dividends d " +
                            "JOIN members m " +
                            "ON d.member_id = m.member_id " +
                            "JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "WHERE u.username = ? " +
                            "ORDER BY " +
                            "d.financial_year DESC";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        String.format("%,.0f",
                                rs.getDouble(2)),
                        String.format("%.2f%%",
                                rs.getDouble(3)),
                        String.format("%,.0f",
                                rs.getDouble(4)),
                        rs.getString(5).toUpperCase()
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Apply for loan
    public String applyForLoan(
            String username,
            double amount,
            int period,
            String purpose) {

        try {
            Connection conn =
                    DBConnection.getConnection();

            String getMember =
                    "SELECT m.member_number " +
                            "FROM members m " +
                            "JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "WHERE u.username = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(getMember);
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String memberNumber =
                        rs.getString("member_number");
                LoanController loanController =
                        new LoanController();
                return loanController.applyForLoan(
                        memberNumber, amount,
                        period, purpose
                );
            }
            return "❌ Member account not found.";

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    // Update member profile
    public String updateProfile(
            String username,
            String phone,
            String email,
            String address,
            String occupation) {

        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "UPDATE members m " +
                            "JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "SET m.phone_number = ?, " +
                            "m.email = ?, " +
                            "m.address = ?, " +
                            "m.occupation = ? " +
                            "WHERE u.username = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, phone);
            stmt.setString(2, email);
            stmt.setString(3, address);
            stmt.setString(4, occupation);
            stmt.setString(5, username);
            stmt.executeUpdate();

            return "✅ Profile updated successfully!";

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    // Change password
    public String changePassword(
            String username,
            String currentPassword,
            String newPassword) {

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Verify current password
            String checkSql =
                    "SELECT user_id FROM users " +
                            "WHERE username = ? " +
                            "AND password_hash = ?";
            PreparedStatement checkStmt =
                    conn.prepareStatement(checkSql);
            checkStmt.setString(1, username);
            checkStmt.setString(2, currentPassword);
            ResultSet rs = checkStmt.executeQuery();

            if (!rs.next()) {
                return "❌ Current password is incorrect.";
            }

            // Update password
            String updateSql =
                    "UPDATE users SET password_hash = ? " +
                            "WHERE username = ?";
            PreparedStatement updateStmt =
                    conn.prepareStatement(updateSql);
            updateStmt.setString(1, newPassword);
            updateStmt.setString(2, username);
            updateStmt.executeUpdate();

            return "✅ Password changed successfully!";

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public int getMemberIdByUsername(String username) {
        try (Connection conn = DBConnection.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT m.member_id FROM members m " +
                "JOIN users u ON m.user_id = u.user_id " +
                "WHERE u.username = ?");
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return rs.getInt("member_id");
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return -1;
    }
}
package com.moresave.controller;

import com.moresave.util.DBConnection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.sql.*;

public class SavingsController {

    public String[] getAccountInfo(
            String memberNumber) {
        try {
            Connection conn =
                    DBConnection.getConnection();

            String sql =
                    "SELECT m.full_name, " +
                            "a.account_number, " +
                            "a.current_balance " +
                            "FROM members m " +
                            "JOIN accounts a " +
                            "ON m.member_id = a.member_id " +
                            "WHERE m.member_number = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, memberNumber);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return new String[]{
                        rs.getString("full_name"),
                        rs.getString("account_number"),
                        String.format("%,.0f",
                                rs.getDouble("current_balance"))
                };
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return null;
    }

    public String recordTransaction(
            String memberNumber,
            String type,
            double amount,
            String description) {

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Get account details
            String getAccount =
                    "SELECT a.account_id, " +
                            "a.current_balance " +
                            "FROM accounts a " +
                            "JOIN members m " +
                            "ON a.member_id = m.member_id " +
                            "WHERE m.member_number = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(getAccount);
            stmt.setString(1, memberNumber);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                return "❌ Account not found.";
            }

            int accountId =
                    rs.getInt("account_id");
            double currentBalance =
                    rs.getDouble("current_balance");

            // Check sufficient balance
            // for withdrawal
            if (type.equals("withdrawal") &&
                    amount > currentBalance) {
                return "❌ Insufficient balance. " +
                        "Current balance: UGX " +
                        String.format(
                                "%,.0f", currentBalance
                        );
            }

            // Calculate new balance
            double newBalance;
            if (type.equals("deposit")) {
                newBalance = currentBalance + amount;
            } else {
                newBalance = currentBalance - amount;
            }

            // Record transaction
            String insertTx =
                    "INSERT INTO transactions " +
                            "(account_id, transaction_type, " +
                            "amount, balance_after, " +
                            "description, recorded_by) " +
                            "VALUES (?, ?, ?, ?, ?, ?)";

            PreparedStatement txStmt =
                    conn.prepareStatement(insertTx);
            txStmt.setInt(1, accountId);
            txStmt.setString(2, type);
            txStmt.setDouble(3, amount);
            txStmt.setDouble(4, newBalance);
            txStmt.setString(5, description);
            txStmt.setInt(6, 1); // admin user id
            txStmt.executeUpdate();

            // Update account balance
            String updateBalance =
                    "UPDATE accounts " +
                            "SET current_balance = ? " +
                            "WHERE account_id = ?";

            PreparedStatement updateStmt =
                    conn.prepareStatement(updateBalance);
            updateStmt.setDouble(1, newBalance);
            updateStmt.setInt(2, accountId);
            updateStmt.executeUpdate();

            // Send deposit confirmation email
            if ("deposit".equals(type)) {
                try {
                    String emailSql =
                        "SELECT m.email, m.full_name FROM members m " +
                        "JOIN accounts a ON m.member_id = a.member_id " +
                        "WHERE a.account_id = ?";
                    PreparedStatement emailStmt = conn.prepareStatement(emailSql);
                    emailStmt.setInt(1, accountId);
                    ResultSet emailRs = emailStmt.executeQuery();
                    if (emailRs.next()) {
                        com.moresave.util.EmailService.sendDepositConfirmation(
                            emailRs.getString("email"),
                            emailRs.getString("full_name"),
                            amount, newBalance,
                            java.time.LocalDate.now().toString()
                        );
                    }
                } catch (Exception ignored) {}
            }

            return String.format(
                    "✅ %s recorded successfully!\n" +
                            "Amount: UGX %,.0f\n" +
                            "New Balance: UGX %,.0f",
                    type.substring(0, 1).toUpperCase() +
                            type.substring(1),
                    amount, newBalance
            );

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public ObservableList<String[]>
    getTransactionHistory(
            String accountNumber) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();

        try {
            Connection conn =
                    DBConnection.getConnection();

            String sql =
                    "SELECT t.transaction_date, " +
                            "t.transaction_type, " +
                            "t.amount, t.balance_after " +
                            "FROM transactions t " +
                            "JOIN accounts a " +
                            "ON t.account_id = a.account_id " +
                            "WHERE a.account_number = ? " +
                            "ORDER BY t.transaction_date DESC " +
                            "LIMIT 10";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, accountNumber);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(
                                "transaction_date"
                        ),
                        rs.getString(
                                "transaction_type"
                        ).toUpperCase(),
                        String.format("%,.0f",
                                rs.getDouble("amount")),
                        String.format("%,.0f",
                                rs.getDouble("balance_after"))
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }
}
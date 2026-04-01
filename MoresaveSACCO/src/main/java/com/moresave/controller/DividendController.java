package com.moresave.controller;

import com.moresave.util.DBConnection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.sql.*;

public class DividendController {

    // Calculate dividends preview
    public ObservableList<String[]>
    calculateDividends(
            String year,
            double totalProfit) {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Get all members with savings
            String sql =
                    "SELECT m.member_number, " +
                            "m.full_name, " +
                            "a.current_balance " +
                            "FROM members m " +
                            "JOIN accounts a " +
                            "ON m.member_id = a.member_id " +
                            "WHERE m.membership_status " +
                            "= 'active' " +
                            "ORDER BY m.member_number";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();

            // Calculate total savings
            double totalSavings = 0;
            java.util.List<Object[]> members =
                    new java.util.ArrayList<>();

            while (rs.next()) {
                double balance =
                        rs.getDouble("current_balance");
                totalSavings += balance;
                members.add(new Object[]{
                        rs.getString("member_number"),
                        rs.getString("full_name"),
                        balance
                });
            }

            if (totalSavings == 0) return list;

            // Calculate each member's dividend
            for (Object[] member : members) {
                double balance =
                        (double) member[2];
                double percentage =
                        (balance / totalSavings) * 100;
                double dividend =
                        (balance / totalSavings) *
                                totalProfit;

                list.add(new String[]{
                        (String) member[0],
                        (String) member[1],
                        String.format("%,.0f", balance),
                        String.format("%.2f%%",
                                percentage),
                        String.format("%,.0f", dividend)
                });
            }

        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Approve and save dividends to database
    public String approveDividends(
            String year,
            double totalProfit) {

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Check if dividends already exist
            // for this year
            String check =
                    "SELECT COUNT(*) FROM dividends " +
                            "WHERE financial_year = ?";
            PreparedStatement checkStmt =
                    conn.prepareStatement(check);
            checkStmt.setString(1, year);
            ResultSet checkRs =
                    checkStmt.executeQuery();
            if (checkRs.next() &&
                    checkRs.getInt(1) > 0) {
                return "❌ Dividends for " + year +
                        " have already been " +
                        "calculated and saved.";
            }

            // Get all members with savings
            String sql =
                    "SELECT m.member_id, " +
                            "a.current_balance " +
                            "FROM members m " +
                            "JOIN accounts a " +
                            "ON m.member_id = a.member_id " +
                            "WHERE m.membership_status " +
                            "= 'active'";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();

            double totalSavings = 0;
            java.util.List<Object[]> members =
                    new java.util.ArrayList<>();

            while (rs.next()) {
                double balance =
                        rs.getDouble("current_balance");
                totalSavings += balance;
                members.add(new Object[]{
                        rs.getInt("member_id"),
                        balance
                });
            }

            if (totalSavings == 0) {
                return "❌ No savings records found.";
            }

            // Insert dividend record for each member
            String insert =
                    "INSERT INTO dividends " +
                            "(member_id, financial_year, " +
                            "average_savings, " +
                            "total_sacco_savings, " +
                            "savings_percentage, " +
                            "total_profit, " +
                            "dividend_amount, " +
                            "payment_status) " +
                            "VALUES (?,?,?,?,?,?,?,'approved')";

            PreparedStatement insertStmt =
                    conn.prepareStatement(insert);

            for (Object[] member : members) {
                double balance =
                        (double) member[1];
                double percentage =
                        (balance / totalSavings) * 100;
                double dividend =
                        (balance / totalSavings) *
                                totalProfit;

                insertStmt.setInt(
                        1, (int) member[0]
                );
                insertStmt.setString(2, year);
                insertStmt.setDouble(3, balance);
                insertStmt.setDouble(
                        4, totalSavings
                );
                insertStmt.setDouble(
                        5, percentage
                );
                insertStmt.setDouble(
                        6, totalProfit
                );
                insertStmt.setDouble(7, dividend);
                insertStmt.addBatch();
            }
            insertStmt.executeBatch();

            return "✅ Dividends approved and " +
                    "distributed to " +
                    members.size() +
                    " members for year " + year;

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    // Get dividend history
    public ObservableList<String[]>
    getDividendHistory() {

        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();

            String sql =
                    "SELECT d.financial_year, " +
                            "m.full_name, " +
                            "d.average_savings, " +
                            "d.dividend_amount, " +
                            "d.payment_status " +
                            "FROM dividends d " +
                            "JOIN members m " +
                            "ON d.member_id = m.member_id " +
                            "ORDER BY d.financial_year DESC, " +
                            "m.full_name ASC";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        rs.getString(2),
                        String.format("%,.0f",
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
}
package com.moresave.controller;

import com.moresave.util.DBConnection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.sql.*;

public class ReportsController {

    // Get overall summary figures
    public String[] getSummary() {
        String[] summary = {
                "0", "0", "0", "0"
        };
        try {
            Connection conn =
                    DBConnection.getConnection();

            // Total members
            ResultSet r1 = conn.prepareStatement(
                    "SELECT COUNT(*) FROM members " +
                            "WHERE membership_status = 'active'"
            ).executeQuery();
            if (r1.next())
                summary[0] = r1.getString(1);

            // Total savings
            ResultSet r2 = conn.prepareStatement(
                    "SELECT COALESCE(SUM(" +
                            "current_balance),0) FROM accounts"
            ).executeQuery();
            if (r2.next())
                summary[1] = String.format(
                        "%,.0f",
                        r2.getDouble(1)
                );

            // Active loans outstanding balance
            ResultSet r3 = conn.prepareStatement(
                    "SELECT COALESCE(SUM(" +
                            "outstanding_balance),0) " +
                            "FROM loans WHERE status IN " +
                            "('approved','disbursed')"
            ).executeQuery();
            if (r3.next())
                summary[2] = String.format(
                        "%,.0f",
                        r3.getDouble(1)
                );

            // Total amount repaid
            ResultSet r4 = conn.prepareStatement(
                    "SELECT COALESCE(SUM(amount),0) " +
                            "FROM transactions WHERE " +
                            "transaction_type = 'deposit'"
            ).executeQuery();
            if (r4.next())
                summary[3] = String.format(
                        "%,.0f",
                        r4.getDouble(1)
                );

        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return summary;
    }

    // Get all members
    public ObservableList<String[]> getAllMembers() {
        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT m.member_number, " +
                            "m.full_name, m.phone_number, " +
                            "COALESCE(a.current_balance,0), " +
                            "m.membership_status " +
                            "FROM members m " +
                            "LEFT JOIN accounts a " +
                            "ON m.member_id = a.member_id " +
                            "ORDER BY m.member_number";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        rs.getString(2),
                        rs.getString(3),
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

    // Get all loans
    public ObservableList<String[]> getAllLoans() {
        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT l.loan_number, " +
                            "m.full_name, l.loan_amount, " +
                            "l.monthly_payment, " +
                            "l.status, l.application_date " +
                            "FROM loans l " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "ORDER BY l.application_date DESC";

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
                        rs.getString(5).toUpperCase(),
                        rs.getString(6)
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Get overdue loans with penalties
    public ObservableList<String[]>
    getOverdueLoans() {
        ObservableList<String[]> list =
                FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT l.loan_number, " +
                            "m.full_name, " +
                            "lr.due_date, " +
                            "lr.amount_due, " +
                            "ROUND(lr.amount_due * 0.02, 0) " +
                            "AS penalty " +
                            "FROM loan_repayments lr " +
                            "JOIN loans l " +
                            "ON lr.loan_id = l.loan_id " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "WHERE lr.due_date < CURDATE() " +
                            "AND lr.payment_status = 'pending' " +
                            "ORDER BY lr.due_date ASC";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        rs.getString(2),
                        rs.getString(3),
                        String.format("%,.0f",
                                rs.getDouble(4)),
                        String.format("%,.0f",
                                rs.getDouble(5))
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
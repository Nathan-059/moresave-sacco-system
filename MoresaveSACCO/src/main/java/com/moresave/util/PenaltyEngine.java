package com.moresave.util;

import java.sql.*;
import java.time.LocalDate;

public class PenaltyEngine {

    private static final double
            PENALTY_RATE = 0.02; // 2% per month

    // Run this every time the app starts
    public static String runPenaltyCheck() {

        int penaltiesApplied = 0;
        double totalPenalties = 0;

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Find all overdue repayments
            // that have no penalty yet
            String sql =
                    "SELECT lr.repayment_id, " +
                            "lr.loan_id, " +
                            "lr.due_date, " +
                            "lr.amount_due, " +
                            "lr.amount_paid, " +
                            "lr.penalty_amount, " +
                            "l.loan_number, " +
                            "m.full_name " +
                            "FROM loan_repayments lr " +
                            "JOIN loans l " +
                            "ON lr.loan_id = l.loan_id " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "WHERE lr.due_date < ? " +
                            "AND lr.payment_status " +
                            "= 'pending' " +
                            "AND l.status = 'disbursed'";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(
                    1, LocalDate.now().toString()
            );
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                int repaymentId =
                        rs.getInt("repayment_id");
                double amountDue =
                        rs.getDouble("amount_due");
                double existingPenalty =
                        rs.getDouble("penalty_amount");
                LocalDate dueDate =
                        LocalDate.parse(
                                rs.getString("due_date")
                        );

                // Calculate months overdue
                long monthsOverdue =
                        java.time.temporal.ChronoUnit
                                .MONTHS.between(
                                        dueDate,
                                        LocalDate.now()
                                );

                if (monthsOverdue < 1)
                    monthsOverdue = 1;

                // Calculate new penalty
                double newPenalty =
                        amountDue *
                                PENALTY_RATE *
                                monthsOverdue;

                // Only update if penalty increased
                if (newPenalty > existingPenalty) {
                    String update =
                            "UPDATE loan_repayments " +
                                    "SET penalty_amount = ?, " +
                                    "payment_status = 'overdue' " +
                                    "WHERE repayment_id = ?";

                    PreparedStatement updateStmt =
                            conn.prepareStatement(update);
                    updateStmt.setDouble(
                            1, newPenalty
                    );
                    updateStmt.setInt(
                            2, repaymentId
                    );
                    updateStmt.executeUpdate();

                    penaltiesApplied++;
                    totalPenalties += newPenalty;

                    System.out.println(
                            "Penalty applied: " +
                                    rs.getString("loan_number") +
                                    " - " +
                                    rs.getString("full_name") +
                                    " - UGX " +
                                    String.format(
                                            "%,.0f", newPenalty
                                    )
                    );
                }
            }

        } catch (SQLException e) {
            System.out.println(
                    "Penalty engine error: " +
                            e.getMessage()
            );
        }

        if (penaltiesApplied > 0) {
            return "⚠ " + penaltiesApplied +
                    " overdue loans found!\n" +
                    "Total penalties applied: UGX " +
                    String.format(
                            "%,.0f", totalPenalties
                    );
        }
        return "✅ No overdue loans found.";
    }

    // Get penalty summary for display
    public static javafx.collections
            .ObservableList<String[]>
    getOverdueSummary() {

        javafx.collections.ObservableList<String[]>
                list = javafx.collections
                .FXCollections.observableArrayList();

        try {
            Connection conn =
                    DBConnection.getConnection();

            String sql =
                    "SELECT l.loan_number, " +
                            "m.full_name, " +
                            "m.phone_number, " +
                            "lr.due_date, " +
                            "lr.amount_due, " +
                            "lr.penalty_amount, " +
                            "(lr.amount_due + " +
                            "lr.penalty_amount) " +
                            "AS total_owed, " +
                            "DATEDIFF(CURDATE(), " +
                            "lr.due_date) AS days_overdue " +
                            "FROM loan_repayments lr " +
                            "JOIN loans l " +
                            "ON lr.loan_id = l.loan_id " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "WHERE lr.payment_status " +
                            "= 'overdue' " +
                            "ORDER BY lr.due_date ASC";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();

            while (rs.next()) {
                list.add(new String[]{
                        rs.getString("loan_number"),
                        rs.getString("full_name"),
                        rs.getString("phone_number"),
                        rs.getString("due_date"),
                        String.format("%,.0f",
                                rs.getDouble("amount_due")),
                        String.format("%,.0f",
                                rs.getDouble("penalty_amount")),
                        String.format("%,.0f",
                                rs.getDouble("total_owed")),
                        rs.getString("days_overdue") +
                                " days"
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
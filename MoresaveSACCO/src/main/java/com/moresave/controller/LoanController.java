package com.moresave.controller;

import com.moresave.util.DBConnection;
import java.sql.*;
import java.time.LocalDate;

public class LoanController {

    private static final double INTEREST_RATE = 0.02;

    public String applyForLoan(
            String memberNumber,
            double loanAmount,
            int repaymentPeriod,
            String purpose) {

        try {
            Connection conn = DBConnection.getConnection();

            // Check member exists
            int memberId = getMemberId(conn, memberNumber);
            if (memberId == -1) {
                return "❌ Member number not found.";
            }

            // Check no active loan exists
            if (hasActiveLoan(conn, memberId)) {
                return "❌ Member already has an active loan.";
            }

            // ── ELIGIBILITY: must have saved >= 200,000 for >= 2 months ──
            String eligSql =
                "SELECT a.current_balance, a.opening_date " +
                "FROM accounts a " +
                "JOIN members m ON a.member_id = m.member_id " +
                "WHERE m.member_number = ?";
            PreparedStatement eligStmt = conn.prepareStatement(eligSql);
            eligStmt.setString(1, memberNumber);
            ResultSet eligRs = eligStmt.executeQuery();
            if (eligRs.next()) {
                double balance = eligRs.getDouble("current_balance");
                java.time.LocalDate openDate =
                    java.time.LocalDate.parse(eligRs.getString("opening_date"));
                long monthsSaving = java.time.temporal.ChronoUnit.MONTHS
                    .between(openDate, java.time.LocalDate.now());
                if (balance < 200000) {
                    return "❌ Loan denied. Minimum savings balance of UGX 200,000 required.\n" +
                           "Current balance: UGX " + String.format("%,.0f", balance);
                }
                if (monthsSaving < 2) {
                    return "❌ Loan denied. Member must be active and saving for at least 2 months.\n" +
                           "Account opened: " + openDate + "\n" +
                           "Months saving: " + monthsSaving + " (need 2)";
                }
            } else {
                return "❌ No savings account found for this member.";
            }

            // Calculate loan figures
            double totalInterest =
                    loanAmount * INTEREST_RATE *
                            repaymentPeriod;
            double totalPayable =
                    loanAmount + totalInterest;
            double monthlyPayment =
                    totalPayable / repaymentPeriod;

            // Generate loan number
            String loanNumber =
                    generateLoanNumber(conn);

            // Insert loan into database
            String sql =
                    "INSERT INTO loans " +
                            "(loan_number, member_id, loan_amount, " +
                            "interest_rate, repayment_period, " +
                            "monthly_payment, total_payable, " +
                            "purpose, application_date, " +
                            "outstanding_balance, status) " +
                            "VALUES " +
                            "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, loanNumber);
            stmt.setInt(2, memberId);
            stmt.setDouble(3, loanAmount);
            stmt.setDouble(4, INTEREST_RATE * 100);
            stmt.setInt(5, repaymentPeriod);
            stmt.setDouble(6, monthlyPayment);
            stmt.setDouble(7, totalPayable);
            stmt.setString(8, purpose);
            stmt.setString(9,
                    LocalDate.now().toString()
            );
            stmt.setDouble(10, totalPayable);
            stmt.setString(11, "pending");
            stmt.executeUpdate();

            // Send email notification to member
            try {
                String emailSql =
                    "SELECT m.email, m.full_name FROM members m WHERE m.member_number = ?";
                PreparedStatement emailStmt = conn.prepareStatement(emailSql);
                emailStmt.setString(1, memberNumber);
                ResultSet emailRs = emailStmt.executeQuery();
                if (emailRs.next()) {
                    com.moresave.util.EmailService.sendLoanApplicationReceived(
                        emailRs.getString("email"),
                        emailRs.getString("full_name"),
                        loanNumber, loanAmount, repaymentPeriod, monthlyPayment
                    );
                }
            } catch (Exception ignored) {}

            return String.format(
                    "✅ Loan application submitted!\n" +
                            "Loan Number: %s\n" +
                            "Amount: UGX %,.0f\n" +
                            "Monthly Payment: UGX %,.0f\n" +
                            "Total Payable: UGX %,.0f\n" +
                            "Status: Pending Approval",
                    loanNumber, loanAmount,
                    monthlyPayment, totalPayable
            );

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public String approveLoan(String loanNumber) {
        try {
            Connection conn = DBConnection.getConnection();

            String getLoan =
                    "SELECT l.*, m.email, m.full_name FROM loans l " +
                    "JOIN members m ON l.member_id = m.member_id " +
                    "WHERE l.loan_number = ? AND l.status = 'pending'";
            PreparedStatement stmt = conn.prepareStatement(getLoan);
            stmt.setString(1, loanNumber);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                return "❌ Loan not found or already processed.";
            }

            int loanId = rs.getInt("loan_id");
            double monthlyPayment = rs.getDouble("monthly_payment");
            int period = rs.getInt("repayment_period");
            double loanAmount = rs.getDouble("loan_amount");
            String memberEmail = rs.getString("email");
            String memberName  = rs.getString("full_name");
            String maturityDate = LocalDate.now().plusMonths(period).toString();

            String approve =
                    "UPDATE loans SET status = 'approved', " +
                    "approval_date = ?, disbursement_date = ?, maturity_date = ? " +
                    "WHERE loan_number = ?";
            PreparedStatement approveStmt = conn.prepareStatement(approve);
            approveStmt.setString(1, LocalDate.now().toString());
            approveStmt.setString(2, LocalDate.now().toString());
            approveStmt.setString(3, maturityDate);
            approveStmt.setString(4, loanNumber);
            approveStmt.executeUpdate();

            generateRepaymentSchedule(conn, loanId, monthlyPayment, period);

            String disburse = "UPDATE loans SET status = 'disbursed' WHERE loan_number = ?";
            PreparedStatement disburseStmt = conn.prepareStatement(disburse);
            disburseStmt.setString(1, loanNumber);
            disburseStmt.executeUpdate();

            // Email notification
            com.moresave.util.EmailService.sendLoanApproved(
                memberEmail, memberName, loanNumber, loanAmount, monthlyPayment, maturityDate
            );

            return "✅ Loan approved and disbursed!\nRepayment schedule generated.";

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    private void generateRepaymentSchedule(
            Connection conn,
            int loanId,
            double monthlyPayment,
            int period) throws SQLException {

        // Get loan details for calculations
        String getLoan =
                "SELECT loan_amount, interest_rate, " +
                        "total_payable FROM loans " +
                        "WHERE loan_id = ?";
        PreparedStatement stmt =
                conn.prepareStatement(getLoan);
        stmt.setInt(1, loanId);
        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            double loanAmount =
                    rs.getDouble("loan_amount");
            double interestRate =
                    rs.getDouble("interest_rate") / 100;
            double remainingBalance =
                    rs.getDouble("total_payable");

            double principalPerMonth =
                    loanAmount / period;
            double interestPerMonth =
                    loanAmount * interestRate;

            String sql =
                    "INSERT INTO loan_repayments " +
                            "(loan_id, due_date, amount_due, " +
                            "principal_portion, interest_portion, " +
                            "remaining_balance, payment_status) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?)";

            PreparedStatement insertStmt =
                    conn.prepareStatement(sql);

            for (int i = 1; i <= period; i++) {
                remainingBalance -= monthlyPayment;
                if (remainingBalance < 0)
                    remainingBalance = 0;

                insertStmt.setInt(1, loanId);
                insertStmt.setString(2,
                        LocalDate.now()
                                .plusMonths(i).toString()
                );
                insertStmt.setDouble(3, monthlyPayment);
                insertStmt.setDouble(
                        4, principalPerMonth
                );
                insertStmt.setDouble(
                        5, interestPerMonth
                );
                insertStmt.setDouble(
                        6, remainingBalance
                );
                insertStmt.setString(7, "pending");
                insertStmt.addBatch();
            }
            insertStmt.executeBatch();
        }
    }

    private int getMemberId(
            Connection conn,
            String memberNumber) throws SQLException {

        String sql =
                "SELECT member_id FROM members " +
                        "WHERE member_number = ?";
        PreparedStatement stmt =
                conn.prepareStatement(sql);
        stmt.setString(1, memberNumber);
        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            return rs.getInt("member_id");
        }
        return -1;
    }

    private boolean hasActiveLoan(
            Connection conn,
            int memberId) throws SQLException {

        String sql =
                "SELECT COUNT(*) as total FROM loans " +
                        "WHERE member_id = ? " +
                        "AND status IN " +
                        "('pending','approved','disbursed')";
        PreparedStatement stmt =
                conn.prepareStatement(sql);
        stmt.setInt(1, memberId);
        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            return rs.getInt("total") > 0;
        }
        return false;
    }

    private String generateLoanNumber(
            Connection conn) throws SQLException {

        String sql =
                "SELECT COUNT(*) as total FROM loans";
        PreparedStatement stmt =
                conn.prepareStatement(sql);
        ResultSet rs = stmt.executeQuery();
        int count = 0;
        if (rs.next()) {
            count = rs.getInt("total");
        }
        return "LN" +
                String.format("%05d", count + 1);
    }

    // Get all pending loans
    public javafx.collections.ObservableList<String[]>
    getPendingLoans() {

        javafx.collections.ObservableList<String[]>
                list = javafx.collections
                .FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT l.loan_number, " +
                            "m.full_name, l.loan_amount, " +
                            "l.repayment_period, " +
                            "l.monthly_payment, " +
                            "l.purpose, l.application_date " +
                            "FROM loans l " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "WHERE l.status = 'pending' " +
                            "ORDER BY l.application_date ASC";

            ResultSet rs = conn.prepareStatement(sql)
                    .executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                        rs.getString(1),
                        rs.getString(2),
                        String.format("%,.0f",
                                rs.getDouble(3)),
                        rs.getString(4),
                        String.format("%,.0f",
                                rs.getDouble(5)),
                        rs.getString(6),
                        rs.getString(7)
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    // Get all approved loans
    public javafx.collections.ObservableList<String[]>
    getApprovedLoans() {

        javafx.collections.ObservableList<String[]>
                list = javafx.collections
                .FXCollections.observableArrayList();
        try {
            Connection conn =
                    DBConnection.getConnection();
            String sql =
                    "SELECT l.loan_number, " +
                            "m.full_name, l.loan_amount, " +
                            "l.monthly_payment, " +
                            "l.maturity_date, l.status " +
                            "FROM loans l " +
                            "JOIN members m " +
                            "ON l.member_id = m.member_id " +
                            "WHERE l.status IN " +
                            "('approved','disbursed') " +
                            "ORDER BY l.approval_date DESC";

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
                        rs.getString(5),
                        rs.getString(6).toUpperCase()
                });
            }
        } catch (SQLException e) {
            System.out.println(
                    "Error: " + e.getMessage()
            );
        }
        return list;
    }

    public String rejectLoan(String loanNumber) {
        try {
            Connection conn = DBConnection.getConnection();

            // Get member email before rejecting
            String infoSql =
                "SELECT m.email, m.full_name FROM loans l " +
                "JOIN members m ON l.member_id = m.member_id " +
                "WHERE l.loan_number = ? AND l.status = 'pending'";
            PreparedStatement infoStmt = conn.prepareStatement(infoSql);
            infoStmt.setString(1, loanNumber);
            ResultSet infoRs = infoStmt.executeQuery();
            String memberEmail = null, memberName = null;
            if (infoRs.next()) {
                memberEmail = infoRs.getString("email");
                memberName  = infoRs.getString("full_name");
            }

            String sql = "UPDATE loans SET status = 'rejected' WHERE loan_number = ? AND status = 'pending'";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, loanNumber);
            int rows = stmt.executeUpdate();

            if (rows > 0) {
                com.moresave.util.EmailService.sendLoanRejected(
                    memberEmail, memberName, loanNumber,
                    "Application did not meet approval criteria."
                );
                return "✅ Loan " + loanNumber + " has been rejected.";
            } else {
                return "❌ Loan not found or already processed.";
            }
        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    // Record a loan repayment payment
    public String recordRepayment(
            String loanNumber,
            double amountPaid) {

        try {
            Connection conn =
                    DBConnection.getConnection();

            // Get the earliest unpaid/overdue installment
            String getSql =
                    "SELECT lr.repayment_id, " +
                            "lr.amount_due, " +
                            "lr.penalty_amount, " +
                            "l.loan_id, " +
                            "l.outstanding_balance " +
                            "FROM loan_repayments lr " +
                            "JOIN loans l " +
                            "ON lr.loan_id = l.loan_id " +
                            "WHERE l.loan_number = ? " +
                            "AND lr.payment_status " +
                            "IN ('pending','overdue') " +
                            "ORDER BY lr.due_date ASC " +
                            "LIMIT 1";

            PreparedStatement getStmt =
                    conn.prepareStatement(getSql);
            getStmt.setString(1, loanNumber);
            ResultSet rs = getStmt.executeQuery();

            if (!rs.next()) {
                return "❌ No pending repayments " +
                        "found for this loan.";
            }

            int repaymentId =
                    rs.getInt("repayment_id");
            double amountDue =
                    rs.getDouble("amount_due");
            double penalty =
                    rs.getDouble("penalty_amount");
            int loanId = rs.getInt("loan_id");
            double outstanding =
                    rs.getDouble("outstanding_balance");

            double totalDue = amountDue + penalty;

            // Mark installment as paid
            String updateRepayment =
                    "UPDATE loan_repayments " +
                            "SET amount_paid = ?, " +
                            "payment_status = 'paid', " +
                            "payment_date = NOW() " +
                            "WHERE repayment_id = ?";
            PreparedStatement updateStmt =
                    conn.prepareStatement(updateRepayment);
            updateStmt.setDouble(1, amountPaid);
            updateStmt.setInt(2, repaymentId);
            updateStmt.executeUpdate();

            // Update outstanding balance on loan
            double newOutstanding =
                    Math.max(0, outstanding - amountPaid);
            String updateLoan =
                    "UPDATE loans " +
                            "SET outstanding_balance = ? " +
                            "WHERE loan_id = ?";
            PreparedStatement loanStmt =
                    conn.prepareStatement(updateLoan);
            loanStmt.setDouble(1, newOutstanding);
            loanStmt.setInt(2, loanId);
            loanStmt.executeUpdate();

            // If fully paid, close the loan
            if (newOutstanding == 0) {
                String closeLoan =
                        "UPDATE loans SET status = 'closed' " +
                                "WHERE loan_id = ?";
                PreparedStatement closeStmt =
                        conn.prepareStatement(closeLoan);
                closeStmt.setInt(1, loanId);
                closeStmt.executeUpdate();
                return "✅ Payment recorded! " +
                        "Loan fully repaid and closed.";
            }

            return String.format(
                    "✅ Payment of UGX %,.0f recorded!\n" +
                            "Outstanding Balance: UGX %,.0f",
                    amountPaid, newOutstanding
            );

        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public String saveCollateral(int loanId, int memberId, String collateralType,
            String description, double estimatedValue, String documentRef) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql = "INSERT INTO collateral (loan_id, member_id, collateral_type, " +
                         "description, estimated_value, document_ref) VALUES (?,?,?,?,?,?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, loanId);
            stmt.setInt(2, memberId);
            stmt.setString(3, collateralType);
            stmt.setString(4, description);
            stmt.setDouble(5, estimatedValue);
            stmt.setString(6, documentRef.isEmpty() ? null : documentRef);
            stmt.executeUpdate();
            return "✅ Collateral recorded successfully.";
        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public javafx.collections.ObservableList<String[]> getCollateralForLoan(int loanId) {
        javafx.collections.ObservableList<String[]> list =
            javafx.collections.FXCollections.observableArrayList();
        try (Connection conn = DBConnection.getConnection()) {
            String sql = "SELECT collateral_type, description, estimated_value, " +
                         "document_ref, status, created_at FROM collateral WHERE loan_id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, loanId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("collateral_type"),
                    rs.getString("description"),
                    String.format("%,.0f", rs.getDouble("estimated_value")),
                    rs.getString("document_ref") != null ? rs.getString("document_ref") : "",
                    rs.getString("status").toUpperCase(),
                    rs.getString("created_at")
                });
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return list;
    }

    public int getLoanIdByNumber(String loanNumber) {
        try (Connection conn = DBConnection.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT loan_id FROM loans WHERE loan_number = ?");
            stmt.setString(1, loanNumber);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return rs.getInt("loan_id");
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return -1;
    }
}
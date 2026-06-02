package com.moresave.util;

/**
 * Unified notification service.
 * Fires SMS + Email simultaneously in a background thread
 * so the UI never blocks waiting for network calls.
 *
 * Called automatically by controllers on every operation:
 *   - Member registration
 *   - Loan application submitted
 *   - Loan approved / rejected
 *   - Deposit / withdrawal recorded
 *   - Overdue payment detected
 *   - Loan repayment received
 */
public class NotificationService {

    /** Send both SMS and Email in background — non-blocking */
    private static void fire(Runnable task) {
        Thread t = new Thread(task);
        t.setDaemon(true);
        t.start();
    }

    // ── Member registered ─────────────────────────────────────────────────
    public static void notifyWelcome(String email, String phone,
            String memberName, String memberNumber, String password) {
        fire(() -> {
            EmailService.sendWelcome(email, memberName, memberNumber, password);
            SmsService.sendWelcome(phone, memberName, memberNumber);
            AuditService.log("system", "NOTIFICATION_SENT", "users", memberNumber,
                "Welcome notification sent to " + memberName);
        });
    }

    // ── Loan application submitted ────────────────────────────────────────
    public static void notifyLoanApplicationReceived(String email, String phone,
            String memberName, String loanNumber, double amount, int period, double monthly) {
        fire(() -> {
            EmailService.sendLoanApplicationReceived(email, memberName, loanNumber, amount, period, monthly);
            SmsService.sendLoanApplicationReceived(phone, loanNumber, amount);
            AuditService.log("system", "NOTIFICATION_SENT", "loans", loanNumber,
                "Loan application notification sent to " + memberName);
        });
    }

    // ── Loan approved + automatic mobile money disbursement ───────────────
    public static void notifyLoanApproved(String email, String phone,
            String memberName, String loanNumber, double amount, double monthly, String maturityDate) {
        fire(() -> {
            // 1. Send approval notification
            EmailService.sendLoanApproved(email, memberName, loanNumber, amount, monthly, maturityDate);
            SmsService.sendLoanApproved(phone, loanNumber, amount, monthly);

            // 2. Automatically disburse via Mobile Money (USSD push to member's phone)
            //    Member receives prompt on phone → enters PIN → receives money
            if (AppConfig.getBool("mobilemoney.enabled")) {
                String disbursementResult = MobileMoneyService.disburseLoan(
                    phone, amount,
                    "Moresave SACCO loan " + loanNumber + " disbursement"
                );
                System.out.println("[MOBILE MONEY DISBURSEMENT] " + loanNumber + ": " + disbursementResult);
                AuditService.log("system", "MOBILE_MONEY_DISBURSEMENT", "loans", loanNumber,
                    "Disbursement to " + phone + ": " + disbursementResult);
            }

            AuditService.log("system", "NOTIFICATION_SENT", "loans", loanNumber,
                "Loan approval notification sent to " + memberName);
        });
    }

    // ── Loan rejected ─────────────────────────────────────────────────────
    public static void notifyLoanRejected(String email, String phone,
            String memberName, String loanNumber, String reason) {
        fire(() -> {
            EmailService.sendLoanRejected(email, memberName, loanNumber, reason);
            SmsService.sendLoanRejected(phone, loanNumber);
            AuditService.log("system", "NOTIFICATION_SENT", "loans", loanNumber,
                "Loan rejection notification sent to " + memberName);
        });
    }

    // ── Overdue payment reminder ──────────────────────────────────────────
    public static void notifyOverdue(String email, String phone,
            String memberName, String loanNumber, double amountDue, double penalty, String dueDate) {
        fire(() -> {
            EmailService.sendOverdueReminder(email, memberName, loanNumber, amountDue, penalty, dueDate);
            SmsService.sendOverdueReminder(phone, loanNumber, amountDue, penalty);
            AuditService.log("system", "NOTIFICATION_SENT", "loans", loanNumber,
                "Overdue reminder sent to " + memberName);
        });
    }

    // ── Deposit confirmed ─────────────────────────────────────────────────
    public static void notifyDeposit(String email, String phone,
            String memberName, double amount, double newBalance, String date) {
        fire(() -> {
            EmailService.sendDepositConfirmation(email, memberName, amount, newBalance, date);
            SmsService.sendDepositConfirmation(phone, amount, newBalance);
            AuditService.log("system", "NOTIFICATION_SENT", "transactions", null,
                "Deposit confirmation sent to " + memberName + " UGX " + String.format("%,.0f", amount));
        });
    }

    // ── Withdrawal confirmed ──────────────────────────────────────────────
    public static void notifyWithdrawal(String email, String phone,
            String memberName, double amount, double newBalance, String date) {
        fire(() -> {
            EmailService.sendDepositConfirmation(email, memberName, amount, newBalance, date);
            SmsService.sendWithdrawalConfirmation(phone, amount, newBalance);
            AuditService.log("system", "NOTIFICATION_SENT", "transactions", null,
                "Withdrawal confirmation sent to " + memberName + " UGX " + String.format("%,.0f", amount));
        });
    }

    // ── Dividend approved ─────────────────────────────────────────────────
    public static void notifyDividend(String email, String phone,
            String memberName, String year, double amount) {
        fire(() -> {
            SmsService.sendDividendNotification(phone, year, amount);
            AuditService.log("system", "NOTIFICATION_SENT", "dividends", year,
                "Dividend notification sent to " + memberName + " UGX " + String.format("%,.0f", amount));
        });
    }

    // ── Password changed ──────────────────────────────────────────────────
    public static void notifyPasswordChanged(String email, String phone, String memberName) {
        fire(() -> {
            SmsService.sendPasswordChanged(phone, memberName);
            AuditService.log("system", "NOTIFICATION_SENT", "users", null,
                "Password change notification sent to " + memberName);
        });
    }

    // ── Loan repayment received ───────────────────────────────────────────
    public static void notifyRepaymentReceived(String email, String phone,
            String memberName, String loanNumber, double amountPaid, double outstanding) {
        fire(() -> {
            EmailService.sendPaymentConfirmation(email, memberName, loanNumber, amountPaid, outstanding);
            SmsService.sendPaymentConfirmation(phone, loanNumber, amountPaid, outstanding);
            AuditService.log("system", "NOTIFICATION_SENT", "loans", loanNumber,
                "Repayment confirmation sent to " + memberName + " UGX " + String.format("%,.0f", amountPaid));
        });
    }

    // ── Mobile money repayment collection (member pays via phone) ─────────
    public static void collectLoanRepayment(String phone, String memberName,
            String loanNumber, double amount) {
        fire(() -> {
            if (AppConfig.getBool("mobilemoney.enabled")) {
                // Send USSD push — member gets prompt on phone, enters PIN, payment collected
                String result = MobileMoneyService.collectPayment(
                    phone, amount,
                    "Moresave SACCO loan " + loanNumber + " repayment"
                );
                System.out.println("[MOBILE MONEY COLLECTION] " + loanNumber + ": " + result);
                AuditService.log("system", "MOBILE_MONEY_COLLECTION", "loans", loanNumber,
                    "Payment collection from " + phone + ": " + result);
            } else {
                // Fallback: send SMS with manual payment instructions
                SmsService.sendMobileMoneyPrompt(phone, loanNumber, amount);
            }
        });
    }
}

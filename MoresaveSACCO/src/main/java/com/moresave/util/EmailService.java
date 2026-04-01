package com.moresave.util;

import javax.mail.*;
import javax.mail.internet.*;
import java.util.Properties;

/**
 * Email notification service for Moresave SACCO.
 * Configure SMTP settings below before use.
 * Uses Gmail SMTP by default — set your Gmail address and App Password.
 *
 * To enable Gmail App Password:
 *   Google Account → Security → 2-Step Verification → App Passwords
 */
public class EmailService {

    // ── CONFIGURE THESE ──────────────────────────────────────────────────
    private static final String SMTP_HOST     = "smtp.gmail.com";
    private static final int    SMTP_PORT     = 587;
    private static final String SENDER_EMAIL  = "moresavesacco@gmail.com"; // change to your Gmail
    private static final String SENDER_PASS   = "your_app_password_here";  // Gmail App Password
    private static final String SACCO_NAME    = "Moresave SACCO";
    private static final boolean EMAIL_ENABLED = false; // set true when credentials are configured
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Send an email. Returns true on success, false on failure.
     * Silently fails if EMAIL_ENABLED is false.
     */
    public static boolean send(String toEmail, String subject, String body) {
        if (!EMAIL_ENABLED || toEmail == null || toEmail.isEmpty() || !toEmail.contains("@")) {
            System.out.println("[EMAIL DISABLED] To: " + toEmail + " | Subject: " + subject);
            return false;
        }
        try {
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", SMTP_HOST);
            props.put("mail.smtp.port", String.valueOf(SMTP_PORT));
            props.put("mail.smtp.ssl.trust", SMTP_HOST);

            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASS);
                }
            });

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL, SACCO_NAME));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject);
            message.setContent(buildHtml(subject, body), "text/html; charset=utf-8");
            Transport.send(message);
            System.out.println("[EMAIL SENT] To: " + toEmail + " | Subject: " + subject);
            return true;
        } catch (Exception e) {
            System.out.println("[EMAIL ERROR] " + e.getMessage());
            return false;
        }
    }

    // ── Pre-built notification templates ─────────────────────────────────

    public static void sendWelcome(String toEmail, String memberName, String memberNumber, String password) {
        String subject = "Welcome to " + SACCO_NAME + " - Account Created";
        String body =
            "Dear " + memberName + ",\n\n" +
            "Welcome to " + SACCO_NAME + "! Your membership account has been successfully created.\n\n" +
            "Your Login Details:\n" +
            "  Member Number: " + memberNumber + "\n" +
            "  Default Password: " + password + "\n\n" +
            "Please log in and change your password immediately.\n\n" +
            "To qualify for a loan you must:\n" +
            "  • Be an active member for at least 2 months\n" +
            "  • Maintain a minimum savings balance of UGX 200,000\n\n" +
            "Thank you for joining " + SACCO_NAME + ".\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    public static void sendLoanApplicationReceived(String toEmail, String memberName,
            String loanNumber, double amount, int period, double monthly) {
        String subject = SACCO_NAME + " - Loan Application Received (" + loanNumber + ")";
        String body =
            "Dear " + memberName + ",\n\n" +
            "Your loan application has been received and is pending review.\n\n" +
            "Loan Details:\n" +
            "  Loan Number: " + loanNumber + "\n" +
            "  Amount Applied: UGX " + String.format("%,.0f", amount) + "\n" +
            "  Repayment Period: " + period + " months\n" +
            "  Monthly Payment: UGX " + String.format("%,.0f", monthly) + "\n" +
            "  Status: PENDING APPROVAL\n\n" +
            "You will be notified once your application is reviewed.\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    public static void sendLoanApproved(String toEmail, String memberName,
            String loanNumber, double amount, double monthly, String maturityDate) {
        String subject = SACCO_NAME + " - Loan APPROVED (" + loanNumber + ")";
        String body =
            "Dear " + memberName + ",\n\n" +
            "Congratulations! Your loan application has been APPROVED and disbursed.\n\n" +
            "Loan Details:\n" +
            "  Loan Number: " + loanNumber + "\n" +
            "  Amount Disbursed: UGX " + String.format("%,.0f", amount) + "\n" +
            "  Monthly Payment: UGX " + String.format("%,.0f", monthly) + "\n" +
            "  Maturity Date: " + maturityDate + "\n\n" +
            "Please ensure timely repayments to avoid penalties (2% per month on overdue amounts).\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    public static void sendLoanRejected(String toEmail, String memberName, String loanNumber, String reason) {
        String subject = SACCO_NAME + " - Loan Application Update (" + loanNumber + ")";
        String body =
            "Dear " + memberName + ",\n\n" +
            "We regret to inform you that your loan application " + loanNumber + " has not been approved.\n\n" +
            "Reason: " + reason + "\n\n" +
            "Loan Eligibility Requirements:\n" +
            "  • Active member for at least 2 months\n" +
            "  • Minimum savings balance of UGX 200,000\n" +
            "  • No existing active loan\n\n" +
            "You may reapply once you meet all requirements.\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    public static void sendOverdueReminder(String toEmail, String memberName,
            String loanNumber, double amountDue, double penalty, String dueDate) {
        String subject = SACCO_NAME + " - OVERDUE LOAN PAYMENT REMINDER (" + loanNumber + ")";
        String body =
            "Dear " + memberName + ",\n\n" +
            "This is a reminder that your loan repayment is OVERDUE.\n\n" +
            "  Loan Number: " + loanNumber + "\n" +
            "  Due Date: " + dueDate + "\n" +
            "  Amount Due: UGX " + String.format("%,.0f", amountDue) + "\n" +
            "  Penalty Applied: UGX " + String.format("%,.0f", penalty) + "\n" +
            "  Total Owed: UGX " + String.format("%,.0f", amountDue + penalty) + "\n\n" +
            "Please make payment immediately to avoid further penalties.\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    public static void sendDepositConfirmation(String toEmail, String memberName,
            double amount, double newBalance, String date) {
        String subject = SACCO_NAME + " - Deposit Confirmation";
        String body =
            "Dear " + memberName + ",\n\n" +
            "Your deposit has been recorded successfully.\n\n" +
            "  Amount Deposited: UGX " + String.format("%,.0f", amount) + "\n" +
            "  New Balance: UGX " + String.format("%,.0f", newBalance) + "\n" +
            "  Date: " + date + "\n\n" +
            "Thank you for saving with " + SACCO_NAME + ".\n\n" +
            "Regards,\n" + SACCO_NAME + " Management";
        send(toEmail, subject, body);
    }

    // ── HTML wrapper for nicer emails ─────────────────────────────────────
    private static String buildHtml(String subject, String body) {
        String htmlBody = body.replace("\n", "<br>").replace("  ", "&nbsp;&nbsp;");
        return "<html><body style='font-family:Arial,sans-serif;color:#2b2b2b;'>" +
               "<div style='background:#4E3526;padding:20px;text-align:center;'>" +
               "<h2 style='color:white;margin:0;'>MORESAVE SACCO</h2>" +
               "<p style='color:#D4C5B5;margin:4px 0 0;'>Kisekende LC1, Mubende Municipality</p>" +
               "</div>" +
               "<div style='padding:24px;background:#FDFBF7;'>" +
               "<h3 style='color:#4E3526;'>" + subject + "</h3>" +
               "<p>" + htmlBody + "</p>" +
               "</div>" +
               "<div style='background:#F6F1EA;padding:12px;text-align:center;font-size:12px;color:#8B6B4A;'>" +
               "This is an automated message from Moresave SACCO Management System." +
               "</div></body></html>";
    }
}

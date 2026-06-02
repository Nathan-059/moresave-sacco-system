package com.moresave.util;

import javax.mail.*;
import javax.mail.internet.*;
import java.util.Properties;

public class EmailService {

    private static final String SACCO_NAME = "Moresave SACCO";

    public static boolean send(String toEmail, String subject, String body) {
        if (!AppConfig.getBool("email.enabled")) {
            System.out.println("[EMAIL DISABLED] To: " + toEmail + " | " + subject);
            return false;
        }
        if (toEmail == null || toEmail.isEmpty() || !toEmail.contains("@")) return false;

        String host  = AppConfig.get("email.host");
        int    port  = Integer.parseInt(AppConfig.get("email.port").isEmpty() ? "587" : AppConfig.get("email.port"));
        String from  = AppConfig.get("email.address");
        String pass  = AppConfig.get("email.password");

        try {
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", host);
            props.put("mail.smtp.port", String.valueOf(port));
            props.put("mail.smtp.ssl.trust", host);

            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(from, pass);
                }
            });

            Message msg = new MimeMessage(session);
            msg.setFrom(new InternetAddress(from, SACCO_NAME));
            msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            msg.setSubject(subject);
            msg.setContent(buildHtml(subject, body), "text/html; charset=utf-8");
            Transport.send(msg);
            System.out.println("[EMAIL SENT] To: " + toEmail);
            return true;
        } catch (Exception e) {
            System.out.println("[EMAIL ERROR] " + e.getMessage());
            return false;
        }
    }

    public static void sendWelcome(String email, String name, String memberNo, String pwd) {
        send(email, "Welcome to " + SACCO_NAME + " - Account Created",
            "Dear " + name + ",\n\nWelcome to " + SACCO_NAME + "!\n\n" +
            "Member Number: " + memberNo + "\nDefault Password: " + pwd + "\n\n" +
            "Please log in and change your password immediately.\n\n" +
            "Loan eligibility: Active 2+ months | Savings ≥ UGX 200,000\n\n" +
            "Regards,\n" + SACCO_NAME);
    }

    public static void sendLoanApplicationReceived(String email, String name,
            String loanNo, double amount, int period, double monthly) {
        send(email, SACCO_NAME + " - Loan Application Received (" + loanNo + ")",
            "Dear " + name + ",\n\nYour loan application has been received.\n\n" +
            "Loan No: " + loanNo + "\nAmount: UGX " + String.format("%,.0f", amount) +
            "\nPeriod: " + period + " months\nMonthly: UGX " + String.format("%,.0f", monthly) +
            "\nStatus: PENDING APPROVAL\n\nYou will be notified once reviewed.\n\nRegards,\n" + SACCO_NAME);
    }

    public static void sendLoanApproved(String email, String name,
            String loanNo, double amount, double monthly, String maturity) {
        send(email, SACCO_NAME + " - Loan APPROVED (" + loanNo + ")",
            "Dear " + name + ",\n\nCongratulations! Your loan has been APPROVED and disbursed.\n\n" +
            "Loan No: " + loanNo + "\nAmount: UGX " + String.format("%,.0f", amount) +
            "\nMonthly: UGX " + String.format("%,.0f", monthly) + "\nMaturity: " + maturity +
            "\n\nMake timely payments to avoid 2% monthly penalties.\n\nRegards,\n" + SACCO_NAME);
    }

    public static void sendLoanRejected(String email, String name, String loanNo, String reason) {
        send(email, SACCO_NAME + " - Loan Application Update (" + loanNo + ")",
            "Dear " + name + ",\n\nYour loan application " + loanNo + " was not approved.\n\n" +
            "Reason: " + reason + "\n\nRequirements: Active 2+ months | Savings ≥ UGX 200,000 | No active loan\n\n" +
            "Regards,\n" + SACCO_NAME);
    }

    public static void sendOverdueReminder(String email, String name,
            String loanNo, double due, double penalty, String dueDate) {
        send(email, SACCO_NAME + " - OVERDUE PAYMENT REMINDER (" + loanNo + ")",
            "Dear " + name + ",\n\nYour loan repayment is OVERDUE.\n\n" +
            "Loan No: " + loanNo + "\nDue Date: " + dueDate +
            "\nAmount Due: UGX " + String.format("%,.0f", due) +
            "\nPenalty: UGX " + String.format("%,.0f", penalty) +
            "\nTotal Owed: UGX " + String.format("%,.0f", due + penalty) +
            "\n\nPay immediately to avoid further penalties.\n\nRegards,\n" + SACCO_NAME);
    }

    public static void sendDepositConfirmation(String email, String name,
            double amount, double balance, String date) {
        send(email, SACCO_NAME + " - Deposit Confirmation",
            "Dear " + name + ",\n\nDeposit confirmed.\n\n" +
            "Amount: UGX " + String.format("%,.0f", amount) +
            "\nNew Balance: UGX " + String.format("%,.0f", balance) +
            "\nDate: " + date + "\n\nThank you for saving with us.\n\nRegards,\n" + SACCO_NAME);
    }

    public static void sendPaymentConfirmation(String email, String name,
            String loanNo, double amount, double outstanding) {
        send(email, SACCO_NAME + " - Loan Payment Confirmed (" + loanNo + ")",
            "Dear " + name + ",\n\nYour loan payment has been received.\n\n" +
            "Loan No: " + loanNo + "\nAmount Paid: UGX " + String.format("%,.0f", amount) +
            "\nOutstanding Balance: UGX " + String.format("%,.0f", outstanding) +
            "\n\nThank you.\n\nRegards,\n" + SACCO_NAME);
    }

    private static String buildHtml(String subject, String body) {
        String html = body.replace("\n", "<br>").replace("  ", "&nbsp;&nbsp;");
        return "<html><body style='font-family:Arial,sans-serif;color:#2b2b2b;'>" +
               "<div style='background:#4E3526;padding:20px;text-align:center;'>" +
               "<h2 style='color:white;margin:0;'>MORESAVE SACCO</h2>" +
               "<p style='color:#D4C5B5;margin:4px 0 0;'>Kisekende LC1, Mubende Municipality</p></div>" +
               "<div style='padding:24px;background:#FDFBF7;'><h3 style='color:#4E3526;'>" +
               subject + "</h3><p>" + html + "</p></div>" +
               "<div style='background:#F6F1EA;padding:12px;text-align:center;font-size:12px;color:#8B6B4A;'>" +
               "Automated message from Moresave SACCO Management System.</div></body></html>";
    }
}

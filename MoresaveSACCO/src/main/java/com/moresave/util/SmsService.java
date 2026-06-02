package com.moresave.util;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

/**
 * SMS service using Africa's Talking — MORESAVE SACCO production account.
 * Sends real SMS to Uganda phone numbers (MTN, Airtel).
 */
public class SmsService {

    // ── Production credentials (MORESAVE SACCO app) ──────────────────────
    private static final String AT_USERNAME  = "wxmzjtxepa";
    private static final String AT_API_KEY   =
        "atsk_d9f9c118d6f3b1b4d492aa92d51ae3f7f1a98d40f5f4c3c7e9e8de35cc81c1a4ad1aac6a";
    private static final String AT_SENDER_ID = "MORESAVE";
    private static final String AT_URL       =
        "https://api.africastalking.com/version1/messaging";
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Send SMS to a Uganda phone number.
     * Also checks AppConfig — if sms.enabled=false, skips sending.
     */
    public static boolean send(String phone, String message) {
        // Allow override from Settings screen
        if (!AppConfig.getBool("sms.enabled") &&
            AppConfig.get("sms.enabled").isEmpty()) {
            // Default: enabled (credentials are hardcoded)
        } else if (!AppConfig.getBool("sms.enabled") &&
                   !AppConfig.get("sms.enabled").isEmpty()) {
            System.out.println("[SMS DISABLED via Settings] To: " + phone);
            return false;
        }

        if (phone == null || phone.trim().isEmpty()) return false;

        // Use Settings override if configured, else use hardcoded credentials
        String username = AppConfig.get("sms.username").isEmpty()
            ? AT_USERNAME : AppConfig.get("sms.username");
        String apiKey = AppConfig.get("sms.apikey").isEmpty()
            ? AT_API_KEY : AppConfig.get("sms.apikey");
        String senderId = AppConfig.get("sms.senderid").isEmpty()
            ? AT_SENDER_ID : AppConfig.get("sms.senderid");

        try {
            String formatted = formatPhone(phone);
            String params =
                "username=" + URLEncoder.encode(username, "UTF-8") +
                "&to="       + URLEncoder.encode(formatted, "UTF-8") +
                "&message="  + URLEncoder.encode(message, "UTF-8") +
                "&from="     + URLEncoder.encode(senderId, "UTF-8");

            URL url = new URL(AT_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("apiKey", apiKey);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);
            conn.getOutputStream().write(params.getBytes(StandardCharsets.UTF_8));

            int code = conn.getResponseCode();
            System.out.println("[SMS] To: " + formatted + " | Status: " + code + " | " + message.substring(0, Math.min(50, message.length())));
            return code == 200 || code == 201;
        } catch (Exception e) {
            System.out.println("[SMS ERROR] " + e.getMessage());
            return false;
        }
    }

    private static String formatPhone(String phone) {
        phone = phone.trim().replaceAll("\\s+", "");
        if (phone.startsWith("07") || phone.startsWith("03")) return "+256" + phone.substring(1);
        if (phone.startsWith("256")) return "+" + phone;
        if (!phone.startsWith("+")) return "+256" + phone;
        return phone;
    }

    // ── SMS templates ─────────────────────────────────────────────────────

    public static void sendWelcome(String phone, String name, String memberNo) {
        send(phone,
            "Welcome to Moresave SACCO! " +
            "Member No: " + memberNo + ". " +
            "Default password: " + memberNo + ". " +
            "Login & change password immediately. " +
            "Loan eligibility: 2+ months saving, UGX 200,000+ balance."
        );
    }

    public static void sendLoanApplicationReceived(String phone, String loanNo, double amount) {
        send(phone,
            "Moresave SACCO: Loan application " + loanNo +
            " for UGX " + String.format("%,.0f", amount) +
            " received. Pending review. You will be notified of the decision."
        );
    }

    public static void sendLoanApproved(String phone, String loanNo, double amount, double monthly) {
        send(phone,
            "Moresave SACCO: LOAN APPROVED! " + loanNo +
            " - UGX " + String.format("%,.0f", amount) + " disbursed." +
            " Monthly: UGX " + String.format("%,.0f", monthly) +
            ". Pay on time to avoid 2% monthly penalty."
        );
    }

    public static void sendLoanRejected(String phone, String loanNo) {
        send(phone,
            "Moresave SACCO: Loan " + loanNo +
            " not approved. Requirements: active 2+ months, " +
            "savings >= UGX 200,000, no active loan. Visit office for details."
        );
    }

    public static void sendOverdueReminder(String phone, String loanNo, double due, double penalty) {
        send(phone,
            "Moresave SACCO OVERDUE: Loan " + loanNo +
            " - Amount: UGX " + String.format("%,.0f", due) +
            " + Penalty: UGX " + String.format("%,.0f", penalty) +
            " = UGX " + String.format("%,.0f", due + penalty) +
            ". Pay now to stop penalties growing."
        );
    }

    public static void sendDepositConfirmation(String phone, double amount, double balance) {
        send(phone,
            "Moresave SACCO: Deposit of UGX " + String.format("%,.0f", amount) +
            " confirmed. New balance: UGX " + String.format("%,.0f", balance) +
            ". Thank you for saving with us."
        );
    }

    public static void sendWithdrawalConfirmation(String phone, double amount, double balance) {
        send(phone,
            "Moresave SACCO: Withdrawal of UGX " + String.format("%,.0f", amount) +
            " processed. New balance: UGX " + String.format("%,.0f", balance) + "."
        );
    }

    public static void sendPaymentConfirmation(String phone, String loanNo,
            double amount, double outstanding) {
        send(phone,
            "Moresave SACCO: Payment of UGX " + String.format("%,.0f", amount) +
            " for loan " + loanNo + " received." +
            " Outstanding: UGX " + String.format("%,.0f", outstanding) +
            (outstanding == 0 ? " Loan fully paid!" : ". Keep it up!"));
    }

    public static void sendMobileMoneyPrompt(String phone, String loanNo, double amount) {
        send(phone,
            "Moresave SACCO: Pay loan " + loanNo +
            " - UGX " + String.format("%,.0f", amount) +
            ". MTN: dial *165*3# | Airtel: dial *185#. Ref: " + loanNo
        );
    }

    public static void sendDividendNotification(String phone, String year, double amount) {
        send(phone,
            "Moresave SACCO: Your " + year + " dividend of UGX " +
            String.format("%,.0f", amount) +
            " has been approved. Visit the office or log in to view details."
        );
    }

    public static void sendPasswordChanged(String phone, String memberName) {
        send(phone,
            "Moresave SACCO: Password for " + memberName +
            " was changed. If you did not do this, contact us immediately."
        );
    }
}

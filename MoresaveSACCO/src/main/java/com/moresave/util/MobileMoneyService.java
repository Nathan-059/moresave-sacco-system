package com.moresave.util;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

/**
 * Mobile Money integration via Africa's Talking Payments API.
 *
 * TWO operations:
 *
 * 1. collectPayment() — SACCO collects money FROM member's phone
 *    Used for: loan repayments, savings deposits
 *    Flow: System sends USSD push → member sees prompt on phone
 *          → member enters PIN → money deducted from their mobile wallet
 *          → SACCO receives payment automatically
 *
 * 2. disburseLoan() — SACCO sends money TO member's phone
 *    Used for: loan disbursement when loan is approved
 *    Flow: System initiates transfer → money sent to member's mobile wallet
 *          → member receives SMS confirmation of received funds
 *
 * Supports: MTN Mobile Money Uganda (+256 07XX), Airtel Money Uganda (+256 075X/076X)
 *
 * Setup: africastalking.com → Enable Payments → Create product "MoresaveSACCO"
 */
public class MobileMoneyService {

    private static final String AT_CHECKOUT_URL =
        "https://payments.africastalking.com/mobile/checkout/request";
    private static final String AT_B2C_URL =
        "https://payments.africastalking.com/mobile/b2c/request";
    private static final String PRODUCT_NAME = "MoresaveSACCO";
    private static final String CURRENCY = "UGX";

    /**
     * COLLECT payment from member's phone (loan repayment / deposit).
     * Sends a USSD push to the member's phone.
     * Member receives: "Moresave SACCO requests UGX X,XXX. Enter PIN to approve."
     */
    public static String collectPayment(String phone, double amount, String description) {
        if (!AppConfig.getBool("mobilemoney.enabled")) {
            return getManualPaymentInstructions(description, amount);
        }

        String username = AppConfig.get("mobilemoney.username");
        String apiKey   = AppConfig.get("mobilemoney.apikey");

        try {
            String formatted = formatPhone(phone);
            String params =
                "username="     + enc(username) +
                "&productName=" + enc(PRODUCT_NAME) +
                "&phoneNumber=" + enc(formatted) +
                "&currencyCode="+ enc(CURRENCY) +
                "&amount="      + (int) amount +
                "&metadata="    + enc(description);

            String response = post(AT_CHECKOUT_URL, params, apiKey);
            if (response.contains("PendingConfirmation") || response.contains("Success")) {
                return "✅ Payment request sent to " + formatted +
                       ".\nThe member will receive a prompt on their phone.\n" +
                       "They enter their PIN to approve UGX " + String.format("%,.0f", amount) + ".";
            }
            return "❌ Payment request failed: " + response;
        } catch (Exception e) {
            return "❌ Mobile Money error: " + e.getMessage();
        }
    }

    /**
     * DISBURSE loan to member's phone (B2C — Business to Customer).
     * Called automatically when a loan is approved.
     * Member receives money directly in their mobile wallet + SMS confirmation.
     */
    public static String disburseLoan(String phone, double amount, String description) {
        if (!AppConfig.getBool("mobilemoney.enabled")) {
            System.out.println("[MOBILE MONEY] Disbursement skipped — not configured. " +
                               "Amount: UGX " + String.format("%,.0f", amount) + " to " + phone);
            return "Not configured — manual disbursement required.";
        }

        String username = AppConfig.get("mobilemoney.username");
        String apiKey   = AppConfig.get("mobilemoney.apikey");

        try {
            String formatted = formatPhone(phone);

            // B2C request body (JSON)
            String jsonBody = "{" +
                "\"username\":\"" + username + "\"," +
                "\"productName\":\"" + PRODUCT_NAME + "\"," +
                "\"recipients\":[{" +
                    "\"phoneNumber\":\"" + formatted + "\"," +
                    "\"currencyCode\":\"" + CURRENCY + "\"," +
                    "\"amount\":" + (int) amount + "," +
                    "\"reason\":\"BusinessPayment\"," +
                    "\"metadata\":{\"description\":\"" + description + "\"}" +
                "}]" +
            "}";

            URL url = new URL(AT_B2C_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apiKey", apiKey);
            conn.setDoOutput(true);
            conn.getOutputStream().write(jsonBody.getBytes(StandardCharsets.UTF_8));

            int code = conn.getResponseCode();
            BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            String response = sb.toString();
            if (code == 200 || code == 201) {
                return "✅ UGX " + String.format("%,.0f", amount) +
                       " sent to " + formatted + ". Member will receive SMS confirmation.";
            }
            return "❌ Disbursement failed (HTTP " + code + "): " + response;
        } catch (Exception e) {
            return "❌ Disbursement error: " + e.getMessage();
        }
    }

    /**
     * Manual payment instructions shown when mobile money is not configured.
     */
    public static String getManualPaymentInstructions(String reference, double amount) {
        return "📱 PAY VIA MOBILE MONEY\n\n" +
               "Amount: UGX " + String.format("%,.0f", amount) + "\n" +
               "Reference: " + reference + "\n\n" +
               "MTN Mobile Money:\n" +
               "  Dial *165*3# → Send Money\n" +
               "  SACCO Number: 0700 XXX XXX\n\n" +
               "Airtel Money:\n" +
               "  Dial *185# → Make Payment\n" +
               "  SACCO Number: 0752 XXX XXX\n\n" +
               "Use '" + reference + "' as your reference.\n" +
               "Show receipt to SACCO staff for confirmation.\n\n" +
               "To enable automatic payments, ask admin to configure\n" +
               "Mobile Money in Settings.";
    }

    private static String post(String urlStr, String params, String apiKey) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setRequestProperty("apiKey", apiKey);
        conn.setDoOutput(true);
        conn.getOutputStream().write(params.getBytes(StandardCharsets.UTF_8));

        int code = conn.getResponseCode();
        InputStream is = code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private static String enc(String s) throws UnsupportedEncodingException {
        return URLEncoder.encode(s, "UTF-8");
    }

    private static String formatPhone(String phone) {
        phone = phone.trim().replaceAll("\\s+", "");
        if (phone.startsWith("07") || phone.startsWith("03")) return "+256" + phone.substring(1);
        if (phone.startsWith("256")) return "+" + phone;
        return phone;
    }
}
